import { Request, Response } from 'express';
import deviceSpecsService from '../services/energy-star.service';
import * as fs from 'fs';
import * as path from 'path';

class DevicesController {
    // In-memory storage for devices (temporary)
    private devices: any[] = [];
    private dataDir = path.join(__dirname, '../../data');
    private currentUserName: string = 'user'; // Default username

    /**
     * Get user file path based on username
     */
    private getUserFilePath(userName?: string): string {
        const filename = userName
            ? `${userName.toLowerCase().replace(/\s+/g, '_')}.json`
            : 'userdata.json';
        return path.join(this.dataDir, filename);
    }

    /**
     * Helper: Add device to user's JSON file
     */
    private addDeviceToUserFile(device: any) {
        try {
            const userFile = this.getUserFilePath(this.currentUserName);
            if (fs.existsSync(userFile)) {
                const data = JSON.parse(fs.readFileSync(userFile, 'utf-8'));

                // Initialize devices array if it doesn't exist
                if (!data.devices) {
                    data.devices = [];
                }

                // Add new device to the array with ID
                const deviceData = {
                    id: device.id, // Store the device ID
                    customName: device.customName,
                    originalName: device.productName,
                    deviceType: device.deviceType,
                    brand: device.brand || "Unknown",
                    modelNumber: device.modelNumber || "N/A",
                    wattage: device.energyStarSpecs?.powerRatingW || device.power || 0,
                    priority: device.priority || 0,
                    survey: device.survey || {
                        frequency: "daily",
                        hoursPerDay: 0,
                        usageTimes: [],
                        room: device.room || "Unassigned"
                    }
                };

                data.devices.push(deviceData);
                fs.writeFileSync(userFile, JSON.stringify(data, null, 2), 'utf-8');
            }
        } catch (error) {
            console.error('Error adding device to user file:', error);
        }
    }


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
                priority,
                energyStarSpecs,
                userName,
            } = req.body;

            // Update current user name for file operations
            if (userName) {
                this.currentUserName = userName;
            }

            // Create device object
            const device = {
                id: `dev_${Date.now()}`,
                userId: 'user123',
                brand,
                modelNumber,
                productName,
                deviceType,
                room,
                customName: customName || productName,
                priority,
                energyStarSpecs,
                createdAt: new Date().toISOString(),
                status: 'active',
                power: energyStarSpecs?.powerRatingW || 0,
            };

            // Add device directly to user's JSON file
            this.addDeviceToUserFile(device);

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
     * GET /api/devices?userName=<username>
     */
    async getDevices(req: Request, res: Response) {
        try {
            const { userName } = req.query;

            // Update current user name for file operations
            if (userName && typeof userName === 'string') {
                this.currentUserName = userName;
            }

            // Load devices from user's JSON file instead of in-memory array
            const userFile = this.getUserFilePath(this.currentUserName);

            if (fs.existsSync(userFile)) {
                const data = JSON.parse(fs.readFileSync(userFile, 'utf-8'));

                // Map devices to include necessary fields for frontend
                const devices = (data.devices || []).map((device: any) => ({
                    id: device.id, // Use ID from JSON
                    customName: device.customName,
                    name: device.originalName,
                    productName: device.originalName,
                    deviceType: device.deviceType,
                    brand: device.brand,
                    modelNumber: device.modelNumber,
                    power: device.wattage,
                    priority: device.priority,
                    status: 'active',
                    additionalSpecs: {
                        powerRatingW: device.wattage,
                    },
                    survey: device.survey,
                    room: device.survey?.room || 'Unassigned',
                }));

                return res.json({
                    devices,
                    count: devices.length,
                });
            }

            // If file doesn't exist, return empty array
            return res.json({
                devices: [],
                count: 0,
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
     * DELETE /api/devices/:id?userName=<username>
     */
    async deleteDevice(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { userName } = req.query;

            // Update current user name for file operations
            if (userName && typeof userName === 'string') {
                this.currentUserName = userName;
            }

            // Load devices from user's JSON file
            const userFile = this.getUserFilePath(this.currentUserName);

            if (fs.existsSync(userFile)) {
                const data = JSON.parse(fs.readFileSync(userFile, 'utf-8'));

                // Filter out the device to delete by ID
                const originalCount = (data.devices || []).length;
                data.devices = (data.devices || []).filter((device: any) => device.id !== id);

                // Check if a device was actually deleted
                if (data.devices.length === originalCount) {
                    return res.status(404).json({
                        error: 'Device not found',
                    });
                }

                // Save back to file
                fs.writeFileSync(userFile, JSON.stringify(data, null, 2), 'utf-8');

                return res.json({
                    message: 'Device deleted successfully',
                    deviceId: id,
                });
            }

            return res.status(404).json({
                error: 'User file not found',
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
