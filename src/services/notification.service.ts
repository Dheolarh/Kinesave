import type {
    Notification,
    NotificationSettings
} from '../types/notification.types';
import median from '../utils/median-bridge';

/**
 * Notification Service
 * Unified notification system for web and median.co native apps
 */
class NotificationService {
    private readonly STORAGE_KEY = 'kinesave_notifications';
    private readonly SETTINGS_KEY = 'kinesave_notification_settings';

    /**
     * Get default notification settings
     */
    private getDefaultSettings(): NotificationSettings {
        return {
            enabled: true,
            dailyReminder: {
                enabled: true,
                time: '08:30',
            },
            planAlerts: true,
            deviceTips: true,
            usageAlerts: true,
            weatherAdvisories: true,
        };
    }

    /**
     * Get notification settings
     */
    getSettings(): NotificationSettings {
        const data = localStorage.getItem(this.SETTINGS_KEY);
        return data ? JSON.parse(data) : this.getDefaultSettings();
    }

    /**
     * Update notification settings
     */
    updateSettings(settings: Partial<NotificationSettings>): void {
        const current = this.getSettings();
        const updated = { ...current, ...settings };
        localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(updated));
    }

    /**
     * Check if running in median.co app
     */
    private isMedianApp(): boolean {
        return median.isApp();
    }

    /**
     * Send notification (web browser or median.co native)
     */
    async send(notification: Notification): Promise<void> {
        const settings = this.getSettings();
        if (!settings.enabled) return;

        // Check if this notification type is enabled
        if (!this.isNotificationTypeEnabled(notification.type, settings)) {
            return;
        }

        // Save to localStorage
        this.saveNotification(notification);

        // Send native push if in median.co app
        if (this.isMedianApp()) {
            await this.sendMedianPush(notification);
        } else {
            // Web browser notification
            await this.sendBrowserNotification(notification);
        }
    }

    /**
     * Check if notification type is enabled in settings
     */
    private isNotificationTypeEnabled(type: string, settings: NotificationSettings): boolean {
        switch (type) {
            case 'plan_selected':
                return settings.planAlerts;
            case 'daily_reminder':
                return settings.dailyReminder.enabled;
            case 'device_tip':
                return settings.deviceTips;
            case 'usage_alert':
                return settings.usageAlerts;
            case 'weather_advisory':
                return settings.weatherAdvisories;
            default:
                return true;
        }
    }

    /**
     * Send via median.co/OneSignal
     */
    private async sendMedianPush(notification: Notification): Promise<void> {
        median.sendNotification(
            notification.title,
            notification.message,
            notification.data
        );
    }

    /**
     * Send browser notification
     */
    private async sendBrowserNotification(notification: Notification): Promise<void> {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(notification.title, {
                body: notification.message,
                icon: '/icon-192.png',
                badge: '/badge-72.png',
                tag: notification.id,
                data: notification.data,
            });
        }
    }

    /**
     * Save notification to localStorage
     */
    private saveNotification(notification: Notification): void {
        const notifications = this.getAll();
        notifications.unshift(notification); // Add to beginning

        // Keep only last 50 notifications
        const trimmed = notifications.slice(0, 50);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trimmed));
    }

    /**
     * Request notification permission
     */
    async requestPermission(): Promise<boolean> {
        if (this.isMedianApp()) {
            // Median handles permission automatically via OneSignal
            return true;
        }

        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }

        return false;
    }

    /**
     * Get all notifications
     */
    getAll(): Notification[] {
        const data = localStorage.getItem(this.STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    }

    /**
     * Get unread notifications
     */
    getUnread(): Notification[] {
        return this.getAll().filter(n => !n.read);
    }

    /**
     * Mark notification as read
     */
    markAsRead(id: string): void {
        const notifications = this.getAll();
        const updated = notifications.map(n =>
            n.id === id ? { ...n, read: true } : n
        );
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    }

    /**
     * Mark all as read
     */
    markAllAsRead(): void {
        const notifications = this.getAll();
        const updated = notifications.map(n => ({ ...n, read: true }));
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    }

    /**
     * Get unread count
     */
    getUnreadCount(): number {
        return this.getUnread().length;
    }

    /**
     * Delete notification
     */
    delete(id: string): void {
        const notifications = this.getAll();
        const filtered = notifications.filter(n => n.id !== id);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
    }

    /**
     * Clear all notifications
     */
    clearAll(): void {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify([]));
    }

    /**
     * Send plan selected notification
     */
    async sendPlanSelectedNotification(planName: string, planType: 'cost' | 'eco' | 'balance', savings?: number): Promise<void> {
        await this.send({
            id: `plan_${Date.now()} `,
            type: 'plan_selected',
            title: '✅ Plan Activated!',
            message: `${planName} is now your active energy plan${savings ? `. Save up to $${savings}/month!` : ''} `,
            timestamp: new Date().toISOString(),
            read: false,
            actionUrl: '/dashboard',
            data: {
                planType,
                savingsAmount: savings,
            },
        });
    }
}

export default new NotificationService();
