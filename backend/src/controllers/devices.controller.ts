import { Request, Response } from 'express';
import deviceSpecsService from '../services/energy-star.service';

class DevicesController {
    // In-memory storage for devices (temporary)
    private devices: any[] = [];

    /**
     * Search Energy Star database for devices
     * POST /api/devices/search
     */
    async searchDevices(req: Request, res: Response) {
        try {
            const { deviceType, brand, model } = req.body;

            if (!brand && !model) {
                return res.status(400).json({
                    error: 'Please provide either brand or model to search',
                });
            }

            const devices = await deviceSpecsService.searchDevices({
                deviceType,
                brand,
                model,
            });

            return res.json({
                found: devices.length > 0,
                count: devices.length,
                devices,
            });
        } catch (error: any) {
            console.error('Search error:', error);
            return res.status(500).json({
                error: 'Failed to search devices',
                message: error.message,
            });
        }
    }

    /**
     * Add device to user's home
     * POST /api/devices
     */
    async addDevice(req: Request, res: Response) {
        try {
            const {
                brand,
                modelNumber,
                productName,
                deviceType,
                room,
                customName,
                priority, // NEW: Device priority
                energyStarSpecs,
            } = req.body;

            // Save to in-memory storage
            const device = {
                id: `dev_${Date.now()}`,
                userId: 'user123', // TODO: Get from auth middleware when implemented
                brand,
                modelNumber,
                productName,
                deviceType,
                room,
                customName: customName || productName,
                energyStarSpecs,
                createdAt: new Date().toISOString(),
                status: 'active', // Default status
                power: energyStarSpecs?.powerRatingW || 0, // Extract power for dashboard
            };

            this.devices.push(device);

            return res.status(201).json({
                message: 'Device added successfully',
                device,
            });
        } catch (error: any) {
            console.error('Add device error:', error);
            return res.status(500).json({
                error: 'Failed to add device',
                message: error.message,
            });
        }
    }

    /**
     * Get user's devices
     * GET /api/devices
     */
    async getDevices(req: Request, res: Response) {
        try {
            const userId = 'user123'; // TODO: Get from auth middleware when implemented

            return res.json({
                devices: this.devices,
                count: this.devices.length,
            });
        } catch (error: any) {
            console.error('Get devices error:', error);
            return res.status(500).json({
                error: 'Failed to fetch devices',
                message: error.message,
            });
        }
    }

    /**
     * Update device
     * PATCH /api/devices/:id
     */
    async updateDevice(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const updates = req.body;

            // Find and update device in in-memory storage
            const deviceIndex = this.devices.findIndex(d => d.id === id);

            if (deviceIndex === -1) {
                return res.status(404).json({
                    error: 'Device not found',
                });
            }

            // Update device with new data
            this.devices[deviceIndex] = {
                ...this.devices[deviceIndex],
                ...updates,
            };

            return res.json({
                message: 'Device updated successfully',
                device: this.devices[deviceIndex],
            });
        } catch (error: any) {
            console.error('Update device error:', error);
            return res.status(500).json({
                error: 'Failed to update device',
                message: error.message,
            });
        }
    }

    /**
     * Delete device
     * DELETE /api/devices/:id
     */
    async deleteDevice(req: Request, res: Response) {
        try {
            const { id } = req.params;

            // TODO: Delete from database

            return res.json({
                message: 'Device deleted successfully',
                deviceId: id,
            });
        } catch (error: any) {
            console.error('Delete device error:', error);
            return res.status(500).json({
                error: 'Failed to delete device',
                message: error.message,
            });
        }
    }
}

export default new DevicesController();
