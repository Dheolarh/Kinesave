/**
 * Eco Mode Plan Generator
 * 
 * Goal: Minimize environmental impact (pollution/emissions)
 * Budget: Average Monthly Cost ÷ 30
 * Strategy: Pollution-based device levels with weather filtering
 */

import { PreAnalysisData, } from '../pre-analysis-data';
import bedrockService from '../bedrock.service';
import { AIPlan } from '../../types/ai-plan.types';
import { DailyBudget } from './cost-saver-plan';

export class EcoModePlan {

    /**
     * Calculate daily budgets for 30 days
     * Eco Mode uses: Average Monthly Cost ÷ 30
     */
    monthCostBreakdown(data: PreAnalysisData): DailyBudget[] {
        const dailyBudget = data.budget.averageMonthlyCost / 30;

        console.log(`🌱 Eco Mode: Daily budget = ${data.budget.currencySymbol}${dailyBudget.toFixed(2)}`);

        return Array(30).fill(null).map((_, i) => ({
            day: i + 1,
            budget: dailyBudget
        }));
    }

    /**
     * Build AI prompt for eco optimization
     */
    prompter(data: PreAnalysisData, dailyBudgets: DailyBudget[]): string {
        const dailyBudget = dailyBudgets[0].budget;
        const targetBudget = dailyBudget * 0.95; // -5% of budget
        const { currencySymbol, pricePerKwh } = data.budget;

        const deviceList = data.devices.map((d, i) =>
            `${i + 1}. ID: "${d.id}"
   Type: ${d.type}
   Wattage: ${d.wattage}W
   Priority: ${d.priority}
   User's normal usage: ${d.hoursPerDay}h/day`
        ).join('\n\n');

        const weatherByDay = data.weather.map((w, i) =>
            `Day ${i + 1}: ${w.condition}, ${w.avgTemp}°C, Humidity: ${w.humidity}%`
        ).join('\n');

        return `You are an AI energy optimizer generating an ECO MODE plan for 30 days.

BUDGET CONSTRAINT:
- Daily budget: ${currencySymbol}${dailyBudget.toFixed(2)} (from average monthly cost)
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
3. Incrementally add hours to devices based on pollution level and priority
4. Stop when daily total reaches target budget (${currencySymbol}${targetBudget.toFixed(2)})

===================================
STEP-BY-STEP ANALYSIS PROCESS:
===================================

STEP 1: DEVICE TYPE CLASSIFICATION
Analyze each device by TYPE only:
- Weather-dependent: AC, Heater, Fan
- Always-needed: Refrigerator, Freezer, Lights, Laptop, TV, etc.

STEP 2: INITIAL ALLOCATION
Allocate ALL devices to EACH day initially.

STEP 3: WEATHER CHECK (Day-by-Day)
For EACH day, check the weather temperature and condition.

STEP 4: WEATHER-BASED FILTERING
For EACH day, filter devices based on weather REGARDLESS of priority:
- If temp ≥ 30°C: Keep AC, remove Heater
- If temp ≤ 18°C: Keep Heater, remove AC
- If 18°C < temp < 30°C: Remove both AC and Heater, keep Fan
- Weather-independent devices: Keep on ALL days

⚠️ CRITICAL: Each day will have DIFFERENT weather, so device lists and hours MUST VARY per day!
DO NOT copy day1 to all other days. Weather changes = different devices and hours.

STEP 5: POLLUTION LEVEL CLASSIFICATION
Classify remaining devices by environmental pollution level:

**HIGH POLLUTION (Level 3):**
- AC (CFCs cause global warming, high energy consumption)
- Heater (high energy, emissions)
- Dryer (high energy)
- Water Heater (high energy)

**MEDIUM POLLUTION (Level 2):**
- Refrigerator (CFCs but necessary)
- Freezer (CFCs but necessary)
- Washing Machine (water & energy usage)
- Microwave (moderate energy)
- Oven (moderate to high energy)

**LOW POLLUTION (Level 1):**
- LED Lights (minimal energy)
- Laptop (low energy)
- Phone Charger (minimal energy)
- Fan (low energy)
- TV (moderate but acceptable)

STEP 6: ECO-BASED HOUR ALLOCATION
Allocate hours based on pollution level (NOT device priority):

a) **HIGH POLLUTION devices (Level 3):**
   - Get MINIMAL hours (20-40% of user's normal usage)
   - Example: If user uses AC 8h/day → Give 2-3h MAX
   
b) **MEDIUM POLLUTION devices (Level 2):**
   - Get MODERATE hours (50-70% of user's normal usage)
   - Example: If user uses Fridge 24h/day → Give 12-16h
   
c) **LOW POLLUTION devices (Level 1):**
   - Get MAXIMUM hours (80-100% of user's normal usage)
   - Example: If user uses Laptop 6h/day → Give 5-6h

d) **Use the calculation formula to ensure total cost ≤ ${currencySymbol}${targetBudget.toFixed(2)}**
   - Calculate cost for each device at allocated hours
   - Reduce high-pollution device hours first if over budget
   - NO device runs 24 hours

STEP 7: SMART TIPS GENERATION
Generate ONE eco-focused tip for EACH unique device.
Tips should focus on environmental impact reduction.
Maximum 15 words per tip.

===================================
OUTPUT FORMAT (JSON):
===================================

{
  "plan": {
    "day1": {
      "devices": {
        "device_id_1": {
          "hours": 2.5,
          "cost": 22.50,
          "pollutionLevel": 3
        },
        "device_id_2": {
          "hours": 12.0,
          "cost": 15.00,
          "pollutionLevel": 2
        }
      },
      "totalCost": 95.00,
      "ecoScore": 82
    },
    "day2": {...},
    ...
    "day30": {...}
  },
  "deviceTips": {
    "device_id_1": "Minimize AC usage during cooler hours to reduce carbon emissions.",
    "device_id_2": "Keep refrigerator full to maintain temperature with less energy."
  }
}

===================================
CRITICAL RULES:
===================================

1. Device IDs must be EXACT (use quotes, no spaces)
2. Every day's totalCost MUST be ≤ ${currencySymbol}${targetBudget.toFixed(2)}
3. NO device runs 24 hours
4. Filter devices by TYPE vs weather (same as Cost Saver)
5. Pollution level (NOT priority) determines hours allocated
6. HIGH pollution devices get MINIMAL hours (20-40%)
7. MEDIUM pollution devices get MODERATE hours (50-70%)
8. LOW pollution devices get MAXIMUM hours (80-100%)
9. Use calculation formula to stay under budget
10. Generate exactly ONE tip per unique device
11. Tips must be ≤ 15 words and eco-focused
12. Include pollutionLevel (1, 2, or 3) for each device
13. Include ecoScore (0-100) for each day
14. Return ONLY valid JSON

Return ONLY the JSON object. NO explanations or markdown.`;
    }

