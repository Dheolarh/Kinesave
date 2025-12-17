/**
 * Comfort Balance Plan Generator (Calculated Architecture)
 * 
 * Strategy: Average hours from Cost Saver + Eco Mode, then trim to budget
 * No AI needed - pure calculation
 */

import { PreAnalysisData } from '../pre-analysis-data';
import { AIPlan } from '../../types/ai-plan.types';
import { trimToFitBudget, validateTrimmedBudget, getTrimmingSummary, type DeviceHours } from '../../utils/budget-trimmer';

export class ComfortBalancePlan {

    /**
     * Generate Comfort Balance plan by averaging Cost + Eco plans
     */
    async generate(
        data: PreAnalysisData,
        costSaverPlan?: AIPlan,
        ecoModePlan?: AIPlan
    ): Promise<AIPlan> {
        console.log('\n=== COMFORT BALANCE PLAN (Calculated: Average Cost + Eco) ===');

        const blendedBudget = (data.budget.averageMonthlyCost + data.budget.preferredBudget) / 2;
        const dailyBudget = blendedBudget / 30;

        console.log(`⚖️ Comfort Balance: Daily budget = ${data.budget.currencySymbol}${dailyBudget.toFixed(2)}`);

        // Step 1: Average hours from Cost + Eco plans
        const averagedSchedules = this.averageHoursFromPlans(
            data,
            costSaverPlan,
            ecoModePlan,
            dailyBudget
        );

        // Step 2: Generate balanced tips
        const smartAlerts = this.generateBalancedTips(data.devices);

        // Step 3: Calculate metrics
        const avgDailyCost = averagedSchedules.reduce((sum, day) => sum + day.totalCost, 0) / 30;
        const comfortMonthlyBudget = avgDailyCost * 30;

        // Calculate eco gain based on budget savings vs preferred budget
        // Formula: (preferred budget - actual comfort budget) / preferred budget × 100%
        const preferredBudget = data.budget.preferredBudget;
        const ecoGain = preferredBudget > 0
            ? Math.abs((preferredBudget - comfortMonthlyBudget) / preferredBudget) * 100
            : 0;

        console.log(`✅ Comfort Balance complete: Eco gain ${ecoGain.toFixed(1)}% (vs ₦${preferredBudget} preferred), Optimized: ₦${comfortMonthlyBudget.toFixed(2)}/month`);

        return {
            id: 'comfort-balance',
            name: 'Comfort Balance',
            type: 'balance',
            description: 'Balanced plan optimizing both comfort and cost',
            devices: data.devices.map(d => d.id),
            dailySchedules: averagedSchedules,
            smartAlerts,
            dailyTips: [],
            metrics: {
                ecoFriendlyGainPercentage: Math.round(ecoGain),
                optimizedBudget: comfortMonthlyBudget
            }
        };
    }

    /**
     * Average hours from Cost Saver and Eco Mode plans
     */
    private averageHoursFromPlans(
        data: PreAnalysisData,
        costSaverPlan?: AIPlan,
        ecoModePlan?: AIPlan,
        dailyBudget?: number
    ): any[] {
        const schedules = [];

        for (let dayNum = 1; dayNum <= 30; dayNum++) {
            const costDay = costSaverPlan?.dailySchedules?.[dayNum - 1] as any;
            const ecoDay = ecoModePlan?.dailySchedules?.[dayNum - 1] as any;

            // Average hours for each device
            const deviceHours: DeviceHours[] = data.devices.map(d => {
                const costHours = costDay?.[d.id]?.usage || 0;
                const ecoHours = ecoDay?.[d.id]?.usage || 0;
                const averagedHours = (costHours + ecoHours) / 2;

                return {
                    id: d.id,
                    hours: averagedHours,
                    wattage: d.wattage,
                    priority: d.priority,
                    type: d.type
                };
            });

            // Trim to fit budget if needed
            const trimmed = trimToFitBudget(deviceHours, dailyBudget!, data.budget.pricePerKwh);

            // Build schedule
            const allDevicesSchedule: any = {};
            data.devices.forEach(device => {
                const deviceData = trimmed[device.id] || { hours: 0, cost: 0 };
                allDevicesSchedule[device.id] = {
                    usage: deviceData.hours,
                    cost: deviceData.cost
                };
            });

            const validation = validateTrimmedBudget(trimmed, dailyBudget!);

            schedules.push({
                dayNumber: dayNum,
                date: new Date(Date.now() + (dayNum - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                day: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][(dayNum - 1) % 7],
                weather: {
                    condition: data.weather[dayNum - 1]?.condition || 'Clear',
                    temperature: data.weather[dayNum - 1]?.avgTemp || 25,
                    humidity: data.weather[dayNum - 1]?.humidity || 50,
                    weatherCode: data.weather[dayNum - 1]?.weatherCode || 0
                },
                ...allDevicesSchedule,
                totalCost: validation.totalCost
            });

            if (dayNum <= 3) {
                console.log(`Day ${dayNum}: ${getTrimmingSummary(trimmed)}`);
            }
        }

        return schedules;
    }

    /**
     * Generate balanced tips
     */
    private generateBalancedTips(devices: any[]): any[] {
        const tips = devices.slice(0, 4).map(device => ({
            message: `Balance ${device.name} usage between comfort and cost savings`,
            deviceId: device.id
        }));

        return tips;
    }

    /**
     * Calculate eco gain percentage for comfort plan
     * Uses same formula as eco mode but with comfort hours
     */
    private calculateEcoGain(devices: any[], dailySchedules: any[]): number {
        // Calculate original total hours (normal usage × 30 days)
        const originalDailyHours = devices.reduce((sum, device) => sum + (device.hoursPerDay || 0), 0);
        const originalTotalHours = originalDailyHours * 30;

        // Calculate comfort total hours (sum of actual hours across all days)
        let comfortTotalHours = 0;

        dailySchedules.forEach(day => {
            devices.forEach(device => {
                const deviceData = day[device.id];
                if (deviceData && deviceData.usage) {
                    comfortTotalHours += deviceData.usage;
                }
            });
        });

        // Calculate eco gain percentage
        if (originalTotalHours === 0) return 0;

        const ecoGain = Math.abs((comfortTotalHours - originalTotalHours) / originalTotalHours) * 100;

        console.log(`Comfort eco gain: Original ${originalTotalHours}h, Comfort ${comfortTotalHours}h, Gain: ${ecoGain.toFixed(1)}%`);

        return Math.round(ecoGain);
    }
}
