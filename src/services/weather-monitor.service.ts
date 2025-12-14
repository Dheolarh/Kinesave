import weatherService from './weather.service';
import notificationService from './notification.service';
import { getCurrentUserProfile } from '../utils/storage';

/**
 * Weather Monitoring Service
 * Checks weather every hour and sends notifications for significant changes
 */
class WeatherMonitorService {
    private checkInterval: number | null = null;
    private lastWeather: any = null;
    private readonly CHECK_INTERVAL_MS = 60 * 60 * 1000; // 60 minutes

    /**
     * Start weather monitoring
     */
    start(): void {
        if (this.checkInterval) return;

        console.log('Weather monitoring started (checks every hour)');

        // Check immediately on start
        this.checkWeather();

        // Then check every hour
        this.checkInterval = window.setInterval(() => {
            this.checkWeather();
        }, this.CHECK_INTERVAL_MS);
    }

    /**
     * Stop weather monitoring
     */
    stop(): void {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
            console.log('Weather monitoring stopped');
        }
    }

    /**
     * Check current weather and detect significant changes
     */
    private async checkWeather(): Promise<void> {
        try {
            const profile = getCurrentUserProfile();
            if (!profile?.location) {
                console.log('No location set, skipping weather check');
                return;
            }

            // Get current weather from profile (updates happen via location service)
            const currentWeather = profile.location;

            if (!this.lastWeather) {
                // First check - just store the weather
                this.lastWeather = currentWeather;
                console.log('Weather monitoring initialized:', currentWeather.temperature + '°C');
                return;
            }

            // Detect significant changes
            await this.detectWeatherChanges(this.lastWeather, currentWeather);

            // Update last weather
            this.lastWeather = currentWeather;
        } catch (error) {
            console.error('Weather check failed:', error);
        }
    }

    /**
     * Detect and notify significant weather changes
     */
    private async detectWeatherChanges(oldWeather: any, newWeather: any): Promise<void> {
        const tempDiff = newWeather.temperature - oldWeather.temperature;
        const oldCondition = oldWeather.weatherDescription?.toLowerCase() || '';
        const newCondition = newWeather.weatherDescription?.toLowerCase() || '';

        // Temperature drop (good for turning off AC)
        if (tempDiff <= -3) {
            await this.sendWeatherAdvisory(
                '🌡️ Temperature Dropping',
                `Temperature dropped from ${oldWeather.temperature}°C to ${newWeather.temperature}°C. Consider turning off AC to save energy!`,
                newWeather
            );
        }

        // Temperature rise (might need AC)
        if (tempDiff >= 3 && newWeather.temperature >= 28) {
            await this.sendWeatherAdvisory(
                '☀️ Getting Warmer',
                `Temperature rose to ${newWeather.temperature}°C. Your AC might be needed today.`,
                newWeather
            );
        }

        // Cool weather detected (< 22°C)
        if (newWeather.temperature < 22 && oldWeather.temperature >= 22) {
            await this.sendWeatherAdvisory(
                '❄️ Cool Weather Alert',
                `It's now ${newWeather.temperature}°C - perfect weather to turn off AC and open windows!`,
                newWeather
            );
        }

        // Rain/storm detected
        if (!oldCondition.includes('rain') && newCondition.includes('rain')) {
            await this.sendWeatherAdvisory(
                '🌧️ Rain Detected',
                `Rain is here! Temperature: ${newWeather.temperature}°C. AC might not be needed.`,
                newWeather
            );
        }

        // Storm detected
        if (newCondition.includes('storm') || newCondition.includes('thunder')) {
            await this.sendWeatherAdvisory(
                '⛈️ Storm Warning',
                `Storm detected in your area. Consider unplugging non-essential devices for safety.`,
                newWeather
            );
        }

        // Clear weather after rain
        if (oldCondition.includes('rain') && newCondition.includes('clear')) {
            await this.sendWeatherAdvisory(
                '🌤️ Weather Clearing Up',
                `Rain has stopped! Temperature: ${newWeather.temperature}°C. Great time to air out your home.`,
                newWeather
            );
        }
    }

    /**
     * Send weather advisory notification
     */
    private async sendWeatherAdvisory(title: string, message: string, weather: any): Promise<void> {
        await notificationService.send({
            id: `weather_${Date.now()}`,
            type: 'weather_advisory',
            title,
            message,
            timestamp: new Date().toISOString(),
            read: false,
            data: {
                weatherCondition: `${weather.weatherDescription} ${weather.temperature}°C`,
            },
        });

        console.log('Weather advisory sent:', title);
    }
}

export default new WeatherMonitorService();
