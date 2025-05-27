import {Device, types as MediasoupTypes} from "mediasoup-client";
import {SignalingChannel} from "../signaling/SignalingChannel";
import {TransportOptions} from "mediasoup-client/lib/types";

export async function createRecvTransport(
    device: Device,
    signaling: SignalingChannel
): Promise<MediasoupTypes.Transport> {
    const transportInfo = await signaling.request<TransportOptions>('createRecvTransport');
    const transport = device.createRecvTransport(transportInfo);

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

    return transport;
}
