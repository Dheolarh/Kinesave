/**
 * Cost Saver Plan Generator (Hybrid Architecture)
 * 
 * AI Role: Suggest usage hours for all devices based on weather/priority
 * System Role: Trim hours to fit budget using intelligent algorithm
 */

import { PreAnalysisData } from '../pre-analysis-data';
import bedrockService from '../bedrock.service';
import { AIPlan } from '../../types/ai-plan.types';
import { trimToFitBudget, validateTrimmedBudget, getTrimmingSummary, type DeviceHours } from '../../utils/budget-trimmer';

export class CostSaverPlan {

    /**
     * Generate Cost Saver plan
     */
    async generate(data: PreAnalysisData): Promise<AIPlan> {
        console.log('COST SAVER PLAN (Hybrid: AI Hours + Trim)');

        const dailyBudget = data.budget.preferredBudget / 30;
        const targetBudget = dailyBudget * 0.95; // Aim for 95% of budget

        console.log(`Cost Saver: Daily budget = ${data.budget.currencySymbol}${dailyBudget.toFixed(2)}`);
        console.log(`Cost Saver: Target = ${data.budget.currencySymbol}${targetBudget.toFixed(2)}`);

        // Step 1: Get AI-suggested hours for all devices (30 days)
        const aiHours = await this.getAISuggestedHours(data);

        // Step 2: NEW - Enforce frequency rules
        const { enforceFrequencyRules } = await import('../../utils/frequency-enforcer');

        const frequencyRules = data.devices.map(d => ({
            deviceId: d.id,
            frequency: d.frequency as 'daily' | 'weekends' | 'rarely' | 'frequently',
            priority: d.priority,
            userSetHours: d.hoursPerDay,
            wattage: d.wattage,
            type: d.type
        }));

        console.log('Enforcing frequency rules (Cost Mode)...');
        const enforcedSchedule = enforceFrequencyRules(aiHours, frequencyRules, false);  // false = not eco mode

        // Convert DaySchedule[] back to { [day: string]: { [deviceId: string]: number } }
        const enforcedHours: { [day: string]: { [deviceId: string]: number } } = {};
        enforcedSchedule.forEach(daySchedule => {
            enforcedHours[`day${daySchedule.dayNumber}`] = daySchedule.deviceHours;
        });

        // Step 3: Trim each day to fit budget (respects frequency minimums)
        const dailySchedules = this.trimAndCalculate(enforcedHours, data, targetBudget);

        // Step 4: Generate smart tips
        const smartAlerts = this.generateSmartTips(data.devices);

        // Step 5: Calculate metrics
        const avgDailyCost = dailySchedules.reduce((sum, day) => sum + day.totalCost, 0) / 30;
        const monthlySaving = data.budget.averageMonthlyCost - (avgDailyCost * 30);

        console.log(`Cost Saver complete: Avg ${avgDailyCost.toFixed(2)}/day, Monthly saving: ${monthlySaving.toFixed(2)}`);

        return {
            id: 'cost-saver',
            name: 'Cost Saver',
            type: 'cost',
            description: 'Optimized plan staying under your preferred budget',
            devices: data.devices.map(d => d.id),
            dailySchedules,
            smartAlerts,
            dailyTips: [],
            metrics: {
                initialBudget: data.budget.preferredBudget,
                optimizedBudget: avgDailyCost * 30,
                monthlySaving
            }
        };
    }

    /**
     * Get AI-suggested hours for all devices (all 30 days)
     */
    private async getAISuggestedHours(data: PreAnalysisData): Promise<{ [day: string]: { [deviceId: string]: number } }> {
        const prompt = this.buildPrompt(data);

        console.log('Calling AI for usage hours...');

        const systemPrompt = `You are a cost optimization expert. Suggest usage hours for each device per day based on weather and priority. Return ONLY valid JSON.`;

        const response = await bedrockService.getJSONResponse(prompt, systemPrompt);

        console.log('AI hours received');

        return response.hours || {};
    }

