import { Router } from 'express';
import { UserDataController } from '../controllers/userdata.controller';

const router = Router();
const controller = new UserDataController();

router.post('/save', (req, res) => controller.saveUserData(req, res));
router.get('/', (req, res) => controller.getUserData(req, res));

export default router;
