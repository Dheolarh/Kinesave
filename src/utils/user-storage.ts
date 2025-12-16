import type { WeatherForecast, AIPlan } from '../types/ai-plan.types';

export interface CentralizedUserData {
    profile: {
        userName: string;
        createdAt: string;
        updatedAt: string;
    };

    devices: UserDevice[];

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
        currency: string;
        currencySymbol: string;
    } | null;

    aboutUser: {
        householdSize: number;
        occupationType: string;
        homeType: string;
    } | null;

    weather: {
        forecast: WeatherForecast[];
        fetchedAt: string;
        expiresAt: string; // Auto-expire after 24 hours
    } | null;

    plans: {
        costSaver: AIPlan | null;
        ecoMode: AIPlan | null;
        comfortBalance: AIPlan | null;
        activePlan: 'cost' | 'eco' | 'balance' | null;
        generatedAt: string | null;
        validUntil: string | null;
    } | null;

    analysisResults: {
        lastAnalysisDate: string | null;
        deviceIds: string[];
    } | null;

    notifications: UserNotification[];
}

export interface UserDevice {
    id: string;
    customName: string;
    originalName: string;
    deviceType: string;
    wattage: number;
    priority: number;
    survey: {
        frequency: string;
        hoursPerDay: number;
        usageTimes: string[];
        room: string;
    };
}

export interface UserNotification {
    id: string;
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
}

// ============================================
// CORE FUNCTIONS
// ============================================

/** Get current user ID */
export function getCurrentUserId(): string | null {
    return localStorage.getItem('currentUserId');
}

/** Set current user ID */
export function setCurrentUserId(userId: string): void {
    localStorage.setItem('currentUserId', userId);
}

/** Get all data for a user */
export function getUserData(userId?: string): CentralizedUserData | null {
    const targetUserId = userId || getCurrentUserId();
    if (!targetUserId) return null;

    const key = `userId_${targetUserId}`;
    const data = localStorage.getItem(key);

    if (!data) return null;

    try {
        return JSON.parse(data);
    } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
    }
}

/** Save all data for a user */
export function saveUserData(userData: CentralizedUserData, userId?: string): void {
    const targetUserId = userId || getCurrentUserId();
    if (!targetUserId) {
        console.error('No user ID provided');
        return;
    }

    const key = `userId_${targetUserId}`;
    userData.profile.updatedAt = new Date().toISOString();
    localStorage.setItem(key, JSON.stringify(userData));
}

/**
 * Create new user */
export function createUser(userName: string, userId: string): CentralizedUserData {
    const newUser: CentralizedUserData = {
        profile: {
            userName,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        devices: [],
        location: null,
        energyCosts: null,
        aboutUser: null,
        weather: null,
        plans: null,
        analysisResults: null,
        notifications: [],
    };

    setCurrentUserId(userId);
    saveUserData(newUser, userId);

    return newUser;
}

/** Alias for createUser (for compatibility with old code) */
export function createUserProfile(userName: string, userId: string): CentralizedUserData {
    return createUser(userName, userId);
}

/** Check what parts of profile are complete */
export function getProfileCompletionStatus(userData: CentralizedUserData) {
    return {
        hasLocation: !!userData.location,
        hasEnergyCosts: !!userData.energyCosts,
        hasAboutUser: !!userData.aboutUser,
        hasDevices: userData.devices && userData.devices.length > 0,
    };
}

// ============================================
// SECTION-SPECIFIC UPDATES
// ============================================

/** Update user devices */
export function updateUserDevices(devices: UserDevice[]): void {
    const userData = getUserData();
    if (!userData) return;

    userData.devices = devices;
    saveUserData(userData);
}

/** Update user location */
export function updateUserLocation(location: CentralizedUserData['location']): void {
    const userData = getUserData();
    if (!userData) return;

    userData.location = location;
    saveUserData(userData);
}

/** Update energy costs */
export function updateUserEnergyCosts(energyCosts: CentralizedUserData['energyCosts']): void {
    const userData = getUserData();
    if (!userData) return;

    userData.energyCosts = energyCosts;
    saveUserData(userData);
}

/** Update about user info */
export function updateUserAbout(aboutUser: CentralizedUserData['aboutUser']): void {
    const userData = getUserData();
    if (!userData) return;

    userData.aboutUser = aboutUser;
    saveUserData(userData);
}

/** Update weather data */
export function updateUserWeather(forecast: WeatherForecast[]): void {
    const userData = getUserData();
    if (!userData) return;

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

    userData.weather = {
        forecast,
        fetchedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
    };
    saveUserData(userData);
}

/** Update AI plans */
export function updateUserPlans(plans: {
    costSaver?: AIPlan;
    ecoMode?: AIPlan;
    comfortBalance?: AIPlan;
    activePlan?: 'cost' | 'eco' | 'balance' | null;
}): void {
    const userData = getUserData();
    if (!userData) return;

    if (!userData.plans) {
        userData.plans = {
            costSaver: null,
            ecoMode: null,
            comfortBalance: null,
            activePlan: null,
            generatedAt: null,
            validUntil: null,
        };
    }

    if (plans.costSaver) userData.plans.costSaver = plans.costSaver;
    if (plans.ecoMode) userData.plans.ecoMode = plans.ecoMode;
    if (plans.comfortBalance) userData.plans.comfortBalance = plans.comfortBalance;
    if (plans.activePlan !== undefined) userData.plans.activePlan = plans.activePlan;

    // Update timestamps if any plan was set
    if (plans.costSaver || plans.ecoMode || plans.comfortBalance) {
        userData.plans.generatedAt = new Date().toISOString();
        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + 30); // Valid for 30 days
        userData.plans.validUntil = validUntil.toISOString();
    }

    saveUserData(userData);
}

/** Update analysis results */
export function updateUserAnalysis(analysisResults: CentralizedUserData['analysisResults']): void {
    const userData = getUserData();
    if (!userData) return;

    userData.analysisResults = analysisResults;
    saveUserData(userData);
}

/** Add notification */
export function addUserNotification(notification: Omit<UserNotification, 'id' | 'timestamp'>): void {
    const userData = getUserData();
    if (!userData) return;

    const newNotification: UserNotification = {
        ...notification,
        id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        timestamp: new Date().toISOString(),
    };

    userData.notifications.unshift(newNotification);

    // Keep only latest 20 notifications
    if (userData.notifications.length > 20) {
        userData.notifications = userData.notifications.slice(0, 20);
    }

    saveUserData(userData);
}

// ============================================
// GETTER FUNCTIONS (Convenience)
// ============================================

export function getUserDevices(): UserDevice[] {
    return getUserData()?.devices || [];
}

export function getUserWeather(): WeatherForecast[] | null {
    const userData = getUserData();
    if (!userData?.weather) return null;

    // Check if weather expired
    const expiresAt = new Date(userData.weather.expiresAt);
    if (expiresAt < new Date()) {
        return null; // Expired
    }

    return userData.weather.forecast;
}

export function getUserPlans() {
    return getUserData()?.plans || null;
}

export function getUserLocation() {
    return getUserData()?.location || null;
}

export function getUserEnergyCosts() {
    return getUserData()?.energyCosts || null;
}

// ============================================
// CLEANUP
// ============================================

/** Clear all user data */
export function clearAllUserData(): void {
    const userId = getCurrentUserId();
    if (userId) {
        localStorage.removeItem(`userId_${userId}`);
    }
    localStorage.removeItem('currentUserId');
}

/** Get current user profile (legacy compat) */
export function getCurrentUserProfile() {
    return getUserData();
}
