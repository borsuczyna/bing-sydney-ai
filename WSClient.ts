import { WebSocket } from "ws";
const delimeter = '\x1e';
export { delimeter };

export class WSClient {
    client: WebSocket;

    constructor(client: WebSocket) {
        this.client = client;
    }

    send(data: string | Object) {
        if (typeof data === 'object') {
            data = JSON.stringify(data) + delimeter;
        }

        this.client.send(data as string);
    }

    on(event: string, callback: (this: WebSocket, ...args: any[]) => void) {
        this.client.on(event, callback);
    }

    once(event: string, callback: (this: WebSocket, ...args: any[]) => void) {
        this.client.once(event, callback);
    }

    close() {
        this.client.close();
    }

    clearListeners(event?: string) {
        this.client.removeAllListeners(event);
    }
}

export async function createWSClient(url: string, options?: any): Promise<WSClient | undefined> {
    return new Promise((resolve, reject) => {
        try {
            let ws = new WebSocket(url, options);
            ws.on('open', () => {
                resolve(new WSClient(ws));
            });
            ws.on('error', (err) => {
                resolve(undefined);
            });
        } catch (err) {
            resolve(undefined);
        }
    });
}