import { Request, Response } from 'express';

/**
 * Usage Survey Questions for each device
 */
const SURVEY_QUESTIONS = {
    frequency: {
        question: 'How often do you use this device?',
        type: 'select',
        options: ['daily', 'few_times_per_week', 'rarely', 'seasonal'],
    },
    hoursPerDay: {
        question: 'On average, how many hours per day do you use it?',
        type: 'number',
        min: 0,
        max: 24,
    },
    usageTimes: {
        question: 'When do you typically use this device? (Select all that apply)',
        type: 'multi-select',
        options: [
            { value: 'morning', label: 'Morning (6am - 12pm)' },
            { value: 'afternoon', label: 'Afternoon (12pm - 6pm)' },
            { value: 'evening', label: 'Evening (6pm - 12am)' },
            { value: 'night', label: 'Night (12am - 6am)' },
        ],
    },
    room: {
        question: 'Which room is this device in?',
        type: 'select',
        options: [
            'living_room',
            'bedroom',
            'kitchen',
            'dining_room',
            'bathroom',
            'office',
            'garage',
            'outdoor',
            'other',
        ],
    },
};

interface UsagePattern {
    deviceId: string;
    frequency: string;
    hoursPerDay: number;
    usageTimes: string[];
    room: string;
    updatedAt: string;
}

class SurveyController {
    /**
     * Get survey questions for a device
     * GET /api/devices/:id/survey
     */
    async getSurveyQuestions(req: Request, res: Response) {
        try {
            const { id } = req.params;

            // TODO: Verify device exists and belongs to user

            return res.json({
                deviceId: id,
                questions: SURVEY_QUESTIONS,
            });
        } catch (error: any) {
            console.error('Get survey error:', error);
            return res.status(500).json({
                error: 'Failed to get survey questions',
                message: error.message,
            });
        }
    }

    /**
     * Submit usage pattern survey for a device
     * POST /api/devices/:id/survey
     */
    async submitSurvey(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { frequency, hoursPerDay, usageTimes, room } = req.body;

            // Validate inputs
            if (!frequency || hoursPerDay === undefined || !usageTimes || !room) {
                return res.status(400).json({
                    error: 'Missing required fields',
                    required: ['frequency', 'hoursPerDay', 'usageTimes', 'room'],
                });
            }

            if (hoursPerDay < 0 || hoursPerDay > 24) {
                return res.status(400).json({
                    error: 'hoursPerDay must be between 0 and 24',
                });
            }

            // TODO: Save to database
            const usagePattern: UsagePattern = {
                deviceId: id,
                frequency,
                hoursPerDay,
                usageTimes,
                room,
                updatedAt: new Date().toISOString(),
            };

            return res.status(200).json({
                message: 'Usage pattern saved successfully',
                usagePattern,
            });
        } catch (error: any) {
            console.error('Submit survey error:', error);
            return res.status(500).json({
                error: 'Failed to save usage pattern',
                message: error.message,
            });
        }
    }

    /**
     * Get usage pattern for a device
     * GET /api/devices/:id/usage-pattern
     */
    async getUsagePattern(req: Request, res: Response) {
        try {
            const { id } = req.params;

            // TODO: Fetch from database
            // For now, return null (not completed yet)
            return res.json({
                deviceId: id,
                usagePattern: null,
            });
        } catch (error: any) {
            console.error('Get usage pattern error:', error);
            return res.status(500).json({
                error: 'Failed to get usage pattern',
                message: error.message,
            });
        }
    }
}

export default new SurveyController();
export { UsagePattern, SURVEY_QUESTIONS };
