type THandler = (...args:any[]) => void

export class TypedEventEmitter<TEvents extends {[K in keyof TEvents]: THandler}> {
    private listeners: { [K in keyof TEvents]?: TEvents[K][] } = {};

    on<K extends keyof TEvents>(event: K, handler: TEvents[K]): void {
        const handlers = this.listeners[event] ?? [];
        handlers.push(handler);
        this.listeners[event] = handlers;
    }

    off(): void {
        this.listeners = {};
    }

    emit<K extends keyof TEvents>(event: K, ...args: any[]): void {
        const handlers = this.listeners[event] ?? [];
        for (const handler of handlers) {
            handler(...args);
        }
    }
}
