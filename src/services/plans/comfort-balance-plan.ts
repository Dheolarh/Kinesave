/**
 * Comfort Balance Plan Generator
 * 
 * Goal: Perfect balance between cost savings and environmental impact
 * Budget: ((Average + Preferred) ÷ 2) ÷ 30
 * Strategy: Blend of priority-based (Cost) and pollution-based (Eco) allocation
 */

import { PreAnalysisData } from '../pre-analysis-data';
import bedrockService from '../bedrock.service';
import { AIPlan } from '../../types/ai-plan.types';
import { DailyBudget } from './cost-saver-plan';

export class ComfortBalancePlan {

    /**
     * Calculate daily budgets for 30 days
     * Comfort Balance uses: ((Average + Preferred) ÷ 2) ÷ 30
     */
    monthCostBreakdown(data: PreAnalysisData): DailyBudget[] {
        const monthlyBudget = (data.budget.averageMonthlyCost + data.budget.preferredBudget) / 2;
        const dailyBudget = monthlyBudget / 30;

        console.log(`⚖️ Comfort Balance: Daily budget = ${data.budget.currencySymbol}${dailyBudget.toFixed(2)}`);

        return Array(30).fill(null).map((_, i) => ({
            day: i + 1,
            budget: dailyBudget
        }));
    }

    /**
     * Build AI prompt for balanced optimization
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
            `Day ${i + 1}: ${w.condition}, ${w.avgTemp}°C`
        ).join('\n');

        return `You are an AI energy optimizer generating a COMFORT BALANCE plan for 30 days.

BUDGET CONSTRAINT:
- Daily budget: ${currencySymbol}${dailyBudget.toFixed(2)} (blended: average + preferred)
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
1. Calculate each device's cost at different hour levels
2. Start with moderate hours for all devices
3. Balance between priority (user needs) and pollution (environmental impact)
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

STEP 5: DUAL CLASSIFICATION (Priority + Pollution)
For remaining devices, classify using BOTH systems:

**A) Priority Levels (User needs):**
- High Priority (4-5): Essential for comfort
- Medium Priority (3): Important but flexible
- Low Priority (1-2): Optional/luxury

**B) Pollution Levels (Environmental impact):**
- HIGH POLLUTION (Level 3): AC, Heater, Dryer, Water Heater
- MEDIUM POLLUTION (Level 2): Fridge, Freezer, Washing Machine, Microwave
- LOW POLLUTION (Level 1): LED Lights, Laptop, Phone, Fan, TV

STEP 6: BALANCED HOUR ALLOCATION
Allocate hours using a BALANCED approach:

**Formula for each device:**
Base Hours = User's normal usage × Balance Factor

**Balance Factor Calculation:**
- If HIGH Priority + LOW Pollution: 85-95% of user hours (best case)
- If HIGH Priority + MEDIUM Pollution: 75-85% of user hours
- If HIGH Priority + HIGH Pollution: 60-75% of user hours
- If MEDIUM Priority + LOW Pollution: 70-80% of user hours
- If MEDIUM Priority + MEDIUM Pollution: 55-70% of user hours
- If MEDIUM Priority + HIGH Pollution: 45-60% of user hours
- If LOW Priority + LOW Pollution: 50-65% of user hours
- If LOW Priority + MEDIUM Pollution: 35-50% of user hours
- If LOW Priority + HIGH Pollution: 25-40% of user hours (worst case)

**Examples:**
1. Laptop (High Priority, Low Pollution): 8h user → 7h allocated (85%)
2. AC (High Priority, High Pollution): 8h user → 5h allocated (65%)
3. TV (Low Priority, Medium Pollution): 6h user → 2.5h allocated (42%)

**Budget Management:**
- Use calculation formula to ensure total ≤ ${currencySymbol}${targetBudget.toFixed(2)}
- If over budget: Reduce hours from low-priority OR high-pollution devices first
- NO device runs 24 hours

STEP 7: SMART TIPS GENERATION
Generate ONE balanced tip for EACH unique device.
Tips should balance cost-saving AND environmental advice.
Maximum 15 words per tip.

===================================
OUTPUT FORMAT (JSON):
===================================

{
  "plan": {
    "day1": {
      "devices": {
        "device_id_1": {
          "hours": 5.0,
          "cost": 35.00,
          "balanceFactor": 0.65
        },
        "device_id_2": {
          "hours": 7.0,
          "cost": 8.50,
          "balanceFactor": 0.88
        }
      },
      "totalCost": 88.00,
      "ecoScore": 75
    },
    "day2": {...},
    ...
    "day30": {...}
  },
  "deviceTips": {
    "device_id_1": "Use AC during peak heat only to balance comfort and emissions.",
    "device_id_2": "Optimize laptop power settings for efficiency without losing productivity."
  }
}

===================================
CRITICAL RULES:
===================================

1. Device IDs must be EXACT (use quotes, no spaces)
2. Every day's totalCost MUST be ≤ ${currencySymbol}${targetBudget.toFixed(2)}
3. NO device runs 24 hours
4. Filter devices by TYPE vs weather (same as Cost & Eco)
5. Use BOTH priority AND pollution to determine hours
6. Balance Factor = blend of user needs + environmental impact
7. High Priority + Low Pollution = MOST hours
8. Low Priority + High Pollution = LEAST hours
9. Use calculation formula to stay under budget
10. Generate exactly ONE tip per unique device
11. Tips must be ≤ 15 words and balance cost + eco advice
12. Include balanceFactor for each device (to show allocation logic)
13. Include ecoScore (0-100) for each day
14. Return ONLY valid JSON (no priority/pollutionLevel in output - they're in input)

Return ONLY the JSON object. NO explanations or markdown.`;
    }

    /**
     * Call Bedrock AI and retrieve response
     */
    async resultRetriever(prompt: string): Promise<any> {
        console.log('🤖 Comfort Balance: Calling AI...');

        const systemPrompt = `You are an expert energy consultant focused on balanced optimization.
Maintain user comfort while achieving cost and environmental savings.
Use BOTH priority and pollution levels to allocate hours.
Follow the balance factor calculation exactly.
Filter by weather conditions.
Stay under budget using the calculation formula.
Return ONLY valid JSON matching the specified structure.`;

        const response = await bedrockService.getJSONResponse(prompt, systemPrompt);

        console.log('✅ Comfort Balance: AI response received');
        return response;
    }

