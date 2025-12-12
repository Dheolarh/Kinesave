// localStorage helper for user profile management
// All data stored as JSON strings in localStorage

export interface UserProfile {
    userName: string;
    userId: string;
    location: {
        city: string;
        region: string;
        country: string;
        latitude: number;
        longitude: number;
        temperature: number;
        weatherDescription: string;
    } | null;
    energyCosts: {
        monthlyCost: number;
        pricePerKwh: number;
        preferredBudget: number | null;
        powerHoursPerDay: number;
        availableKwhPerMonth: number;
        currency: string;
        currencySymbol: string;
    } | null;
    devices: Array<{
        id: string;
        customName: string;
        originalName: string;
        deviceType: string;
        brand: string;
        modelNumber: string;
        wattage: number;
        priority: number | string;
        survey: {
            frequency: string;
            hoursPerDay: number;
            usageTimes: string[];
            room: string;
        };
    }>;
    aboutUser: {
        householdSize: number;
        occupationType: string;
        homeType: string;
    } | null;
    createdAt: string;
    updatedAt: string;
}

// Get current user's ID
export function getCurrentUserId(): string | null {
    return localStorage.getItem('currentUserId');
}

// Set current user ID
export function setCurrentUserId(userId: string): void {
    localStorage.setItem('currentUserId', userId);
}

// Clear current user ID
export function clearCurrentUserId(): void {
    localStorage.removeItem('currentUserId');
}

// Get current user's profile
export function getCurrentUserProfile(): UserProfile | null {
    const userId = getCurrentUserId();
    if (!userId) return null;

    const usersJson = localStorage.getItem('users');
    if (!usersJson) return null;

    try {
        const users = JSON.parse(usersJson);
        return users[userId] || null;
    } catch (error) {
        console.error('Error parsing users from localStorage:', error);
        return null;
    }
}

// Create new user profile
export function createUserProfile(userName: string, userId: string): UserProfile {
    const newProfile: UserProfile = {
        userName,
        userId,
        location: null,
        energyCosts: null,
        devices: [],
        aboutUser: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    // Get existing users or create new object
    const usersJson = localStorage.getItem('users') || '{}';
    const users = JSON.parse(usersJson);

    // Add new user
    users[userId] = newProfile;

    // Save back to localStorage as JSON
    localStorage.setItem('users', JSON.stringify(users));

    // Set as current user
    setCurrentUserId(userId);

    return newProfile;
}

// Update user profile
export function updateUserProfile(updates: Partial<UserProfile>): void {
    const profile = getCurrentUserProfile();
    if (!profile) {
        console.error('No current user profile found');
        return;
    }

    // Merge updates
    const updatedProfile = {
        ...profile,
        ...updates,
        updatedAt: new Date().toISOString(),
    };

    // Get all users
    const usersJson = localStorage.getItem('users') || '{}';
    const users = JSON.parse(usersJson);

    // Update this user
    users[profile.userId] = updatedProfile;

    // Save back as JSON
    localStorage.setItem('users', JSON.stringify(users));
}

// Check what parts of profile are complete
export function getProfileCompletionStatus(profile: UserProfile) {
    return {
        hasLocation: !!profile.location,
        hasEnergyCosts: !!profile.energyCosts,
        hasAboutUser: !!profile.aboutUser,
        hasDevices: profile.devices && profile.devices.length > 0,
    };
}

// Clear all user data (for testing/reset)
export function clearAllUserData(): void {
    localStorage.removeItem('users');
    localStorage.removeItem('currentUserId');
}
