const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// Session storage keys
const USER_ID_KEY = 'currentUserId';

/**
 * Store current user ID in sessionStorage (for current session only)
 */
export function setCurrentUserId(userId: string): void {
    sessionStorage.setItem(USER_ID_KEY, userId);
}

/**
 * Get current user ID from sessionStorage
 */
export function getCurrentUserId(): string | null {
    return sessionStorage.getItem(USER_ID_KEY);
}

/**
 * Clear current user ID (on logout)
 */
export function clearCurrentUserId(): void {
    sessionStorage.removeItem(USER_ID_KEY);
}

/**
 * Create initial user profile (called from SplashScreen)
 */
export async function createUserProfile(userName: string, userId: string): Promise<any> {
    try {
        const response = await fetch(`${API_BASE_URL}/userdata/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userName, userId }),
        });

        if (!response.ok) {
            throw new Error('Failed to create user profile');
        }

        return await response.json();
    } catch (error) {
        console.error('Error creating user profile:', error);
        throw error;
    }
}

/**
 * Update user profile with partial data
 */
export async function updateUserProfile(updates: any): Promise<any> {
    try {
        const userId = getCurrentUserId();
        if (!userId) {
            throw new Error('No active user session');
        }

        const response = await fetch(`${API_BASE_URL}/userdata/update`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, ...updates }),
        });

        if (!response.ok) {
            throw new Error('Failed to update user profile');
        }

        return await response.json();
    } catch (error) {
        console.error('Error updating user profile:', error);
        throw error;
    }
}

/**
 * Get complete user profile
 */
export async function getUserProfile(): Promise<any> {
    try {
        const userId = getCurrentUserId();
        if (!userId) {
            throw new Error('No active user session');
        }

        const response = await fetch(`${API_BASE_URL}/userdata/profile?userId=${encodeURIComponent(userId)}`);

        if (!response.ok) {
            throw new Error('Failed to get user profile');
        }

        return await response.json();
    } catch (error) {
        console.error('Error getting user profile:', error);
        throw error;
    }
}
