/**
 * Cost Saver Plan Generator
 * 
 * Goal: Stay strictly UNDER the user's preferred budget
 * Strategy: Minimize device hours, purge non-essential devices if needed
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

        console.log(`💰 Cost Saver: Daily budget = ₦${dailyBudget.toFixed(2)}`);

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

        // Device list with details
        const deviceList = data.devices.map((d, i) =>
            `${i + 1}. ID: "${d.id}"
   Name: "${d.name}"
   Type: ${d.type}
   Wattage: ${d.wattage}W
   Priority: ${d.priority} (1=low, 5=critical)
   User normally uses: ${d.hoursPerDay}h/day`
        ).join('\n\n');

        // Weather summary
        const weatherSummary = data.weather.map((w, i) =>
            `Day ${i + 1}: ${w.condition}, ${w.avgTemp}°C, Humidity: ${w.humidity}%`
        ).join('\n');

        return `You are generating a COST SAVER energy plan for 30 days.

GOAL: Minimize costs. Stay UNDER ₦${dailyBudget.toFixed(2)}/day budget.

DEVICES (${data.devices.length} total):
${deviceList}

WEATHER (30 days):
${weatherSummary}

COST FORMULA:
Daily Cost = Σ((Device Wattage ÷ 1000) × Hours × ₦${data.budget.pricePerKwh}/kWh)

OPTIMIZATION STRATEGY:

1. **Essential Devices First** (Priority 4-5)
   - Refrigerator, Freezer: Run 24h
   - Calculate their base cost

2. **Remaining Budget**
   - Subtract essential device costs from daily budget
   - Allocate remaining budget to other devices

3. **Weather-Based Allocation**
   - AC: ONLY on hot days (>28°C), minimize hours
   - Heater: ONLY on cold days (<18°C)
   - Fan: On moderate days (23-28°C)
   - Non-weather devices: Reduce to minimum viable hours

4. **Purging Strategy** (if needed to meet budget)
   - Remove lowest priority devices first
   - Weather-inappropriate devices (AC on cool days)
   - Redundant devices (Fan when AC running)

OUTPUT FORMAT (JSON):
{
  "plan": {
    "day1": {
      "devices": {
        "device_id": {
          "hours": 2.5,
          "window": "2pm-4:30pm",
          "cost": 25.50
        }
      },
      "totalCost": 65.00
    },
    "day2": {...},
    ...
    "day30": {...}
  }
}

CRITICAL RULES:
- Every day MUST have totalCost <= ₦${dailyBudget.toFixed(2)}
- Device IDs must be EXACT (no spaces)
- Essential devices (priority 4-5) must run every day
- AC only on days >28°C
- Heater only on days <18°C

Return ONLY valid JSON. NO explanations.`;
    }

    /**
     * Call Bedrock AI and retrieve response
     */
    async resultRetriever(prompt: string): Promise<any> {
        console.log('🤖 Cost Saver: Calling AI...');

        const systemPrompt = `You are an energy optimization expert focused on cost reduction. 
You must generate a 30-day plan where EVERY day stays under the budget constraint.
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
        let totalOptimizedCost = 0;

        // Parse each day
        for (let day = 1; day <= 30; day++) {
            const dayData = aiResponse.plan[`day${day}`];
            if (!dayData) continue;

            const weather = data.weather[day - 1];
            const schedule: any = {};

            // Add device allocations
            for (const [deviceId, allocation] of Object.entries(dayData.devices || {})) {
                const cleanId = deviceId.trim();
                schedule[cleanId] = {
                    usage: (allocation as any).hours || 0,
                    window: (allocation as any).window || 'All day',
                    cost: (allocation as any).cost || 0
                };
            }

            // Add metadata
            schedule.dayNumber = day;
            schedule.date = new Date(Date.now() + (day - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            schedule.weather = weather;
            schedule.totalUsageHours = Object.values(dayData.devices || {}).reduce((sum: number, d: any) => sum + (d.hours || 0), 0);
            schedule.estimatedCost = dayData.totalCost || 0;

            dailySchedules.push(schedule);
            totalOptimizedCost += schedule.estimatedCost;
        }

        const avgDailyCost = totalOptimizedCost / 30;

        console.log(`✅ Cost Saver: Avg daily cost = ₦${avgDailyCost.toFixed(2)}`);

        return {
            id: `cost-saver-${Date.now()}`,
            type: 'cost',
            name: 'Cost Saver',
            description: 'Minimize energy costs while maintaining essential services',
            dailySchedules,
            devices: data.devices.map(d => d.id),
            metrics: {
                initialBudget: data.budget.preferredBudget,
                optimizedBudget: totalOptimizedCost,
                monthlySaving: data.budget.preferredBudget - totalOptimizedCost
            },
            dailyTips: [],
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
