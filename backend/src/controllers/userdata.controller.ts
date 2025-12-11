import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

export class UserDataController {
    private dataDir = path.join(__dirname, '../../data');
    private userDataFile = path.join(this.dataDir, 'userdata.json');

    constructor() {
        // Ensure data directory exists
        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir, { recursive: true });
        }
    }

    /**
     * Save complete user data to JSON file
     * POST /api/userdata/save
     */
    async saveUserData(req: Request, res: Response) {
        try {
            const userData = req.body;

            // Write to file
            fs.writeFileSync(
                this.userDataFile,
                JSON.stringify(userData, null, 2),
                'utf-8'
            );

            res.json({
                success: true,
                message: 'User data saved successfully',
                savedAt: new Date().toISOString(),
            });
        } catch (error) {
            console.error('Error saving user data:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to save user data',
            });
        }
    }

    /**
     * Get user data from JSON file
     * GET /api/userdata
     */
    async getUserData(req: Request, res: Response) {
        try {
            if (fs.existsSync(this.userDataFile)) {
                const data = fs.readFileSync(this.userDataFile, 'utf-8');
                res.json(JSON.parse(data));
            } else {
                res.status(404).json({
                    success: false,
                    error: 'No user data found',
                });
            }
        } catch (error) {
            console.error('Error reading user data:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to read user data',
            });
        }
    }
}
