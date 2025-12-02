// API client for communicating with KineSave Matter Backend

const API_BASE_URL = 'http://localhost:5000/api';

export interface MatterDevice {
    id: string;
    name: string;
    type: string;
    power?: number;
    status: 'active' | 'inactive';
    vendorId?: string;
    productId?: string;
    discriminator?: string;
    port?: number;
}

export interface DeviceScanResult {
    devices: MatterDevice[];
    count: number;
    timestamp: string;
}

/**
 * Fetch all discovered devices
 */
export async function fetchDevices(): Promise<DeviceScanResult> {
    try {
        const response = await fetch(`${API_BASE_URL}/devices`);
        if (!response.ok) {
            throw new Error('Failed to fetch devices');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching devices:', error);
        throw error;
    }
}

/**
 * Trigger a new device scan
 */
export async function scanDevices(): Promise<DeviceScanResult> {
    try {
        const response = await fetch(`${API_BASE_URL}/devices/scan`);
        if (!response.ok) {
            throw new Error('Failed to scan devices');
        }
        return await response.json();
    } catch (error) {
        console.error('Error scanning devices:', error);
        throw error;
    }
}

/**
 * Get details for a specific device
 */
export async function getDevice(id: string): Promise<MatterDevice> {
    try {
        const response = await fetch(`${API_BASE_URL}/devices/${id}`);
        if (!response.ok) {
            throw new Error(`Device ${id} not found`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching device:', error);
        throw error;
    }
}

/**
 * Send control command to a device
 */
export async function controlDevice(id: string, command: any): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE_URL}/devices/${id}/control`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ command }),
        });

        if (!response.ok) {
            throw new Error('Failed to control device');
        }

        const result = await response.json();
        return result.success;
    } catch (error) {
        console.error('Error controlling device:', error);
        throw error;
    }
}
