import { Router } from 'express';
import devicesController from '../controllers/devices.controller';

const router = Router();

// Device search and management routes
router.post('/search', devicesController.searchDevices);
router.post('/', devicesController.addDevice);
router.get('/', devicesController.getDevices);
router.patch('/:id', devicesController.updateDevice);
router.delete('/:id', devicesController.deleteDevice);

export default router;