    /**
     * Format AI response for frontend
     */
    resultRenderer(aiResponse: any, data: PreAnalysisData): AIPlan {
        console.log('🎨 Comfort Balance: Rendering result...');

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
                    balanceFactor: Math.round(((allocation as any).balanceFactor || 0.65) * 100) / 100
                };
            }

            schedule.dayNumber = day;
            schedule.date = new Date(Date.now() + (day - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            schedule.weather = weather;
            schedule.totalUsageHours = Math.round(Object.values(dayData.devices || {}).reduce((sum: number, d: any) => sum + (d.hours || 0), 0) * 100) / 100;
            schedule.estimatedCost = Math.round((dayData.totalCost || 0) * 100) / 100;
            schedule.ecoScore = Math.round(dayData.ecoScore || 70); // AI returns eco score for balanced approach

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

        const originalCost = data.budget.averageMonthlyCost;
        const budgetReduction = ((originalCost - totalOptimizedCost) / originalCost) * 100;

        // Calculate eco improvement (like Eco Mode but with balanced baseline)
        const initialEcoScore = 50; // Baseline before optimization
        const ecoImprovement = ((avgEcoScore - initialEcoScore) / initialEcoScore) * 100;

        console.log(`✅ Comfort Balance: ${budgetReduction.toFixed(1)}% cost reduction`);
        console.log(`✅ Comfort Balance: ${ecoImprovement.toFixed(1)}% eco improvement`);
        console.log(`✅ Comfort Balance: Generated ${dailyTips.length} balanced tips`);

        return {
            id: `comfort-balance-${Date.now()}`,
            type: 'balance',
            name: 'Comfort Balance',
            description: 'Optimal balance between comfort, cost savings, and environmental care',
            dailySchedules,
            devices: data.devices.map(d => d.id),
            metrics: {
                budgetReductionPercentage: Math.round(budgetReduction * 10) / 10,
                ecoFriendlyGainPercentage: Math.round(ecoImprovement * 10) / 10
            },
            dailyTips,
            smartAlerts: []
        };
    }

    /**
     * Main entry point
     */
    async generate(data: PreAnalysisData): Promise<AIPlan> {
        console.log('\n🟡 === COMFORT BALANCE PLAN ===');

        const budgets = this.monthCostBreakdown(data);
        const prompt = this.prompter(data, budgets);
        const aiResponse = await this.resultRetriever(prompt);
        const plan = this.resultRenderer(aiResponse, data);

        console.log('✅ Comfort Balance Plan complete\n');
        return plan;
    }
}
