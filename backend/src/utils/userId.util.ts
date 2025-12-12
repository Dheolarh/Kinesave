import * as fs from 'fs';
import * as path from 'path';

const USER_IDS_FILE = path.join(__dirname, '../../data/userIds.json');

/**
 * Generate 15 random digits
 */
function generate15Digits(): string {
    let digits = '';
    for (let i = 0; i < 15; i++) {
        digits += Math.floor(Math.random() * 10).toString();
    }
    return digits;
}

/**
 * Load existing user IDs from tracking file
 */
function loadUserIds(): string[] {
    try {
        if (fs.existsSync(USER_IDS_FILE)) {
            const data = fs.readFileSync(USER_IDS_FILE, 'utf-8');
            return JSON.parse(data);
        }
        return [];
    } catch (error) {
        console.error('Error loading user IDs:', error);
        return [];
    }
}

/**
 * Save user ID to tracking file
 */
function saveUserId(userId: string): void {
    try {
        const userIds = loadUserIds();
        if (!userIds.includes(userId)) {
            userIds.push(userId);
            fs.writeFileSync(USER_IDS_FILE, JSON.stringify(userIds, null, 2), 'utf-8');
        }
    } catch (error) {
        console.error('Error saving user ID:', error);
    }
}

/**
 * Check if user ID is unique
 */
function isIdUnique(userId: string): boolean {
    const userIds = loadUserIds();
    return !userIds.includes(userId);
}

/**
 * Generate unique user ID with format: username_{15_digits}
 */
export function generateUniqueUserId(userName: string): string {
    const sanitizedName = userName.toLowerCase().replace(/\s+/g, '_');
    let userId: string;
    let attempts = 0;
    const maxAttempts = 100;

    do {
        const randomDigits = generate15Digits();
        userId = `${sanitizedName}_${randomDigits}`;
        attempts++;

        if (attempts >= maxAttempts) {
            throw new Error('Failed to generate unique user ID after maximum attempts');
        }
    } while (!isIdUnique(userId));

    // Save the generated ID
    saveUserId(userId);

    return userId;
}

/**
 * Check if a user ID exists in the tracking file
 */
export function userIdExists(userId: string): boolean {
    return !isIdUnique(userId);
}
