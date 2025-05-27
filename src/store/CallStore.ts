import { makeAutoObservable } from 'mobx';

export class CallStore {
    roomId = 'room-call';
    connected = false;
    peerStreams: Map<string, MediaStream> = new Map();

    constructor() {
        makeAutoObservable(this);
    }

    setConnected(status: boolean) {
        this.connected = status;
    }

    updatePeerStream(userId: string, stream: MediaStream) {
            this.peerStreams.set(userId, stream);
    }

    removePeerStream(userId: string) {
            this.peerStreams.delete(userId);
    }

    get streams() {
        return Array.from(this.peerStreams.entries());
    }

    clearPeerStreams() {
        this.peerStreams.clear()
    }
}

export const store = new CallStore()