    /**
     * Build AI prompt for device hours
     */
    private buildPrompt(data: PreAnalysisData): string {
        const deviceList = data.devices.map((d, i) =>
            `${i + 1}. "${d.id}" - ${d.type}, ${d.wattage}W, Priority ${d.priority}, Normal usage: ${d.hoursPerDay}h/day`
        ).join('\n');

        const weatherByDay = data.weather.map((w, i) =>
            `Day ${i + 1}: ${w.condition}, ${w.avgTemp}°C`
        ).join('\n');

        return `Suggest usage hours for devices in a COST SAVER plan (30 days).

DEVICES:
${deviceList}

WEATHER:
${weatherByDay}

YOUR TASK: For each day, suggest usage hours for ALL devices.

GUIDELINES:
1. Weather-dependent devices:
   - AC: More hours when temp ≥ 28°C, 0 hours when < 28°C
   - Heater: More hours when temp ≤ 18°C, 0 hours when > 18°C
   - Fan: Use when 18°C < temp < 28°C

2. Always-needed devices (suggest every day):
   - Freezer/Refrigerator: 8-12 hours minimum
   - High priority (priority 5): Close to normal usage
   - Medium priority (priority 3-4): 50-80% of normal usage
   - Low priority (priority 1-2): 20-50% of normal usage

3. Vary hours across days:
   - Don't suggest same hours every day
   - Weekends: Can increase entertainment devices
   - Hot days: More cooling devices
   - Cold days: More heating devices

OUTPUT FORMAT (JSON):
{
  "hours": {
    "day1": {
      "freezer": 8,
      "laptop": 6,
      "fan": 3,
      "tv": 2,
      "ac": 0
    },
    "day2": {
      "freezer": 10,
      "laptop": 5,
      "fan": 4,
      "tv": 1,
      "ac": 0
    },
    ...
    "day30": { ... }
  }
}

Include ALL ${data.devices.length} devices for all 30 days. Suggest realistic hours.`;
    }

    /**
     * Trim AI hours to fit budget
     */
    private trimAndCalculate(
        aiHours: { [day: string]: { [deviceId: string]: number } },
        data: PreAnalysisData,
        dailyBudget: number
    ): any[] {
        const schedules = [];

        for (let dayNum = 1; dayNum <= 30; dayNum++) {
            const dayKey = `day${dayNum}`;
            const dayHours = aiHours[dayKey] || {};

            // Convert to DeviceHours format
            const deviceHours: DeviceHours[] = data.devices.map(d => ({
                id: d.id,
                hours: dayHours[d.id] || 0,
                wattage: d.wattage,
                priority: d.priority,
                type: d.type,
                frequency: d.frequency as 'daily' | 'weekends' | 'rarely' | 'frequently'
            }));

            // Calculate frequency constraints (minimum hours per device)
            const frequencyConstraints: { [deviceId: string]: number } = {};

            // Helper: Check if day is weekend
            const isWeekendDay = (dayNum: number): boolean => {
                const dayOfWeek = ((dayNum - 1) % 7) + 1;
                return dayOfWeek === 6 || dayOfWeek === 7;
            };
            const isWeekend = isWeekendDay(dayNum);

            data.devices.forEach(d => {
                if (d.frequency === 'daily') {
                    // Daily minimum = userSetHours × (priority / 5) × 0.6
                    frequencyConstraints[d.id] = d.hoursPerDay * (d.priority / 5) * 0.6;
                } else if (d.frequency === 'weekends') {
                    // Weekends: minimum on Sat/Sun, 0 on weekdays
                    frequencyConstraints[d.id] = isWeekend ? (d.hoursPerDay * (d.priority / 5) * 0.5) : 0;
                } else {
                    // Rarely/frequently: no hard minimum (handled by enforcer)
                    frequencyConstraints[d.id] = 0;
                }
            });

            // Trim to fit budget with frequency constraints
            const trimmed = trimToFitBudget(deviceHours, dailyBudget, data.budget.pricePerKwh, frequencyConstraints);

            // Build schedule
            const allDevicesSchedule: any = {};
            data.devices.forEach(device => {
                allDevicesSchedule[device.id] = {
                    usage: trimmed[device.id]?.hours || 0,
                    cost: trimmed[device.id]?.cost || 0
                };
            });

            const validation = validateTrimmedBudget(trimmed, dailyBudget);

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
     * Generate smart tips
     */
    private generateSmartTips(devices: any[]): any[] {
        const tips = devices.map(device => ({
            message: `Reduce ${device.name} usage during peak hours to save costs`,
            deviceId: device.id
        }));

        return tips.slice(0, Math.min(tips.length, 4));
    }
}
