/**
 * PreAnalysisData Class
 * 
 * Fetches and caches all required data before AI plan generation:
 * - Weather forecast (30 days)
 * - User devices for analysis
 * - Budget data (average monthly cost + preferred budget)
 */

import { WeatherForecast } from '../types/ai-plan.types';
import weatherService from './weather.service';
import { getUserData } from '../utils/user-storage';

export interface DeviceData {
    id: string;
    name: string;
    type: string;
    wattage: number;
    priority: number;
    hoursPerDay: number;
    frequency: string; // daily, weekends, frequently, etc.
    usageTimes: string[];
}

export interface BudgetData {
    averageMonthlyCost: number;
    preferredBudget: number;
    pricePerKwh: number;
    currencySymbol: string;
}

export class PreAnalysisData {
    weather: WeatherForecast[] = [];
    devices: DeviceData[] = [];
    budget: BudgetData = {
        averageMonthlyCost: 0,
        preferredBudget: 0,
        pricePerKwh: 0,
        currencySymbol: '₦'
    };

    /**
     * Fetch all required data for analysis
     */
    async fetchAll(deviceIds: string[]): Promise<void> {
        console.log('📡 PreAnalysisData: Fetching all data...');

        // Fetch in parallel for speed
        await Promise.all([
            this.fetchWeatherData(),
            this.fetchDeviceData(deviceIds),
            this.fetchBudgetData()
        ]);

        console.log(`✅ PreAnalysisData: Fetched ${this.weather.length} days weather, ${this.devices.length} devices`);
    }

    /**
     * Fetch 30-day weather forecast
     */
    private async fetchWeatherData(): Promise<void> {
        try {
            const userData = getUserData();
            if (!userData?.location) {
                throw new Error('No location data found');
            }

            this.weather = await weatherService.getMonthlyForecast(
                userData.location.latitude,
                userData.location.longitude,
                30
            );

            console.log(`   Weather: ${this.weather.length} days fetched`);
        } catch (error) {
            console.error('Error fetching weather:', error);
            throw error;
        }
    }

    /**
     * Fetch user devices that were selected for analysis
     */
    private async fetchDeviceData(deviceIds: string[]): Promise<void> {
        try {
            const userData = getUserData();
            if (!userData?.devices) {
                throw new Error('No devices found in profile');
            }

            // Filter and map devices
            const selectedDevices = userData.devices
                .filter((d: any) => deviceIds.includes(d.id));

            this.devices = selectedDevices.map((device: any) => ({
                id: device.id,
                name: device.customName || device.originalName || device.name || 'Unknown Device',
                type: device.deviceType || device.type || 'Unknown',
                wattage: device.wattage || 0,
                priority: device.priority || 3,
                hoursPerDay: device.survey?.hoursPerDay || 0,
                frequency: device.survey?.frequency || 'daily', // Add frequency from survey
                usageTimes: device.survey?.usageTimes || []
            }));

            if (this.devices.length === 0) {
                throw new Error('No devices selected for analysis');
            }

            console.log(`   Devices: ${this.devices.length} devices loaded`);
        } catch (error) {
            console.error('Error fetching devices:', error);
            throw error;
        }
    }

    /**
     * Fetch budget data from user profile
     */
    private async fetchBudgetData(): Promise<void> {
        try {
            const userData = getUserData();
            if (!userData?.energyCosts) {
                throw new Error('No energy cost data found');
            }

            this.budget = {
                averageMonthlyCost: userData.energyCosts.monthlyCost || 0,
                preferredBudget: userData.energyCosts.preferredBudget || userData.energyCosts.monthlyCost || 0,
                pricePerKwh: userData.energyCosts.pricePerKwh || 50,
                currencySymbol: userData.energyCosts.currencySymbol || '$'
            };

            console.log(`   Budget: Avg=₦${this.budget.averageMonthlyCost}, Pref=₦${this.budget.preferredBudget}, Rate=₦${this.budget.pricePerKwh}/kWh`);
        } catch (error) {
            console.error('Error fetching budget:', error);
            throw error;
        }
    }

    /**
     * Save to localStorage cache
     */
    saveToCache(): void {
        const cacheData = {
            weather: this.weather,
            devices: this.devices,
            budget: this.budget,
            cachedAt: new Date().toISOString()
        };

        localStorage.setItem('preAnalysisDataCache', JSON.stringify(cacheData));
        console.log('💾 PreAnalysisData cached to localStorage');
    }

    /**
     * Load from localStorage cache (if recent)
     */
    loadFromCache(): boolean {
        try {
            const cached = localStorage.getItem('preAnalysisDataCache');
            if (!cached) return false;

            const cacheData = JSON.parse(cached);
            const cachedTime = new Date(cacheData.cachedAt).getTime();
            const now = Date.now();
            const ageInMinutes = (now - cachedTime) / (1000 * 60);

            // Cache valid for 30 minutes
            if (ageInMinutes > 30) {
                console.log('⏰ PreAnalysisData cache expired');
                return false;
            }

            this.weather = cacheData.weather;
            this.devices = cacheData.devices;
            this.budget = cacheData.budget;

            console.log('✅ PreAnalysisData loaded from cache');
            return true;
        } catch (error) {
            console.error('Error loading cache:', error);
            return false;
        }
    }
}
