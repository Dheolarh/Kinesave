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
            const activePlan = localStorage.getItem('activePlan');
            if (!activePlan) return;

            const plan = JSON.parse(activePlan);
            const aiPlansData = localStorage.getItem('aiGeneratedPlans');
            if (!aiPlansData) return;

            const aiPlans = JSON.parse(aiPlansData);

            // Get the current plan data
            const planKey = plan.id === '1' || plan.type === 'cost' ? 'costSaver' :
                plan.id === '2' || plan.type === 'eco' ? 'ecoMode' :
                    'comfortBalance';

            const currentPlanData = aiPlans[planKey];
            if (!currentPlanData || !currentPlanData.smartAlerts || currentPlanData.smartAlerts.length === 0) {
                return;
            }

            // Pick a random smart tip
            const randomIndex = Math.floor(Math.random() * currentPlanData.smartAlerts.length);
            const tip = currentPlanData.smartAlerts[randomIndex];
            const tipText = typeof tip === 'string' ? tip : tip.alert || tip.tip || tip.message;

            // Send notification
            await notificationService.send({
                id: `smart_tip_${Date.now()}`,
                type: 'device_tip',
                title: 'Energy Saving Tip',
                message: tipText,
                timestamp: new Date().toISOString(),
                read: false,
                actionUrl: `/plan/${plan.id}`,
                data: {
                    planId: plan.id,
                    planType: plan.type || planKey.replace('Saver', '').toLowerCase(),
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
                // Count actual devices (filter out metadata keys)
                const deviceKeys = Object.keys(todaySchedule).filter(
                    key => !['dayNumber', 'date', 'day', 'weather'].includes(key)
                );
                const deviceCount = deviceKeys.length;

                // Calculate estimated cost
                const energyData = localStorage.getItem('energyData');
                const pricePerKwh = energyData ? JSON.parse(energyData).pricePerKwh : 36;
                const currencySymbol = energyData ? JSON.parse(energyData).currencySymbol : '$';

                let totalCost = 0;
                deviceKeys.forEach(deviceId => {
                    const usage = todaySchedule[deviceId];
                    if (usage && typeof usage === 'object' && usage.usage) {
                        // Rough estimate: assume average device is 150W
                        const kwhUsed = (150 * usage.usage) / 1000;
                        totalCost += kwhUsed * parseFloat(pricePerKwh);
                    }
                });

                const cost = totalCost.toFixed(2);
                const weather = todaySchedule.weather?.condition || 'Clear';
                const temp = todaySchedule.weather?.avgTemp || todaySchedule.weather?.temperature || 0;

                await notificationService.send({
                    id: `daily_${Date.now()}`,
                    type: 'daily_reminder',
                    title: 'Good Morning! Time to Check Your Plan',
                    message: `Today's ${plan.name || 'energy plan'}: ${deviceCount} devices, ${weather} ${temp}°C. Est. cost: ${currencySymbol}${cost}`,
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
