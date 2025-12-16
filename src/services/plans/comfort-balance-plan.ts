/**
 * Comfort Balance Plan Generator
 * 
 * Goal: Balance comfort, cost, and environmental impact
 * Strategy: Prioritize essential devices, moderate reductions
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
        const dailyBudget = ((data.budget.averageMonthlyCost + data.budget.preferredBudget) / 2) / 30;

        console.log(`⚖️ Comfort Balance: Daily budget = ₦${dailyBudget.toFixed(2)}`);

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

        const deviceList = data.devices.map((d, i) =>
            `${i + 1}. ID: "${d.id}"
   Name: "${d.name}"
   Type: ${d.type}
   Wattage: ${d.wattage}W
   Priority: ${d.priority}
   User uses: ${d.hoursPerDay}h/day`
        ).join('\n\n');

        const weatherSummary = data.weather.map((w, i) =>
            `Day ${i + 1}: ${w.condition}, ${w.avgTemp}°C`
        ).join('\n');

        return `You are generating a COMFORT BALANCE energy plan for 30 days.

GOAL: Balance comfort, cost savings, and environmental impact

BUDGET: ₦${dailyBudget.toFixed(2)}/day (blend of average and preferred)

DEVICES (${data.devices.length} total):
${deviceList}

WEATHER (30 days):
${weatherSummary}

BALANCE STRATEGY:

**Essential Devices** (Priority 4-5):
- Refrigerator, Freezer, Critical equipment
- Run at 80-100% of user preference
- Maintain comfort and functionality

**Non-Essential Devices** (Priority 1-3):
- TV, Gaming, Entertainment
- Reduce to 50-70% of user preference

**High-Wattage Devices**:
- AC, Heater: Limited but not eliminated
  - Hot days: 6-8h (vs user's 10-12h)
  - Cold days: 6-8h
- Water Heater: 2-3h (vs user's 4-5h)

OPTIMIZATION RULES:

1. **Prioritize Essentials**
   - Give near-normal hours to maintain quality of life

2. **Moderate High-Wattage**
   - Reduce but don't eliminate
   - User still gets comfort

3. **Cut Non-Essentials**
   - Entertainment devices get reduced hours
   - Still usable but controlled

4. **Stay Within Budget**
   - Total <= ₦${dailyBudget.toFixed(2)}/day
   - If over, reduce non-essentials first
   - Touch essentials only as last resort

OUTPUT FORMAT (JSON):
{
  "plan": {
    "day1": {
      "devices": {
        "device_id": {
          "hours": 6.0,
          "window": "2pm-8pm",
          "cost": 45.00
        }
      },
      "totalCost": 80.00
    },
    ...
    "day30": {...}
  }
}

CRITICAL RULES:
- Essential devices: 80-100% of user hours
- High-wattage: 50-80% of user hours
- Non-essential: 50- 70% of user hours
- Total cost <= ₦${dailyBudget.toFixed(2)}/day
- Device IDs EXACT (no spaces)

Return ONLY valid JSON. NO explanations.`;
    }

    /**
     * Call Bedrock AI and retrieve response
     */
    async resultRetriever(prompt: string): Promise<any> {
        console.log('🤖 Comfort Balance: Calling AI...');

        const systemPrompt = `You are an energy consultant focused on balanced optimization.
You must maintain user comfort while achieving reasonable cost and environmental savings.
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
        let totalOptimizedCost = 0;

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
        }

        const avgCost = totalOptimizedCost / 30;
        const originalCost = data.budget.averageMonthlyCost;
        const budgetReduction = ((originalCost - totalOptimizedCost) / originalCost) * 100;

        console.log(`✅ Comfort Balance: ${budgetReduction.toFixed(1)}% cost reduction`);

        return {
            id: `comfort-balance-${Date.now()}`,
            type: 'balance',
            name: 'Comfort Balance',
            description: 'Optimal balance between comfort, savings, and environmental care',
            dailySchedules,
            devices: data.devices.map(d => d.id),
            metrics: {
                budgetReductionPercentage: budgetReduction,
                ecoFriendlyGainPercentage: 20
            },
            dailyTips: [],
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
