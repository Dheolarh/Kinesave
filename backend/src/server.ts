import express from 'express';
// Force reload
import cors from 'cors';
import { matterController } from './matter/controller.js';

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Matter controller on startup
(async () => {
    try {
        await matterController.initialize();
        console.log('Matter controller ready');
    } catch (error) {
        console.error('Failed to initialize Matter controller:', error);
    }
})();

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'KineSave Matter Backend is running' });
});

// Get all discovered devices
app.get('/api/devices', async (req, res) => {
    try {
        const devices = matterController.getDevices();
        res.json({
            devices,
            count: devices.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error fetching devices:', error);
        res.status(500).json({ error: 'Failed to fetch devices' });
    }
});

// Trigger device scan
app.get('/api/devices/scan', async (req, res) => {
    try {
        console.log('🔍 Scan requested');
        const devices = await matterController.scanForDevices();
        res.json({
            message: 'Device scan completed',
            devices,
            count: devices.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error scanning for devices:', error);
        res.status(500).json({ error: 'Failed to scan for devices' });
    }
});

// Get specific device
app.get('/api/devices/:id', async (req, res) => {
    try {
        const device = matterController.getDevice(req.params.id);
        if (!device) {
            return res.status(404).json({ error: 'Device not found' });
        }
        res.json(device);
    } catch (error) {
        console.error('Error fetching device:', error);
        res.status(500).json({ error: 'Failed to fetch device' });
    }
});

// Control device
app.post('/api/devices/:id/control', async (req, res) => {
    try {
        const { command } = req.body;
        await matterController.controlDevice(req.params.id, command);
        res.json({ success: true, message: 'Command sent successfully' });
    } catch (error) {
        console.error('Error controlling device:', error);
        res.status(500).json({ error: 'Failed to control device' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`KineSave Matter Backend running on http://localhost:${PORT}`);
    console.log(`Ready to discover Matter devices`);
    console.log(`Frontend should connect to: http://localhost:${PORT}/api`);
});