    /**
     * Call Bedrock AI and retrieve response
     */
    async resultRetriever(prompt: string): Promise<any> {
        console.log('🤖 Eco Mode: Calling AI...');

        const systemPrompt = `You are an expert environmental energy optimizer.
Prioritize pollution reduction over user convenience.
Classify devices by pollution level, not user priority.
Follow the calculation formula to stay under budget.
Filter by weather conditions.
Return ONLY valid JSON matching the specified structure.`;

        const response = await bedrockService.getJSONResponse(prompt, systemPrompt);

        console.log('✅ Eco Mode: AI response received');
        return response;
    }

    /**
     * Format AI response for frontend
     */
    resultRenderer(aiResponse: any, data: PreAnalysisData): AIPlan {
        console.log('🎨 Eco Mode: Rendering result...');

        const dailySchedules: any[] = [];
        const dailyTips: any[] = [];
        let totalOptimizedCost = 0;
        let avgEcoScore = 0;

        for (let day = 1; day <= 30; day++) {
            const dayData = aiResponse.plan[`day${day}`];
            if (!dayData) continue;

            const weather = data.weather[day - 1];
            const schedule: any = {};

            for (const [deviceId, allocation] of Object.entries(dayData.devices || {})) {
                const cleanId = deviceId.trim();
                schedule[cleanId] = {
                    usage: Math.round(((allocation as any).hours || 0) * 100) / 100,
                    cost: Math.round(((allocation as any).cost || 0) * 100) / 100,
                    pollutionLevel: (allocation as any).pollutionLevel || 2
                };
            }

            schedule.dayNumber = day;
            schedule.date = new Date(Date.now() + (day - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            schedule.weather = weather;
            schedule.totalUsageHours = Math.round(Object.values(dayData.devices || {}).reduce((sum: number, d: any) => sum + (d.hours || 0), 0) * 100) / 100;
            schedule.estimatedCost = Math.round((dayData.totalCost || 0) * 100) / 100;
            schedule.ecoScore = Math.round(dayData.ecoScore || 75);

            dailySchedules.push(schedule);
            totalOptimizedCost += schedule.estimatedCost;
            avgEcoScore += schedule.ecoScore;
        }

        avgEcoScore = avgEcoScore / 30;

        // Parse device tips
        const deviceTips = aiResponse.deviceTips || {};
        for (const [deviceId, tip] of Object.entries(deviceTips)) {
            dailyTips.push({
                deviceId: deviceId.trim(),
                tip: (tip as string).substring(0, 100)
            });
        }

        console.log(`✅ Eco Mode: Avg eco score = ${avgEcoScore.toFixed(1)}/100`);
        console.log(`✅ Eco Mode: Generated ${dailyTips.length} eco tips`);

        return {
            id: `eco-mode-${Date.now()}`,
            type: 'eco',
            name: 'Eco Mode',
            description: 'Minimize environmental impact with pollution-based energy management',
            dailySchedules,
            devices: data.devices.map(d => d.id),
            metrics: {
                initialEcoScore: 50,
                optimizedEcoScore: Math.round(avgEcoScore * 10) / 10,
                ecoImprovementPercentage: Math.round(((avgEcoScore - 50) / 50) * 1000) / 10,
                monthlyCostCap: Math.round(totalOptimizedCost * 100) / 100
            },
            dailyTips,
            smartAlerts: []
        };
    }

    /**
     * Main entry point
     */
    async generate(data: PreAnalysisData): Promise<AIPlan> {
        console.log('\n🟢 === ECO MODE PLAN ===');

        const budgets = this.monthCostBreakdown(data);
        const prompt = this.prompter(data, budgets);
        const aiResponse = await this.resultRetriever(prompt);
        const plan = this.resultRenderer(aiResponse, data);

        console.log('✅ Eco Mode Plan complete\n');
        return plan;
    }
}
