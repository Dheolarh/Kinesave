/**
 * Eco Mode Plan Generator (Hybrid Architecture)
 * 
 * AI Role: Suggest eco-optimized hours + rate devices by environmental impact
 * System Role: Trim hours to fit budget while prioritizing low-emission devices
 */

import { PreAnalysisData } from '../pre-analysis-data';
import bedrockService from '../bedrock.service';
import { AIPlan } from '../../types/ai-plan.types';
import { trimToFitBudget, validateTrimmedBudget, getTrimmingSummary, type DeviceHours } from '../../utils/budget-trimmer';

export class EcoModePlan {

    /**
     * Generate Eco Mode plan
     */
    async generate(data: PreAnalysisData): Promise<AIPlan> {
        console.log('\n🟢 === ECO MODE PLAN (Hybrid: AI Hours + Eco + Trim) ===');

        // Use average monthly cost for eco mode
        const dailyBudget = data.budget.averageMonthlyCost / 30;
        const targetBudget = dailyBudget; // Stay within average budget

        console.log(`🌱 Eco Mode: Daily budget = ${data.budget.currencySymbol}${dailyBudget.toFixed(2)}`);
        console.log(`🎯 Eco Mode: Target = ${data.budget.currencySymbol}${targetBudget.toFixed(2)}`);

        // Step 1: Get AI eco ratings + suggested hours
        const aiResponse = await this.getEcoOptimizedHours(data);

        // Step 2: Trim each day to fit budget (with eco priority)
        const dailySchedules = this.trimWithEcoPriority(aiResponse, data, targetBudget);

        // Step 3: Generate eco tips
        const smartAlerts = this.generateEcoTips(data.devices, aiResponse.ratings);

        // Step 4: Calculate eco metrics
        const avgEcoScore = dailySchedules.reduce((sum, day) => sum + (day.ecoScore || 0), 0) / 30;
        const avgDailyCost = dailySchedules.reduce((sum, day) => sum + day.totalCost, 0) / 30;

        // Step 5: Calculate eco gain percentage
        const ecoGain = this.calculateEcoGain(data.devices, dailySchedules);

        console.log(`✅ Eco Mode complete: Avg eco score ${avgEcoScore.toFixed(1)}/100, Eco gain: ${ecoGain.toFixed(1)}%, Cost: ₦${avgDailyCost.toFixed(2)}/day`);

        return {
            id: 'eco-mode',
            name: 'Eco Mode',
            type: 'eco',
            description: 'Environmentally optimized plan minimizing carbon emissions',
            devices: data.devices.map(d => d.id),
            dailySchedules,
            smartAlerts,
            dailyTips: [],
            metrics: {
                optimizedEcoScore: avgEcoScore,
                ecoImprovementPercentage: ecoGain,
                monthlyCostCap: avgDailyCost * 30
            }
        };
    }

    /**
     * Get AI eco-optimized hours + device ratings
     */
    private async getEcoOptimizedHours(data: PreAnalysisData): Promise<{
        hours: { [day: string]: { [deviceId: string]: number } };
        ratings: { [deviceId: string]: number };
    }> {
        const prompt = this.buildPrompt(data);

        console.log('🤖 Calling AI for eco-optimized hours...');

        const systemPrompt = `You are an environmental efficiency expert. Suggest eco-optimized usage hours and rate devices by environmental impact. Return ONLY valid JSON.`;

        const response = await bedrockService.getJSONResponse(prompt, systemPrompt);

        console.log('✅ Eco hours + ratings received');

        return {
            hours: response.hours || {},
            ratings: response.ratings || {}
        };
    }

    /**
     * Build AI prompt for eco-optimized hours
     */
    private buildPrompt(data: PreAnalysisData): string {
        const deviceList = data.devices.map((d, i) =>
            `${i + 1}. "${d.id}" - ${d.type}, ${d.wattage}W`
        ).join('\n');

        const weatherByDay = data.weather.map((w, i) =>
            `Day ${i + 1}: ${w.condition}, ${w.avgTemp}°C`
        ).join('\n');

        return `Suggest ECO-OPTIMIZED usage hours for devices (30 days) + rate environmental impact.

DEVICES:
${deviceList}

WEATHER:
${weatherByDay}

YOUR TASK: 
1. Rate each device by environmental impact (0-100, higher = more eco-friendly)
2. Suggest usage hours prioritizing low-emission devices

EMISSION CLASSIFICATION:
1. **Direct Emissions** (devices that directly produce pollutants):
   - Electric Grills/Ovens: Carbon from cooking (40-60 score, minimize hours)
   - Gas Appliances: Direct CO2, NOx (30-50 score, minimize hours)
   - Old ACs: CFC leaks (35-55 score, minimize hours)

2. **Indirect Emissions** (via electricity):
   - High wattage = more coal/gas burned = more CO2
   - Refrigerators/Freezers: CFC risks + constant power (60-75 score, 8-10h needed)
   - AC units: High power + refrigerant leaks (45-65 score, only hot days)
   - Heaters: Very high consumption (40-60 score, only cold days)

3. **Low-Impact Devices** (prioritize these):
   - LED lights: Minimal waste (90-100 score, maximize usage)
   - Modern laptops: Energy efficient (80-95 score, normal usage)
   - Fans: Low power, no refrigerants (85-95 score, prefer over AC)

ECO HOUR GUIDELINES:
- Prioritize low-emission devices (higher eco scores)
- Use fans instead of AC when possible
- Minimize high-wattage device hours
- Avoid direct-emission devices when alternatives exist

OUTPUT FORMAT (JSON):
{
  "ratings": {
    "freezer": 65,
    "laptop": 85,
    "ac": 45,
    "fan": 90,
    "electric_grill": 40,
    ...
  },
  "hours": {
    "day1": {
      "freezer": 8,
      "laptop": 6,
      "fan": 5,
      "ac": 0,
      "electric_grill": 0
    },
    "day2": { ... },
    ...
    "day30": { ... }
  }
}

Rate AND suggest hours for ALL ${data.devices.length} devices across all 30 days.`;
    }

