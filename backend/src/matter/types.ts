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
