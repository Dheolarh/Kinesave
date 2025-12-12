import { Router } from 'express';
import { UserDataController } from '../controllers/userdata.controller';

const router = Router();
const controller = new UserDataController();

// New JSON-first endpoints
router.post('/create', (req, res) => controller.createUserProfile(req, res));
router.patch('/update', (req, res) => controller.updateUserProfile(req, res));
router.get('/profile', (req, res) => controller.getUserProfile(req, res));

// Legacy endpoints
router.post('/save', (req, res) => controller.saveUserData(req, res));
router.get('/', (req, res) => controller.getUserData(req, res));

export default router;
