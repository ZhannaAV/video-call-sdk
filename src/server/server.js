const WebSocket = require('ws');
const mediasoup = require('mediasoup');

const clients = new Map();
let router;

(async () => {
    const worker = await mediasoup.createWorker();
    router = await worker.createRouter({
        mediaCodecs: [
            {
                kind: 'video',
                mimeType: 'video/VP8',
                clockRate: 90000,
                parameters: {},
                rtcpFeedback: [
                    {type: 'nack'},
                    {type: 'nack', parameter: 'pli'},
                    {type: 'ccm', parameter: 'fir'},
                    {type: 'goog-remb'}
                ]
            }
        ]
    });

    console.log('Router создан');
})();


const wss = new WebSocket.Server({port: 3000}, () =>
    console.log('Signaling server running on ws://localhost:3000')
);

wss.on('connection', (ws) => {
    clients.set(ws, {
        userId: undefined,
        producer: undefined,
        sendTransport: undefined,
        recvTransport: undefined,
        joined: false,
    });

    console.log('Новый клиент');

    ws.on('message', async (msg) => {
        const data = JSON.parse(msg);
        console.log('Получено сообщение:', data);

        if (data.type === 'getRouterRtpCapabilities') {
            const rtpCaps = router.rtpCapabilities;

            ws.send(JSON.stringify({
                type: 'getRouterRtpCapabilities',
                requestId: data.requestId,
                data: rtpCaps
            }));
        }

        if (data.type === 'createSendTransport') {
            const transport = await router.createWebRtcTransport({
                listenIps: [{ip: '127.0.0.1', announcedIp: null}],
                enableUdp: true,
                enableTcp: true,
                preferUdp: true
            });

            const clientData = clients.get(ws);
            clientData.sendTransport = transport;

            ws.send(JSON.stringify({
                type: 'createSendTransport',
                requestId: data.requestId,
                data: {
                    id: transport.id,
                    iceParameters: transport.iceParameters,
                    iceCandidates: transport.iceCandidates,
                    dtlsParameters: transport.dtlsParameters
                }
            }));
        }

        if (data.type === 'createRecvTransport') {
            const transport = await router.createWebRtcTransport({
                listenIps: [{ip: '127.0.0.1', announcedIp: null}],
                enableUdp: true,
                enableTcp: true,
                preferUdp: true
            });

            const clientData = clients.get(ws);
            clientData.recvTransport = transport;

            ws.send(JSON.stringify({
                type: 'createRecvTransport',
                requestId: data.requestId,
                data: {
                    id: transport.id,
                    iceParameters: transport.iceParameters,
                    iceCandidates: transport.iceCandidates,
                    dtlsParameters: transport.dtlsParameters
                }
            }));
        }

        if (data.type === 'connectTransport') {
            const clientData = clients.get(ws);
            const {dtlsParameters, transportId} = data.payload;

            const transport =
                clientData.sendTransport?.id === transportId
                    ? clientData.sendTransport
                    : clientData.recvTransport?.id === transportId
                        ? clientData.recvTransport
                        : null;

            if (!transport) return;

            await transport.connect({dtlsParameters});

            ws.send(JSON.stringify({
                type: 'connectTransport',
                requestId: data.requestId,
                data: 'ok'
            }));
        }

        if (data.type === 'join') {
            const clientData = clients.get(ws);
            clientData.userId = data.userId

            for (const [clientWs, client] of clients.entries()) {
                if (clientWs !== ws && client.joined && clientWs.readyState === WebSocket.OPEN) {
                    ws.send(
                        JSON.stringify({
                            type: 'newProducer',
                            producerId: client.producer.id,
                            userId: client.userId
                        })
                    );
                }
            }
            clientData.joined = true
        }

        if (data.type === 'leave') {
            const clientData = clients.get(ws);

            for (const [clientWs, client] of clients.entries()) {
                if (clientWs !== ws && client.joined && clientWs.readyState === WebSocket.OPEN) {
                    clientWs.send(JSON.stringify({
                        type: 'deleteProducer',
                        producerId: clientData.producer.id,
                        userId: clientData.userId
                    }));
                }
            }
            clientData.producer.close()
            clients.delete(ws)
        }

        if (data.type === 'produce') {
            const {kind, rtpParameters} = data.payload
            const clientData = clients.get(ws);
            const producer = await clientData.sendTransport.produce({kind, rtpParameters});
            clientData.producer = producer;

            ws.send(JSON.stringify({
                type: 'produce',
                requestId: data.requestId,
                data: {id: producer.id}
            }));

            for (const [clientWs, client] of clients.entries()) {
                if (clientWs !== ws && client.joined && clientWs.readyState === WebSocket.OPEN) {
                    clientWs.send(JSON.stringify({
                        type: 'newProducer',
                        producerId: clientData.producer.id,
                        userId: clientData.userId
                    }));
                }
            }
        }

        if (data.type === 'consume') {
            const clientData = clients.get(ws)
            const {producerId} = data.payload;

            const consumer = await clientData.recvTransport.consume({
                producerId,
                rtpCapabilities: router.rtpCapabilities
            });

            ws.send(JSON.stringify({
                type: 'consume',
                requestId: data.requestId,
                data: {
                    id: consumer.id,
                    kind: consumer.kind,
                    rtpParameters: consumer.rtpParameters
                }
            }));
        }
    });

    ws.on('close', async () => {
        if (clients.get(ws)) {
            const clientData = clients.get(ws);

            await clientData.producer.close();

            for (const [clientWs, client] of clients.entries()) {
                if (clientWs !== ws && client.joined && clientWs.readyState === WebSocket.OPEN) {
                    clientWs.send(JSON.stringify({
                        type: 'deleteProducer',
                        producerId: clientData.producer.id,
                        userId: clientData.userId
                    }));
                }
            }

            clients.delete(ws)
        }
        console.log(`Пользователь отключился`);
    });
});
