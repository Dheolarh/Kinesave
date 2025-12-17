import notificationService from './notification.service';
import { getUserData, getUserPlans } from '../utils/user-storage';

/**
 * Notification Scheduler Service
 * Handles scheduled notifications (e.g., daily 8:30 AM reminders)
 */
class NotificationScheduler {
    private checkInterval: number | null = null;

    /**
     * Start scheduler (check every minute)
     */
    start(): void {
        if (this.checkInterval) return;

        // Check immediately on start
        this.checkScheduledNotifications();

        // Then check every minute
        this.checkInterval = window.setInterval(() => {
            this.checkScheduledNotifications();
        }, 60000); // 60 seconds

        console.log('Notification scheduler started');
    }

    /**
     * Stop scheduler
     */
    stop(): void {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
            console.log('Notification scheduler stopped');
        }
    }

    /**
     * Check if it's time to send scheduled notifications
     */
    private checkScheduledNotifications(): void {
        const settings = notificationService.getSettings();
        if (!settings.enabled) return;

        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        const currentDate = now.toISOString().split('T')[0];
        const currentHour = now.getHours();

        // Check daily reminder (8:30 AM)
        if (settings.dailyReminder.enabled &&
            currentTime === settings.dailyReminder.time &&
            settings.dailyReminder.lastSent !== currentDate) {
            this.sendDailyReminder();
            this.updateLastSent(currentDate);
        }

        // Check bi-daily smart tip notification
        // Send at random time between 8-10am or 5-7pm every 2 days
        if (settings.deviceTips) {
            this.checkSmartTipNotification(currentHour, currentDate);
        }
    }

    /**
     * Check and send bi-daily smart tip notification
     */
    private checkSmartTipNotification(currentHour: number, currentDate: string): void {
        const lastSentData = localStorage.getItem('smartTipLastSent');
        const lastSent = lastSentData ? JSON.parse(lastSentData) : null;

        // Check if 2 days have passed since last tip
        if (lastSent) {
            const lastSentDate = new Date(lastSent.date);
            const daysSinceLastSent = Math.floor((new Date().getTime() - lastSentDate.getTime()) / (1000 * 60 * 60 * 24));
            if (daysSinceLastSent < 2) return; // Not time yet
        }

        // Check if we're in the time windows (8-10am or 5-7pm)
        const inMorningWindow = currentHour >= 8 && currentHour < 10;
        const inEveningWindow = currentHour >= 17 && currentHour < 19;

        if (!inMorningWindow && !inEveningWindow) return;

        // Prevent sending twice in the same day
        if (lastSent && lastSent.date === currentDate) return;

        // Send smart tip notification
        this.sendSmartTipNotification(currentDate);
    }

    /**
     * Send a random smart tip from the active plan
     */
    private async sendSmartTipNotification(currentDate: string): Promise<void> {
        try {
            const plansData = getUserPlans();
            if (!plansData?.activePlan) return;

            const activePlanType = plansData.activePlan;

            // Get the current plan data
            const planKey = activePlanType === 'cost' ? 'costSaver' :
                activePlanType === 'eco' ? 'ecoMode' : 'comfortBalance';

            const currentPlanData = plansData[planKey];
            if (!currentPlanData || !currentPlanData.smartAlerts || currentPlanData.smartAlerts.length === 0) {
                return;
            }

            // Pick a random smart tip
            const randomIndex = Math.floor(Math.random() * currentPlanData.smartAlerts.length);
            const tip = currentPlanData.smartAlerts[randomIndex];
            const tipText = typeof tip === 'string' ? tip : (tip as any).message || '';

            // Map plan type to ID
            const planId = activePlanType === 'cost' ? '1' : activePlanType === 'eco' ? '2' : '3';

            // Send notification
            await notificationService.send({
                id: `smart_tip_${Date.now()}`,
                type: 'device_tip',
                title: 'Energy Saving Tip',
                message: tipText,
                timestamp: new Date().toISOString(),
                read: false,
                actionUrl: `/plan/${planId}`,
                data: {
                    planId: planId,
                    planType: activePlanType,
                    tipIndex: randomIndex,
                },
            });

            // Update last sent
            localStorage.setItem('smartTipLastSent', JSON.stringify({
                date: currentDate,
                time: new Date().toISOString(),
                tipIndex: randomIndex,
            }));

            console.log('Smart tip notification sent');
        } catch (error) {
            console.error('Failed to send smart tip notification:', error);
        }
    }

    /**
     * Update last sent date for daily reminder
     */
    private updateLastSent(date: string): void {
        const settings = notificationService.getSettings();
        notificationService.updateSettings({
            dailyReminder: {
                ...settings.dailyReminder,
                lastSent: date,
            },
        });
    }

    /**
     * Send daily 8:30 AM reminder
     */
    private async sendDailyReminder(): Promise<void> {
        try {
            const plansData = getUserPlans();
            if (!plansData?.activePlan) {
                console.log('No active plan, skipping daily reminder');
                return;
            }

            const activePlanType = plansData.activePlan;
            const today = new Date().toISOString().split('T')[0];

            // Get the current plan data
            const planKey = activePlanType === 'cost' ? 'costSaver' :
                activePlanType === 'eco' ? 'ecoMode' : 'comfortBalance';

            const currentPlanData = plansData[planKey];
            if (!currentPlanData) return;

            // Find today's schedule
            const todaySchedule = currentPlanData.dailySchedules?.find(
                (s: any) => s.date.startsWith(today)
            );

            if (todaySchedule) {
                // Count actual devices (filter out metadata keys)
                const deviceKeys = Object.keys(todaySchedule).filter(
                    key => !['dayNumber', 'date', 'day', 'weather'].includes(key)
                );
                const deviceCount = deviceKeys.length;

                // Calculate estimated cost
                const userData = getUserData();
                const pricePerKwh = userData?.energyCosts?.pricePerKwh || 36;
                const currencySymbol = userData?.energyCosts?.currencySymbol || '$';

                let totalCost = 0;
                deviceKeys.forEach(deviceId => {
                    const usage = (todaySchedule as any)[deviceId];
                    if (usage && typeof usage === 'object' && usage.usage) {
                        // Rough estimate: assume average device is 150W
                        const kwhUsed = (150 * usage.usage) / 1000;
                        totalCost += kwhUsed * parseFloat(pricePerKwh.toString());
                    }
                });

                const cost = totalCost.toFixed(2);
                const weather = todaySchedule.weather?.condition || 'Clear';
                const temp = todaySchedule.weather?.temperature || 0;
                const planId = activePlanType === 'cost' ? '1' : activePlanType === 'eco' ? '2' : '3';
                const planName = currentPlanData.name || 'energy plan';

                await notificationService.send({
                    id: `daily_${Date.now()}`,
                    type: 'daily_reminder',
                    title: 'Good Morning! Time to Check Your Plan',
                    message: `Today's ${planName}: ${deviceCount} devices, ${weather} ${temp}°C. Est. cost: ${currencySymbol}${Math.trunc(parseFloat(cost))}`,
                    timestamp: new Date().toISOString(),
                    read: false,
                    actionUrl: `/plan/${planId}`,
                    data: {
                        planId: planId,
                        planType: activePlanType,
                        scheduledDevices: deviceCount,
                        estimatedCost: Math.trunc(parseFloat(cost)),
                        weatherCondition: `${weather} ${temp}°C`,
                    },
                });

                console.log('Daily reminder sent successfully');
            } else {
                console.log('No schedule found for today');
            }
        } catch (error) {
            console.error('Failed to send daily reminder:', error);
        }
    }

    /**
     * Manually trigger daily reminder (for testing)
     */
    async triggerDailyReminder(): Promise<void> {
        await this.sendDailyReminder();
    }
}

export default new NotificationScheduler();
