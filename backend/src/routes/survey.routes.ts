import { Router } from 'express';
import surveyController from '../controllers/survey.controller';

const router = Router();

// Survey routes for device usage patterns
router.get('/:id/survey', surveyController.getSurveyQuestions);
router.post('/:id/survey', surveyController.submitSurvey);
router.get('/:id/usage-pattern', surveyController.getUsagePattern);

export default router;