    /**
     * Trim with eco priority (boost eco-friendly device priorities)
     */
    private trimWithEcoPriority(
        aiResponse: { hours: any; ratings: any },
        data: PreAnalysisData,
        dailyBudget: number
    ): any[] {
        const schedules = [];

        for (let dayNum = 1; dayNum <= 30; dayNum++) {
            const dayKey = `day${dayNum}`;
            const dayHours = aiResponse.hours[dayKey] || {};

            // Boost priority for eco-friendly devices
            const deviceHours: DeviceHours[] = data.devices.map(d => {
                const ecoRating = aiResponse.ratings[d.id] || 50;
                const ecoBoost = (ecoRating - 50) / 20; // -2.5 to +2.5
                const ecoPriority = Math.max(1, Math.min(5, d.priority + ecoBoost));

                return {
                    id: d.id,
                    hours: dayHours[d.id] || 0,
                    wattage: d.wattage,
                    priority: ecoPriority, // Eco-adjusted priority
                    type: d.type
                };
            });

            // Trim to fit budget
            const trimmed = trimToFitBudget(deviceHours, dailyBudget, data.budget.pricePerKwh);

            // Calculate eco score for active devices
            let totalEcoScore = 0;
            let activeDevices = 0;

            const allDevicesSchedule: any = {};
            data.devices.forEach(device => {
                const deviceData = trimmed[device.id] || { hours: 0, cost: 0 };
                allDevicesSchedule[device.id] = {
                    usage: deviceData.hours,
                    cost: deviceData.cost
                };

                if (deviceData.hours > 0) {
                    totalEcoScore += aiResponse.ratings[device.id] || 50;
                    activeDevices++;
                }
            });

            const validation = validateTrimmedBudget(trimmed, dailyBudget);
            const avgEcoScore = activeDevices > 0 ? totalEcoScore / activeDevices : 0;

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
                totalCost: validation.totalCost,
                ecoScore: Math.round(avgEcoScore)
            });

            if (dayNum <= 3) {
                console.log(`Day ${dayNum}: ${getTrimmingSummary(trimmed)} | Eco: ${avgEcoScore.toFixed(1)}`);
            }
        }

        return schedules;
    }

    /**
     * Generate eco tips
     */
    private generateEcoTips(devices: any[], ecoRatings: { [id: string]: number }): any[] {
        const tips = devices
            .sort((a, b) => (ecoRatings[a.id] || 50) - (ecoRatings[b.id] || 50))
            .slice(0, 4)
            .map(device => ({
                message: `Replace ${device.name} with energy-efficient alternative to reduce emissions`,
                deviceId: device.id
            }));

        return tips;
    }

    /**
     * Calculate eco gain percentage
     * 
     * Formula:
     * - Original hours = sum of normal device hours × 30 days
     * - Subsidized hours = sum of actual hours across all 30 days
     * - Eco gain = abs((subsidized - original) / original) × 100
     */
    private calculateEcoGain(devices: any[], dailySchedules: any[]): number {
        // Calculate original total hours (normal usage × 30 days)
        const originalDailyHours = devices.reduce((sum, device) => sum + (device.hoursPerDay || 0), 0);
        const originalTotalHours = originalDailyHours * 30;

        // Calculate subsidized total hours (sum of actual hours across all days)
        let subsidizedTotalHours = 0;

        dailySchedules.forEach(day => {
            devices.forEach(device => {
                const deviceData = day[device.id];
                if (deviceData && deviceData.usage) {
                    subsidizedTotalHours += deviceData.usage;
                }
            });
        });

        // Calculate eco gain percentage
        if (originalTotalHours === 0) return 0;

        const ecoGain = Math.abs((subsidizedTotalHours - originalTotalHours) / originalTotalHours) * 100;

        console.log(`Eco gain: Original ${originalTotalHours}h, Subsidized ${subsidizedTotalHours}h, Gain: ${ecoGain.toFixed(1)}%`);

        return Math.round(ecoGain);
    }
}
