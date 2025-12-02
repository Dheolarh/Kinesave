import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface ControllerMessage {
    type: string;
    [key: string]: any;
}

export class ControllerProcess {
    private process?: ChildProcess;
    private messageHandlers: Map<string, (data: any) => void> = new Map();
    private isReady = false;
    private readyCallbacks: Array<() => void> = [];

    constructor() {
        this.on('ready', () => {
            this.isReady = true;
            this.readyCallbacks.forEach(cb => cb());
            this.readyCallbacks = [];
        });
    }

    async start(): Promise<void> {
        if (this.process) {
            console.log('Controller process already running');
            return;
        }

        return new Promise((resolve, reject) => {
            console.log('Starting Matter controller process...');

            // Spawn the controller process with tsx to run TypeScript directly
            const scriptPath = path.join(__dirname, 'matter-cli-wrapper.ts');
            this.process = spawn('npx', ['tsx', scriptPath], {
                stdio: ['pipe', 'pipe', 'pipe'],
                cwd: path.join(__dirname, '..', '..')
            });

            let buffer = '';

            // Handle stdout messages
            this.process.stdout?.on('data', (data) => {
                buffer += data.toString();
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (!line.trim()) continue;

                    try {
                        const message: ControllerMessage = JSON.parse(line);
                        console.log(`Controller message: ${message.type}`);

                        const handler = this.messageHandlers.get(message.type);
                        if (handler) {
                            handler(message);
                        }
                    } catch (error) {
                        console.error('Failed to parse controller message:', line);
                    }
                }
            });

            // Handle stderr
            this.process.stderr?.on('data', (data) => {
                console.error('Controller stderr:', data.toString());
            });

            // Handle process exit
            this.process.on('exit', (code) => {
                console.log(`Controller process exited with code ${code}`);
                this.process = undefined;
                this.isReady = false;
            });

            // Handle process errors
            this.process.on('error', (error) => {
                console.error('Controller process error:', error);
                reject(error);
            });

            // Wait for ready signal
            this.once('ready', () => {
                console.log('Controller process ready');
                resolve();
            });

            // Timeout if not ready within 10 seconds
            setTimeout(() => {
                if (!this.isReady) {
                    reject(new Error('Controller process failed to start within 10 seconds'));
                }
            }, 10000);
        });
    }

    stop(): void {
        if (this.process) {
            console.log('Stopping Matter controller process...');
            this.process.kill();
            this.process = undefined;
            this.isReady = false;
        }
    }

    sendMessage(message: any): void {
        if (!this.process || !this.process.stdin) {
            throw new Error('Controller process not running');
        }

        this.process.stdin.write(JSON.stringify(message) + '\n');
    }

    async commission(pairingCode: string): Promise<any> {
        await this.waitForReady();

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                this.off('commissionSuccess');
                this.off('error');
                reject(new Error('Commission timeout'));
            }, 30000); // 30 second timeout

            this.once('commissionSuccess', (data) => {
                clearTimeout(timeout);
                this.off('error');
                resolve(data);
            });

            this.once('error', (data) => {
                clearTimeout(timeout);
                this.off('commissionSuccess');
                reject(new Error(data.message || 'Commission failed'));
            });

            this.sendMessage({ type: 'commission', pairingCode });
        });
    }

    on(event: string, handler: (data: any) => void): void {
        this.messageHandlers.set(event, handler);
    }

    once(event: string, handler: (data: any) => void): void {
        const wrappedHandler = (data: any) => {
            this.off(event);
            handler(data);
        };
        this.on(event, wrappedHandler);
    }

    off(event: string): void {
        this.messageHandlers.delete(event);
    }

    private async waitForReady(): Promise<void> {
        if (this.isReady) return;

        return new Promise((resolve) => {
            this.readyCallbacks.push(resolve);
        });
    }
}
