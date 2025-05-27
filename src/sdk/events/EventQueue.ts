type TTask = () => Promise<void>

export class EventQueue {
    private queue: TTask[] = [];
    private processing = false;

    enqueue(task: TTask) {
        this.queue.push(task);
        if (!this.processing) {
            this.processNext();
        }
    }

    clear() {
        this.queue = []
    }

    private async processNext() {
        if (this.queue.length === 0) {
            this.processing = false;
            return;
        }

        this.processing = true;
        const task = this.queue.shift();
        if (task) {
            try {
                await task();
            } catch (e) {
                console.error('EventQueue error:', e);
            }
            this.processNext();
        }
    }
}
