import { Device, types as MediasoupTypes} from 'mediasoup-client';
import type { TransportOptions } from 'mediasoup-client/lib/types';
import { SignalingChannel } from '../signaling/SignalingChannel';

export async function createSendTransport(
    device: Device,
    signaling: SignalingChannel
): Promise<MediasoupTypes.Transport> {
    const transportInfo = await signaling.request<TransportOptions>('createSendTransport');
    const transport = device.createSendTransport(transportInfo);

    transport.on('connect', async ({ dtlsParameters }, callback, errback) => {
        try {
            await signaling.request('connectTransport', {
                transportId: transport.id,
                dtlsParameters
            });
            callback();
        } catch (err) {
            errback(err as Error);
        }
    });

    transport.on('produce', async ({ kind, rtpParameters }, callback, errback) => {
        try {
            const {id} = await signaling.request<{id: string}>('produce', {
                kind,
                rtpParameters
            });
            callback({ id });
        } catch (err) {
            errback(err as Error);
        }
    });

    return transport;
}
