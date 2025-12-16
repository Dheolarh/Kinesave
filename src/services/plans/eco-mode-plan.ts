/**
 * Eco Mode Plan Generator
 * 
 * Goal: Minimize environmental impact and emissions
 * Strategy: Reduce high-impact devices drastically, optimize energy usage
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

        console.log(`🌱 Eco Mode: Daily budget = ₦${dailyBudget.toFixed(2)}`);

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

        const deviceList = data.devices.map((d, i) =>
            `${i + 1}. ID: "${d.id}"
   Name: "${d.name}"
   Type: ${d.type}
   Wattage: ${d.wattage}W
   Priority: ${d.priority}
   User uses: ${d.hoursPerDay}h/day`
        ).join('\n\n');

        const weatherSummary = data.weather.map((w, i) =>
            `Day ${i + 1}: ${w.condition}, ${w.avgTemp}°C, Humidity: ${w.humidity}%`
        ).join('\n');

        return `You are generating an ECO MODE energy plan for 30 days.

GOAL: Minimize environmental impact. Budget limit: ₦${dailyBudget.toFixed(2)}/day

DEVICES (${data.devices.length} total):
${deviceList}

WEATHER (30 days):
${weatherSummary}

ENVIRONMENTAL CLASSIFICATION:

**Level 1 (HIGH Impact)** - Drastic reduction required:
- AC, Heater, Water Heater, Dryer
- MAX 1-2 hours/day regardless of user preference

**Level 2 (MEDIUM Impact)** - Moderate reduction:
- Refrigerator, Washing Machine, Microwave
- 50-70% of user preference

**Level 3 (LOW Impact)** - Minimal reduction:
- LED Lights, Laptop, Phone, Fan
- 80-100% of user preference

ECO OPTIMIZATION STRATEGY:

1. **Classify Each Device** by environmental impact
2. **Apply Reduction Rules**:
   - Level 1: 1-2h MAX (even if user wants 8h)
   - Level 2: 50-70% of user hours
   - Level 3: 80-100% of user hours
3. **Weather Optimization**:
   - Remove AC/Heater on mild days
   - Prioritize natural ventilation (fans)
4. **Total Cost Constraint**:
   - Must stay <= ₦${dailyBudget.toFixed(2)}/day

OUTPUT FORMAT (JSON):
{
  "plan": {
    "day1": {
      "devices": {
        "device_id": {
          "hours": 1.5,
          "window": "12pm-1:30pm",
          "cost": 15.00,
          "ecoLevel": 1
        }
      },
      "totalCost": 95.00,
      "ecoScore": 85
    },
    ...
    "day30": {...}
  }
}

CRITICAL RULES:
- High-impact devices: MAX 2 hours/day
- Total cost <= ₦${dailyBudget.toFixed(2)}/day
- AC only if temp >30°C AND limited to 2h
- Prioritize low-wattage devices
- Device IDs must be EXACT (no spaces)

Return ONLY valid JSON. NO explanations.`;
    }

    /**
     * Call Bedrock AI and retrieve response
     */
    async resultRetriever(prompt: string): Promise<any> {
        console.log('🤖 Eco Mode: Calling AI...');

        const systemPrompt = `You are an environmental energy expert focused on minimizing carbon emissions.
You must drastically reduce high-impact devices while staying within budget.
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
                    usage: (allocation as any).hours || 0,
                    window: (allocation as any).window || 'All day',
                    cost: (allocation as any).cost || 0
                };
            }

            schedule.dayNumber = day;
            schedule.date = new Date(Date.now() + (day - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            schedule.weather = weather;
            schedule.totalUsageHours = Object.values(dayData.devices || {}).reduce((sum: number, d: any) => sum + (d.hours || 0), 0);
            schedule.estimatedCost = dayData.totalCost || 0;

            dailySchedules.push(schedule);
            totalOptimizedCost += schedule.estimatedCost;
            avgEcoScore += dayData.ecoScore || 75;
        }

        avgEcoScore = avgEcoScore / 30;

        console.log(`✅ Eco Mode: Avg eco score = ${avgEcoScore.toFixed(1)}/100`);

        return {
            id: `eco-mode-${Date.now()}`,
            type: 'eco',
            name: 'Eco Mode',
            description: 'Minimize environmental impact with smart energy usage',
            dailySchedules,
            devices: data.devices.map(d => d.id),
            metrics: {
                initialEcoScore: 50,
                optimizedEcoScore: avgEcoScore,
                ecoImprovementPercentage: ((avgEcoScore - 50) / 50) * 100,
                monthlyCostCap: totalOptimizedCost
            },
            dailyTips: [],
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
