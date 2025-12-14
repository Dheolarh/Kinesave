import notificationService from './notification.service';

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
        if (!settings.enabled || !settings.dailyReminder.enabled) return;

        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        const currentDate = now.toISOString().split('T')[0];

        // Check if it's the scheduled time and not sent today
        if (currentTime === settings.dailyReminder.time &&
            settings.dailyReminder.lastSent !== currentDate) {
            this.sendDailyReminder();
            this.updateLastSent(currentDate);
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
            const activePlan = localStorage.getItem('activePlan');
            if (!activePlan) {
                console.log('No active plan, skipping daily reminder');
                return;
            }

            const plan = JSON.parse(activePlan);
            const today = new Date().toISOString().split('T')[0];

            // Get today's schedule from AI plans
            const aiPlansData = localStorage.getItem('aiGeneratedPlans');
            if (!aiPlansData) {
                console.log('No AI plans found, skipping daily reminder');
                return;
            }

            const aiPlans = JSON.parse(aiPlansData);

            // Get the current plan data
            const planKey = plan.id === '1' || plan.type === 'cost' ? 'costSaver' :
                plan.id === '2' || plan.type === 'eco' ? 'ecoMode' :
                    'comfortBalance';

            const currentPlanData = aiPlans[planKey];
            if (!currentPlanData) return;

            // Find today's schedule
            const todaySchedule = currentPlanData.dailySchedules?.find(
                (s: any) => s.date.startsWith(today)
            );

            if (todaySchedule) {
                const deviceCount = todaySchedule.deviceSchedules?.length || 0;
                const cost = todaySchedule.estimatedCost?.toFixed(2) || '0.00';
                const weather = todaySchedule.weather?.condition || 'Clear';
                const temp = todaySchedule.weather?.temperature || 0;

                await notificationService.send({
                    id: `daily_${Date.now()}`,
                    type: 'daily_reminder',
                    title: '🌅 Good Morning! Time to Check Your Plan',
                    message: `Today's ${plan.name || 'energy plan'}: ${deviceCount} devices, ${weather} ${temp}°C. Est. cost: $${cost}`,
                    timestamp: new Date().toISOString(),
                    read: false,
                    actionUrl: `/plan/${plan.id}`,
                    data: {
                        planId: plan.id,
                        planType: plan.type || planKey.replace('Saver', '').toLowerCase(),
                        scheduledDevices: deviceCount,
                        estimatedCost: parseFloat(cost),
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
