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
     * Create initial user profile
     * POST /api/userdata/create
     */
    async createUserProfile(req: Request, res: Response) {
        try {
            const { userName, userId } = req.body;

            if (!userName || !userId) {
                return res.status(400).json({
                    success: false,
                    error: 'userName and userId are required',
                });
            }

            // Save userId to tracking file
            saveUserIdToTracking(userId);

            // Create initial user profile structure
            const initialProfile = {
                userName,
                userId,
                location: null,
                energyCosts: null,
                devices: [],
                aboutUser: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            const userFile = this.getUserFilePath(userName, userId);

            // Write to file
            fs.writeFileSync(
                userFile,
                JSON.stringify(initialProfile, null, 2),
                'utf-8'
            );

            res.json({
                success: true,
                message: 'User profile created successfully',
                userId,
                fileName: path.basename(userFile),
            });
        } catch (error) {
            console.error('Error creating user profile:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create user profile',
            });
        }
    }

    /**
     * Update user profile with partial data
     * PATCH /api/userdata/update
     */
    async updateUserProfile(req: Request, res: Response) {
        try {
            const { userId, ...updates } = req.body;

            if (!userId) {
                return res.status(400).json({
                    success: false,
                    error: 'userId is required',
                });
            }

            // Find the user file by userId
            const userFile = this.getUserFilePath('', userId);

            if (!fs.existsSync(userFile)) {
                return res.status(404).json({
                    success: false,
                    error: 'User profile not found',
                });
            }

            // Read existing data
            const existingData = JSON.parse(fs.readFileSync(userFile, 'utf-8'));

            // Merge updates
            const updatedData = {
                ...existingData,
                ...updates,
                updatedAt: new Date().toISOString(),
            };

            // Write back to file
            fs.writeFileSync(
                userFile,
                JSON.stringify(updatedData, null, 2),
                'utf-8'
            );

            res.json({
                success: true,
                message: 'User profile updated successfully',
                data: updatedData,
            });
        } catch (error) {
            console.error('Error updating user profile:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update user profile',
            });
        }
    }

    /**
     * Get user profile by userId
     * GET /api/userdata/profile?userId=xxx
     */
    async getUserProfile(req: Request, res: Response) {
        try {
            const { userId } = req.query;

            if (!userId || typeof userId !== 'string') {
                return res.status(400).json({
                    success: false,
                    error: 'userId is required',
                });
            }

            const userFile = this.getUserFilePath('', userId);

            if (!fs.existsSync(userFile)) {
                return res.status(404).json({
                    success: false,
                    error: 'User profile not found',
                });
            }

            const userData = JSON.parse(fs.readFileSync(userFile, 'utf-8'));

            res.json({
                success: true,
                data: userData,
            });
        } catch (error) {
            console.error('Error getting user profile:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get user profile',
            });
        }
    }

    /**
     * Get user data from JSON file (legacy endpoint)
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

export default new UserDataController();
