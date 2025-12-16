/**
 * Cost Saver Plan Generator
 * 
 * Goal: Stay strictly UNDER the user's preferred budget (aim for -5%)
 * Strategy: Smart device allocation based on type, weather, and priority
 */

import { PreAnalysisData } from '../pre-analysis-data';
import bedrockService from '../bedrock.service';
import { AIPlan } from '../../types/ai-plan.types';

export interface DailyBudget {
    day: number;
    budget: number;
}

export class CostSaverPlan {

    /**
     * Calculate daily budgets for 30 days
     * Cost Saver uses: Preferred Budget ÷ 30
     */
    monthCostBreakdown(data: PreAnalysisData): DailyBudget[] {
        const dailyBudget = data.budget.preferredBudget / 30;

        console.log(`💰 Cost Saver: Daily budget = ${data.budget.currencySymbol}${dailyBudget.toFixed(2)}`);

        return Array(30).fill(null).map((_, i) => ({
            day: i + 1,
            budget: dailyBudget
        }));
    }

    /**
     * Build AI prompt for cost optimization
     */
    prompter(data: PreAnalysisData, dailyBudgets: DailyBudget[]): string {
        const dailyBudget = dailyBudgets[0].budget;
        const targetBudget = dailyBudget * 0.95; // -5% of budget
        const { currencySymbol, pricePerKwh } = data.budget;

        // Device list with essential info
        const deviceList = data.devices.map((d, i) =>
            `${i + 1}. ID: "${d.id}"
   Type: ${d.type}
   Wattage: ${d.wattage}W
   Priority: ${d.priority} (1=low, 5=critical)
   User's normal usage: ${d.hoursPerDay}h/day`
        ).join('\n\n');

        // Weather for each day
        const weatherByDay = data.weather.map((w, i) =>
            `Day ${i + 1}: ${w.condition}, ${w.avgTemp}°C, Humidity: ${w.humidity}%`
        ).join('\n');

        return `You are an AI energy optimizer generating a COST SAVER plan for 30 days.

BUDGET CONSTRAINT:
- Daily budget: ${currencySymbol}${dailyBudget.toFixed(2)}
- TARGET: Aim for ${currencySymbol}${targetBudget.toFixed(2)} per day (at least -5% under budget)
- Price per kWh: ${currencySymbol}${pricePerKwh}

DEVICES (${data.devices.length} total):
${deviceList}

WEATHER (30 days):
${weatherByDay}

===================================
CALCULATION FORMULA FOR ALLOCATION:
===================================

**Device Daily Cost Formula:**
Daily Cost = (Device Wattage ÷ 1000) × Hours × ${currencySymbol}${pricePerKwh}/kWh

**Example Calculation:**
- Device: AC (1500W)
- Hours: 4h
- Cost = (1500 ÷ 1000) × 4 × ${pricePerKwh} = ${(1.5 * 4 * data.budget.pricePerKwh).toFixed(2)} ${currencySymbol}

**Budget Allocation Strategy:**
1. Calculate each device's cost at different hour levels (1h, 2h, 3h, etc.)
2. Start with low hours for all devices
3. Incrementally add hours to devices based on priority
4. Stop when daily total reaches target budget (${currencySymbol}${targetBudget.toFixed(2)})

===================================
STEP-BY-STEP ANALYSIS PROCESS:
===================================

STEP 1: DEVICE TYPE CLASSIFICATION
Analyze each device by TYPE only (ignore name, power, priority for now):
- Weather-dependent: AC, Heater, Fan
- Always-needed: Refrigerator, Freezer, Lights, Laptop, Phone, TV, etc.

STEP 2: INITIAL ALLOCATION
Allocate ALL devices to EACH day initially.

STEP 3: WEATHER CHECK (Day-by-Day)
For EACH day, check the weather:
- Temperature
- Condition (rain, clear, cloudy, etc.)

STEP 4: WEATHER-BASED FILTERING
For EACH day, filter devices based on weather REGARDLESS of priority:
Example:
- If temp ≥ 30°C: Keep AC, remove Heater
- If temp ≤ 18°C: Keep Heater, remove AC  
- If 18°C < temp < 30°C: Remove both AC and Heater, keep Fan
- Weather-independent devices (Laptop, TV, Fridge, etc.): Keep on ALL days

⚠️ CRITICAL: Each day will have DIFFERENT weather, so device lists and hours MUST VARY per day!
DO NOT copy day1 to all other days. Weather changes = different devices and hours.

STEP 5: BUDGET COST MANAGEMENT (Per Day)
For each day after filtering:

a) Calculate cost for each device at different hour levels
b) Allocate hours based on priority:
   - Higher priority: More hours (but CAN be reduced if needed)
   - Medium priority: Moderate hours
   - Lower priority: Minimal hours
c) Adjust hours to stay UNDER target budget (${currencySymbol}${targetBudget.toFixed(2)})
   - Reduce usage hours (can be LOWER than user's normal usage)
   - Higher priority gets MORE hours than lower priority
   - But NO device runs 24/7
d) Final day cost MUST be ≤ ${currencySymbol}${targetBudget.toFixed(2)}

STEP 6: SMART TIPS GENERATION
Generate ONE smart tip for EACH unique device in the device list.
Tips should be actionable energy-saving advice specific to that device type.
Maximum 15 words per tip.

===================================
OUTPUT FORMAT (JSON):
===================================

{
  "plan": {
    "day1": {
      "devices": {
        "device_id_1": {
          "hours": 3.0,
          "cost": 25.50
        },
        "device_id_2": {
          "hours": 1.5,
          "cost": 12.00
        }
      },
      "totalCost": 78.50
    },
    "day2": {...},
    ...
    "day30": {...}
  },
  "deviceTips": {
    "device_id_1": "Use AC only during peak heat hours to maximize cooling efficiency.",
    "device_id_2": "Clean refrigerator coils monthly to maintain optimal energy efficiency."
  }
}

===================================
CRITICAL RULES:
===================================

1. Device IDs must be EXACT (use quotes, no spaces)
2. Every day's totalCost MUST be ≤ ${currencySymbol}${targetBudget.toFixed(2)}
3. NO device runs 24 hours
4. Filter devices by TYPE vs weather (AC on hot days only, Heater on cold days only)
5. Priority affects hours allocated (higher = more hours)
6. Usage hours CAN be lower than user's normal usage
7. Generate exactly ONE tip per unique device
8. Tips must be ≤ 15 words
9. Return ONLY valid JSON

Return ONLY the JSON object. NO explanations or markdown.`;
    }

