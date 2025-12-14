/**
 * Notification system types
 * Supports both web browser and median.co native apps
 */

export type NotificationType =
    | 'plan_selected'       // Plan activation confirmation
    | 'daily_reminder'      // 8:30 AM plan reminder
    | 'device_tip'          // AI-generated device tips
    | 'usage_alert'         // Monitor alerts
    | 'weather_advisory'    // Weather-based recommendations
    | 'energy_saving';      // Saving opportunities

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
    actionUrl?: string;
    data?: NotificationData;
}

export interface NotificationData {
    planId?: string;
    planType?: 'cost' | 'eco' | 'balance';
    deviceId?: string;
    deviceName?: string;
    savingsAmount?: number;
    weatherCondition?: string;
    tip?: string;
    scheduledDevices?: number;
    estimatedCost?: number;
}

export interface DailyNotificationSchedule {
    enabled: boolean;
    time: string; // "08:30"
    lastSent?: string; // ISO date "2025-01-15"
}

export interface NotificationSettings {
    enabled: boolean;
    dailyReminder: DailyNotificationSchedule;
    planAlerts: boolean;
    deviceTips: boolean;
    usageAlerts: boolean;
    weatherAdvisories: boolean;
}

export interface DailyNotificationContent {
    date: string;
    morningTip: string;
    deviceTips: string[];
    weatherTip?: string;
    savingOpportunity?: string;
}
