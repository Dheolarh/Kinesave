import { Router } from 'express';
import devicesController from '../controllers/devices.controller';

const router = Router();

// Device search and management routes
// Device search and management routes
router.post('/search', (req, res) => devicesController.searchDevices(req, res));
router.post('/', (req, res) => devicesController.addDevice(req, res));
router.get('/', (req, res) => devicesController.getDevices(req, res));
router.patch('/:id', (req, res) => devicesController.updateDevice(req, res));
router.delete('/:id', (req, res) => devicesController.deleteDevice(req, res));

export default router;
