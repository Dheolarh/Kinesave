import { MatterDevice } from './types.js';
import { ControllerProcess } from './controller-process.js';

class MatterController {
    private discoveredDevices: Map<string, MatterDevice> = new Map();
    private isInitialized = false;
    private controllerProcess?: ControllerProcess;

    async initialize() {
        if (this.isInitialized) return;

        try {
            console.log('Initializing Matter controller with IPC...');

            // Create and start the controller process
            this.controllerProcess = new ControllerProcess();
            await this.controllerProcess.start();

            this.isInitialized = true;
            console.log('Matter controller initialized successfully (IPC mode)');

        } catch (error) {
            console.error('Failed to initialize Matter controller:', error);
            throw error;
        }
    }

    private updateDeviceList() {
        // Placeholder for device listing from storage
        // Once devices are commissioned, we'll load them from storage
        this.discoveredDevices.clear();
    }

    async scanForDevices(): Promise<MatterDevice[]> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        this.updateDeviceList();
        console.log(`Returning ${this.discoveredDevices.size} commissioned device(s)`);
        return Array.from(this.discoveredDevices.values());
    }

    getDevices(): MatterDevice[] {
        return Array.from(this.discoveredDevices.values());
    }

    getDevice(id: string): MatterDevice | undefined {
        return this.discoveredDevices.get(id);
    }

    async controlDevice(id: string, command: any): Promise<boolean> {
        console.log(`Controlling device ${id}:`, command);
        // TODO: Implement actual control in Phase 3
        return true;
    }

    async commissionDevice(pairingCode: string): Promise<boolean> {
        if (!this.controllerProcess) {
            throw new Error('Controller not initialized');
        }

        console.log(`Attempting to commission device with code: ${pairingCode}`);

        try {
            // Send commission request to controller process
            const result = await this.controllerProcess.commission(pairingCode);
            console.log('Commission result:', result);

            // Update the discovered devices list
            this.updateDeviceList();

            return true;
        } catch (error) {
            console.error('Commissioning failed:', error);
            throw error;
        }
    }

    async shutdown() {
        if (this.controllerProcess) {
            this.controllerProcess.stop();
            this.controllerProcess = undefined;
        }
        this.isInitialized = false;
    }
}

// Export singleton instance
export const matterController = new MatterController();

// Cleanup on process exit
process.on('SIGINT', async () => {
    await matterController.shutdown();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await matterController.shutdown();
    process.exit(0);
});