    /**
     * Call Bedrock AI and retrieve response
     */
    async resultRetriever(prompt: string): Promise<any> {
        console.log('🤖 Cost Saver: Calling AI...');

        const systemPrompt = `You are an expert energy cost optimizer. 
Follow the 7-step process exactly as described.
Filter devices by weather conditions.
Stay under the target budget for every single day.
Return ONLY valid JSON matching the specified structure.`;

        const response = await bedrockService.getJSONResponse(prompt, systemPrompt);

        console.log('✅ Cost Saver: AI response received');
        return response;
    }

    /**
     * Format AI response for frontend
     */
    resultRenderer(aiResponse: any, data: PreAnalysisData): AIPlan {
        console.log('🎨 Cost Saver: Rendering result...');

        const dailySchedules: any[] = [];
        const dailyTips: any[] = [];
        let totalOptimizedCost = 0;

        // Parse daily schedules
        for (let day = 1; day <= 30; day++) {
            const dayData = aiResponse.plan[`day${day}`];
            if (!dayData) continue;

            const weather = data.weather[day - 1];
            const schedule: any = {};

            // Add device allocations
            for (const [deviceId, allocation] of Object.entries(dayData.devices || {})) {
                const cleanId = deviceId.trim();
                schedule[cleanId] = {
                    usage: Math.round(((allocation as any).hours || 0) * 100) / 100,
                    cost: Math.round(((allocation as any).cost || 0) * 100) / 100
                };
            }

            // Add metadata
            schedule.dayNumber = day;
            schedule.date = new Date(Date.now() + (day - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            schedule.weather = weather;
            schedule.totalUsageHours = Math.round(Object.values(dayData.devices || {}).reduce((sum: number, d: any) => sum + (d.hours || 0), 0) * 100) / 100;
            schedule.estimatedCost = Math.round((dayData.totalCost || 0) * 100) / 100;

            dailySchedules.push(schedule);
            totalOptimizedCost += schedule.estimatedCost;
        }

        // Parse device tips
        const deviceTips = aiResponse.deviceTips || {};
        for (const [deviceId, tip] of Object.entries(deviceTips)) {
            dailyTips.push({
                deviceId: deviceId.trim(),
                tip: (tip as string).substring(0, 100) // Limit to 100 chars
            });
        }

        const avgDailyCost = totalOptimizedCost / 30;

        console.log(`✅ Cost Saver: Avg daily cost = ${data.budget.currencySymbol}${avgDailyCost.toFixed(2)}`);
        console.log(`✅ Cost Saver: Generated ${dailyTips.length} smart tips`);

        return {
            id: `cost-saver-${Date.now()}`,
            type: 'cost',
            name: 'Cost Saver',
            description: 'Minimize energy costs while maintaining essential services',
            dailySchedules,
            devices: data.devices.map(d => d.id),
            metrics: {
                initialBudget: Math.round(data.budget.preferredBudget * 100) / 100,
                optimizedBudget: Math.round(totalOptimizedCost * 100) / 100,
                monthlySaving: Math.round((data.budget.preferredBudget - totalOptimizedCost) * 100) / 100
            },
            dailyTips,
            smartAlerts: []
        };
    }

    /**
     * Main entry point - Generate complete plan
     */
    async generate(data: PreAnalysisData): Promise<AIPlan> {
        console.log('\n🔵 === COST SAVER PLAN ===');

        const budgets = this.monthCostBreakdown(data);
        const prompt = this.prompter(data, budgets);
        const aiResponse = await this.resultRetriever(prompt);
        const plan = this.resultRenderer(aiResponse, data);

        console.log('✅ Cost Saver Plan complete\n');
        return plan;
    }
}
