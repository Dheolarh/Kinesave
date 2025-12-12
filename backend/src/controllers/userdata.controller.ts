import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { generateUniqueUserId } from '../utils/userId.util';

// Helper to save userId to tracking file
function saveUserIdToTracking(userId: string): void {
    try {
        const trackingFile = path.join(__dirname, '../../data/userIds.json');
        let userIds: string[] = [];

        if (fs.existsSync(trackingFile)) {
            const data = fs.readFileSync(trackingFile, 'utf-8');
            userIds = JSON.parse(data);
        }

        if (!userIds.includes(userId)) {
            userIds.push(userId);
            fs.writeFileSync(trackingFile, JSON.stringify(userIds, null, 2), 'utf-8');
        }
    } catch (error) {
        console.error('Error saving userId to tracking file:', error);
    }
}

export class UserDataController {
    private dataDir = path.join(__dirname, '../../data');

    constructor() {
        // Ensure data directory exists
        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir, { recursive: true });
        }
    }

    /**
     * Get user file path based on userId (preferred) or username
     */
    private getUserFilePath(userName?: string, userId?: string): string {
        let filename: string;

        if (userId) {
            // Use userId for filename: may_886135046969344.json
            filename = `${userId}.json`;
        } else if (userName) {
            // Fallback to username: may.json
            filename = `${userName.toLowerCase().replace(/\s+/g, '_')}.json`;
        } else {
            filename = 'userdata.json';
        }

        return path.join(this.dataDir, filename);
    }

    /**
     * Save complete user data to JSON file
     * POST /api/userdata/save
     * Body should include: { userName: "Takeda", userId?: "takeda_123...", ...otherData }
     */
    async saveUserData(req: Request, res: Response) {
        try {
            const userData = req.body;
            const userName = userData.userName || userData.aboutUser?.userName;

            // Generate userId if not provided
            if (!userData.userId) {
                userData.userId = generateUniqueUserId(userName);
            } else {
                // Save provided userId to tracking file
                saveUserIdToTracking(userData.userId);
            }

            const userFile = this.getUserFilePath(userName, userData.userId);

            // Write to file
            fs.writeFileSync(
                userFile,
                JSON.stringify(userData, null, 2),
                'utf-8'
            );

            res.json({
                success: true,
                message: 'User data saved successfully',
                userId: userData.userId,
                fileName: path.basename(userFile),
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
     * GET /api/userdata?userName=Takeda
     */
    async getUserData(req: Request, res: Response) {
        try {
            const userName = req.query.userName as string;
            const userFile = this.getUserFilePath(userName);

            if (fs.existsSync(userFile)) {
                const data = fs.readFileSync(userFile, 'utf-8');
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
