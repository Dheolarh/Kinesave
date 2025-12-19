import type { AIPlan, DailySchedule, DeviceSchedule, PlanMetrics, WeatherForecast } from '../types/ai-plan.types';
import type { CostPlan, DaySchedule } from './cost-plan-logic';
import type { EcoPlan } from './eco-plan-logic';
import type { ComfortPlan } from './comfort-plan-logic';

interface TransformInput {
    costPlan?: CostPlan;
    ecoPlan?: EcoPlan;
    comfortPlan?: ComfortPlan;
    weatherData: WeatherForecast[];
    preferredBudget?: number;
    avgMonthlyCost?: number;
    initialTotalHours?: number;
    ecoPlanTotalHours?: number; // Needed for Comfort Plan eco gain calc
    deviceNames?: { [deviceId: string]: string };
}

function mapPriorityToString(priority: number): 'high' | 'medium' | 'low' {
    if (priority >= 4) return 'high';
    if (priority === 3) return 'medium';
    return 'low';
}

function transformDaySchedule(
    day: DaySchedule,
    weather: WeatherForecast | null,
    deviceNames: { [deviceId: string]: string }
): DailySchedule {
    const deviceSchedules: DeviceSchedule[] = day.devices.map(device => ({
        deviceId: device.id,
        deviceName: deviceNames[device.id] || device.name,
        hoursOfUse: Math.round(device.hours * 10) / 10,
        priority: mapPriorityToString(device.priority),
        usageWindows: [],
        estimatedCost: Math.round(device.cost * 100) / 100,
    }));

    return {
        date: day.date,
        dayNumber: day.dayNumber,
        isEstimatedWeather: !weather,
        weather: weather ? {
            condition: weather.condition,
            temperature: weather.avgTemp,
            humidity: weather.humidity,
            weatherCode: weather.weatherCode,
        } : {
            condition: 'Clear',
            temperature: 25,
            humidity: 60,
            weatherCode: 800,
        },
        totalUsageHours: Math.round(day.devices.reduce((sum, d) => sum + d.hours, 0) * 10) / 10,
        estimatedCost: Math.round(day.totalCost * 100) / 100,
        peakUsagePeriod: { start: '', end: '' },
        deviceSchedules,
    };
}

export function transformCostPlanToAIPlan(input: TransformInput): AIPlan {
    const { costPlan, weatherData, preferredBudget, deviceNames = {} } = input;

    if (!costPlan || !preferredBudget) {
        throw new Error('costPlan and preferredBudget are required');
    }

    const dailySchedules: DailySchedule[] = costPlan.schedule.map((day, index) => {
        const weather = weatherData[index] || null;
        return transformDaySchedule(day, weather, deviceNames);
    });

    const metrics: PlanMetrics = {
        initialBudget: preferredBudget,
        optimizedBudget: Math.round(costPlan.totalMonthlyCost * 100) / 100,
        monthlySaving: Math.round((preferredBudget - costPlan.totalMonthlyCost) * 100) / 100,
    };

    const deviceIds = Array.from(
        new Set(costPlan.schedule.flatMap(day => day.devices.map(d => d.id)))
    );

    return {
        id: `cost-plan-${Date.now()}`,
        type: 'cost',
        name: 'Cost Saver Plan',
        description: 'Optimized plan to reduce energy costs while maintaining essential device usage',
        metrics,
        dailySchedules,
        dailyTips: [],
        smartAlerts: [],
        devices: deviceIds,
    };
}

export function transformEcoPlanToAIPlan(input: TransformInput): AIPlan {
    const { ecoPlan, weatherData, avgMonthlyCost, initialTotalHours, deviceNames = {} } = input;

    if (!ecoPlan || !avgMonthlyCost || !initialTotalHours) {
        throw new Error('ecoPlan, avgMonthlyCost, and initialTotalHours are required');
    }

    const dailySchedules: DailySchedule[] = ecoPlan.schedule.map((day, index) => {
        const weather = weatherData[index] || null;
        return transformDaySchedule(day, weather, deviceNames);
    });

    const newTotalHours = ecoPlan.schedule.reduce((sum, day) => {
        return sum + day.devices.reduce((daySum, d) => daySum + d.hours, 0);
    }, 0);

    const ecoGainPercentage = Math.round(((Math.abs(newTotalHours - initialTotalHours)) / initialTotalHours) * 100);

    const metrics: PlanMetrics = {
        initialEcoScore: 50,
        optimizedEcoScore: Math.min(100, 50 + ecoGainPercentage),
        ecoImprovementPercentage: ecoGainPercentage,
        monthlyCostCap: Math.round(ecoPlan.totalMonthlyCost * 100) / 100,
    };

    const deviceIds = Array.from(
        new Set(ecoPlan.schedule.flatMap(day => day.devices.map(d => d.id)))
    );

    return {
        id: `eco-plan-${Date.now()}`,
        type: 'eco',
        name: 'Eco Mode Plan',
        description: 'Reduces emission by reducing use time of highly emissive devices while staying in budget',
        metrics,
        dailySchedules,
        dailyTips: [],
        smartAlerts: [],
        devices: deviceIds,
    };
}

export function transformComfortPlanToAIPlan(input: TransformInput): AIPlan {
    const { comfortPlan, weatherData, avgMonthlyCost, ecoPlanTotalHours, deviceNames = {} } = input;

    if (!comfortPlan || !avgMonthlyCost || !ecoPlanTotalHours) {
        throw new Error('comfortPlan, avgMonthlyCost, and ecoPlanTotalHours are required');
    }

    const dailySchedules: DailySchedule[] = comfortPlan.schedule.map((day, index) => {
        const weather = weatherData[index] || null;
        return transformDaySchedule(day, weather, deviceNames);
    });

    const newTotalHours = comfortPlan.schedule.reduce((sum, day) => {
        return sum + day.devices.reduce((daySum, d) => daySum + d.hours, 0);
    }, 0);

    // Eco Gain for Comfort Plan: Relative to Eco Plan hours
    // Initial = Eco Plan Total Hours
    // New = Comfort Plan Total Hours
    const ecoGainPercentage = Math.round(((Math.abs(newTotalHours - ecoPlanTotalHours)) / ecoPlanTotalHours) * 100);

    // Budget Reduction: Savings compared to average monthly cost
    const budgetReductionPercentage = Math.round(((avgMonthlyCost - comfortPlan.totalMonthlyCost) / avgMonthlyCost) * 100);

    const metrics: PlanMetrics = {
        budgetReductionPercentage,
        ecoFriendlyGainPercentage: ecoGainPercentage,
        optimizedBudget: Math.round(comfortPlan.totalMonthlyCost * 100) / 100,
    };

    const deviceIds = Array.from(
        new Set(comfortPlan.schedule.flatMap(day => day.devices.map(d => d.id)))
    );

    return {
        id: `comfort-plan-${Date.now()}`,
        type: 'balance',
        name: 'Comfort Balance Plan',
        description: 'Balanced plan optimizing between cost savings and comfort',
        metrics,
        dailySchedules,
        dailyTips: [],
        smartAlerts: [],
        devices: deviceIds,
    };
}
