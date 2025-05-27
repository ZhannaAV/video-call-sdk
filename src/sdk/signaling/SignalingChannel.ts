import {TypedEventEmitter} from '../utils/EventEmitter';

type Message = { type: string; [key: string]: any };

export type SignalingEvents = {
    newProducer: (producerId: string, userId: string) => void;
    deleteProducer: (producerId: string, userId: string) => void;

};

export class SignalingChannel extends TypedEventEmitter<SignalingEvents> {
    private url: string;
    private socket!: WebSocket;
    private pending = new Map<string, (data: any) => void>();

    constructor(url: string) {
        super();
        this.url = url
    }

    async connect(): Promise<void> {
        this.socket = new WebSocket(this.url) as WebSocket;

        await new Promise<void>((resolve, reject) => {
            this.socket.onopen = () => resolve();
            this.socket.onerror = (err) => reject(err);
        });

        this.socket.onmessage = (event) => {
            const msg: Message = JSON.parse(event.data);
            console.log(msg)
            if (msg.type === 'newProducer') {
                const {producerId, userId} = msg;
                this.emit('newProducer', producerId, userId);
            }

            if (msg.type === 'deleteProducer') {
                const {producerId, userId} = msg;
                this.emit('deleteProducer', producerId, userId);
            }

            if (msg.requestId && this.pending.has(msg.requestId)) {
                const resolver = this.pending.get(msg.requestId);
                resolver!(msg.data);
                this.pending.delete(msg.requestId);
            }
        };
    }

    send(msg: Message) {
        this.socket.send(JSON.stringify(msg));
    }

    request<T>(type: string, payload?: Record<string, any>): Promise<T> {
        const requestId = crypto.randomUUID();
        const msg = {type, requestId, payload};
        this.send(msg);

        return new Promise((resolve) => {
            this.pending.set(requestId, resolve);
        });
    }

    async disconnect(): Promise<void> {
        await new Promise<void>((resolve, reject) => {
            if (!this.socket) {
                return resolve();
            }

            if (this.socket.readyState === WebSocket.CLOSED) {
                return resolve();
            }

            const socket = this.socket;

            socket.onclose = () => {
                console.log('WebSocket закрыт');
                resolve();
            };

            socket.close(1000, 'Client left');

            setTimeout(() => {
                if (socket.readyState !== WebSocket.CLOSED) reject(new Error('WebSocket did not close in time'))
            }, 3000)
        });
    }
}
