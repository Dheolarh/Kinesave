import type {
    Notification,
    NotificationSettings
} from '../types/notification.types';
import median from '../utils/median-bridge';
import { getUserNotifications, addUserNotification, updateUserNotifications } from '../utils/user-storage';

/**
 * Notification Service
 * Unified notification system for web and median.co native apps
 */
class NotificationService {
    // STORAGE_KEY removed - now using centralized storage
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

        // Trigger toast notification
        this.triggerToast(notification);

        // Send native push if in median.co app
        if (this.isMedianApp()) {
            await this.sendMedianPush(notification);
        } else {
            // Web browser notification
            await this.sendBrowserNotification(notification);
        }
    }

    /**
     * Trigger toast notification (custom UI toast)
     */
    private triggerToast(notification: Notification): void {
        // Dispatch custom event for toast
        window.dispatchEvent(new CustomEvent('show-toast', {
            detail: {
                title: notification.title,
                message: notification.message
            }
        }));
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
     * Save notification to new storage
     */
    private saveNotification(notification: Notification): void {
        addUserNotification(notification);
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
     * Get all notifications from new storage
     */
    getAll(): Notification[] {
        return getUserNotifications() || [];
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
        updateUserNotifications(updated);
    }

    /**
     * Mark all as read
     */
    markAllAsRead(): void {
        const notifications = this.getAll();
        const updated = notifications.map(n => ({ ...n, read: true }));
        updateUserNotifications(updated);
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
        updateUserNotifications(filtered);
    }

    /**
     * Clear all notifications
     */
    clearAll(): void {
        updateUserNotifications([]);
    }

    /**
     * Send plan selected notification
     */
    async sendPlanSelectedNotification(planName: string, planType: 'cost' | 'eco' | 'balance', savings?: number): Promise<void> {
        // Get currency symbol from user data
        const { getUserData } = await import('../utils/user-storage');
        const userData = getUserData();
        const currencySymbol = userData?.energyCosts?.currencySymbol || '$';
        await this.send({
            id: `plan_${Date.now()} `,
            type: 'plan_selected',
            title: 'Plan Activated',
            message: `${planName} is now your active energy plan${savings ? `. Save up to ${currencySymbol}${Math.trunc(savings)}/month!` : ''} `,
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
