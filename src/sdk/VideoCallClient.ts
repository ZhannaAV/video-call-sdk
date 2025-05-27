import {Device, types as MediasoupTypes} from 'mediasoup-client';
import {SignalingChannel} from './signaling/SignalingChannel';
import {EventQueue} from './events/EventQueue';
import {TypedEventEmitter} from './utils/EventEmitter';
import {createSendTransport} from "./transport/SendTransport";
import {createRecvTransport} from "./transport/RecvTransport";
import {RtpParameters} from "mediasoup-client/lib/RtpParameters";

interface IConsume {
    id: string;
    kind: 'audio' | 'video';
    rtpParameters: RtpParameters
}

export interface VideoCallClientEvents {
    connected: () => void;
    disconnected: () => void;
    error: (error: Error) => void;
    newTrack: (track: MediaStreamTrack, userId: string) => void;
    userLeft: (userId: string) => void;
}

export class VideoCallClient extends TypedEventEmitter<VideoCallClientEvents> {
    private device?: Device;
    private signaling: SignalingChannel;
    private queue: EventQueue;
    private sendTransport?: MediasoupTypes.Transport;
    private recvTransport?: MediasoupTypes.Transport;

    constructor(signaling: SignalingChannel) {
        super();
        this.signaling = signaling;
        this.queue = new EventQueue();
    }

    async joinCall(roomId: string, userId: string): Promise<void> {
        try {
            await this.signaling.connect();

            const routerRtpCapabilities = await this.signaling.request<MediasoupTypes.RtpCapabilities>('getRouterRtpCapabilities');
            this.device = new Device();
            await this.device.load({routerRtpCapabilities});

            this.sendTransport = await createSendTransport(this.device, this.signaling);
            this.recvTransport = await createRecvTransport(this.device!, this.signaling);

            this.setupSignalingHandlers();

            this.signaling.send({type: 'join', roomId, userId});
            await this.produce(userId);

            this.emit('connected');
        } catch (err) {
            this.emit('error', err as Error);
        }
    }

    async leaveCall(roomId: string, userId: string): Promise<void> {
        try {
            this.signaling.send({type: 'leave', roomId, userId});

            if (this.sendTransport) {
                this.sendTransport.close();
            }
            if (this.recvTransport) {
                this.recvTransport.close();
            }

            this.sendTransport = undefined;
            this.recvTransport = undefined;

            this.queue.clear();

            await this.signaling.disconnect();
            this.signaling.off()
            this.emit('disconnected');
        } catch (err) {
            this.emit('error', err as Error);
        }
    }

    private setupSignalingHandlers() {
        this.signaling.on('newProducer', (producerId, userId) => {
            this.queue.enqueue(async () => {
                await this.consume(producerId, userId);
            });
        });
        this.signaling.on('deleteProducer', (producerId, userId) => {
            this.emit('userLeft', userId);
        });
    }

    private async produce(userId: string) {
        const stream = await navigator.mediaDevices.getUserMedia({video: true});
        const track = stream.getVideoTracks()[0];
        await this.sendTransport!.produce({track});
        this.emit('newTrack', track, userId);
    }

    private async consume(producerId: string, userId: string) {
        const {
            id,
            kind,
            rtpParameters
        } = await this.signaling.request<IConsume>('consume', {
            producerId
        });

        const consumer = await this.recvTransport!.consume({
            id,
            producerId,
            kind,
            rtpParameters
        });

        this.emit('newTrack', consumer.track, userId);
    }
}
