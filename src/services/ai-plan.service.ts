import bedrockService from './bedrock.service';
import weatherService from './weather.service';
import { getCurrentUserProfile } from '../utils/storage';
import { FEATURES } from '../config/features';
import type {
    AIAnalysisInput,
    AIPlansResponse,
    DeviceForAnalysis
} from '../types/ai-plan.types';

/**
 * AI Plan Generation Service
 * Generates 3 energy optimization plans using AWS Bedrock Claude 3
 */
class AIPlanService {
    /**
     * Generate AI-powered energy plans for given devices
     * Uses chunked generation (7 days at a time) to avoid token limits
     */
    async generatePlans(deviceIds: string[]): Promise<AIPlansResponse> {
        try {
            console.log('Starting AI plan generation for', deviceIds.length, 'devices');

            // Step 1: Prepare analysis input data
            const inputData = await this.prepareAnalysisInput(deviceIds);

            // Step 2: Generate plans in 3-day chunks (10 chunks for 30 days)
            console.log('Generating plans in 3-day chunks...');

            const chunks = [];
            const totalDays = inputData.analysisDays;
            const chunkSize = 3; // Reduced to 3 days for safer token limits

            for (let startDay = 1; startDay <= totalDays; startDay += chunkSize) {
                const endDay = Math.min(startDay + chunkSize - 1, totalDays);
                console.log(`Generating days ${startDay}-${endDay}...`);

                const chunkPrompt = this.buildChunkPrompt(inputData, startDay, endDay);
                const chunkResponse = await bedrockService.getJSONResponse(
                    chunkPrompt,
                    this.getSystemPrompt()
                );

                chunks.push({
                    startDay,
                    endDay,
                    data: chunkResponse
                });
            }

            // Step 3: Combine all chunks into complete plans
            console.log('Combining chunks into complete plans...');
            const completePlans = this.combineChunks(chunks, inputData);

            console.log('AI plan generation complete');
            return completePlans;
        } catch (error: any) {
            console.error('AI plan generation failed:', error);
            throw new Error(`Failed to generate AI plans: ${error.message}`);
        }
    }

    /**
     * Prepare all input data for AI analysis
     */
    private async prepareAnalysisInput(deviceIds: string[]): Promise<AIAnalysisInput> {
        const profile = getCurrentUserProfile();

        if (!profile) {
            throw new Error('No user profile found');
        }

        if (!profile.location) {
            throw new Error('Location not set. Please set your location in the dashboard.');
        }

        // Determine analysis period based on subscription (for MVP: 30 days)
        const analysisDays = FEATURES.use30DayAnalysis ? 30 : 16;

        // Get weather forecast
        console.log(`Fetching ${analysisDays}-day weather forecast...`);
        const weatherForecast = await weatherService.getMonthlyForecast(
            profile.location.latitude,
            profile.location.longitude,
            analysisDays,
            FEATURES.usePremiumWeatherAPI,
            FEATURES.openWeatherMapApiKey
        );

        // Filter and prepare devices
        const devices: DeviceForAnalysis[] = profile.devices
            .filter((d: any) => deviceIds.includes(d.id))
            .map((device: any) => ({
                id: device.id,
                name: device.customName || device.originalName,
                type: device.deviceType,
                wattage: device.wattage,
                priority: device.priority,
                survey: device.survey,
            }));

        if (devices.length === 0) {
            throw new Error('No valid devices selected for analysis');
        }

        const preferredBudget = profile.energyCosts?.preferredBudget || profile.energyCosts?.monthlyCost || 0;

        return {
            devices,
            userProfile: {
                householdSize: profile.aboutUser?.householdSize || 1,
                occupationType: profile.aboutUser?.occupationType || 'employed',
                homeType: profile.aboutUser?.homeType || 'apartment',
            },
            energyCosts: {
                averageMonthlyCost: profile.energyCosts?.monthlyCost || 0,
                pricePerKwh: profile.energyCosts?.pricePerKwh || 0,
                preferredBudget,
                currency: profile.energyCosts?.currency || 'USD',
                currencySymbol: profile.energyCosts?.currencySymbol || '$',
            },
            location: {
                city: profile.location.city,
                region: profile.location.region,
                country: profile.location.country,
                latitude: profile.location.latitude,
                longitude: profile.location.longitude,
                temperature: profile.location.temperature,
                weatherDescription: profile.location.weatherDescription,
            },
            weatherForecast,
            analysisDays,
            weatherSource: FEATURES.usePremiumWeatherAPI ? 'openweathermap' : analysisDays > 16 ? 'hybrid' : 'open-meteo',
        };
    }

    /**
     * Build system prompt for Claude
     */
    private getSystemPrompt(): string {
        return `You are an expert energy optimization AI assistant specializing in household energy management. Your role is to analyze home appliances, weather patterns, and user preferences to create personalized energy-saving plans.

Core Principles:
1. **Cost Efficiency**: Minimize electricity costs while maintaining functionality
2. **Environmental Impact**: Reduce pollution (CFCs, HFCs, noise, carbon emissions)
3. **User Comfort**: Consider household occupancy patterns and lifestyle
4. **Weather Intelligence**: Adapt schedules based on temperature, humidity, and forecasts
5. **Safety First**: Never suggest unsafe device usage patterns

Device Pollution Levels:
- **VERY HIGH**: Generators (-7 pts/hr) - Noise, CO emissions
- **HIGH**: Air Conditioners (-5 pts/hr), Heaters (-4 pts/hr) - CFCs/HFCs, GHGs
- **MEDIUM**: Refrigerators (-2 pts/hr), Washing Machines (-2 pts/hr)
- **LOW**: TVs (-0.5 pts/hr), LED Bulbs (-0.3 pts/hr), Fans (-0.5 pts/hr)

Your responses must be valid JSON only. No explanatory text before or after the JSON.`;
    }

    /**
     * Build prompt for a specific day range (chunk)
     */
    private buildChunkPrompt(data: AIAnalysisInput, startDay: number, endDay: number): string {
        const deviceList = data.devices.map((d, i) =>
            `${i + 1}. ${d.name} (${d.type}): ${d.wattage}W, Priority ${d.priority}, ${d.survey.hoursPerDay}hrs/day`
        ).join('\n');

        const weatherChunk = data.weatherForecast.slice(startDay - 1, endDay);

        return `Generate energy plans for days ${startDay}-${endDay} (${endDay - startDay + 1} days).

DEVICES: ${deviceList}
WEATHER: ${JSON.stringify(weatherChunk)}
BUDGET: ${data.energyCosts.currencySymbol}${data.energyCosts.preferredBudget || 0}/month (${((data.energyCosts.preferredBudget || 0) / 30).toFixed(2)}/day max)

Generate 3 plans (costSaver, ecoMode, comfortBalance) with:

1. METRICS (calculate for full ${data.analysisDays} days):
   - costSaver: {"initialBudget": ${data.energyCosts.preferredBudget || 0}, "optimizedBudget": <calculated>, "monthlySaving": <difference>}
   - ecoMode: {"initialEcoScore": 100, "optimizedEcoScore": <calculated 0-100>, "ecoImprovementPercentage": <improvement>, "monthlyCostCap": ${data.energyCosts.preferredBudget ? data.energyCosts.preferredBudget * 1.5 : 0}}
   - comfortBalance: {"optimized Budget": <calculated>, "budgetReductionPercentage": <percent>, "ecoFriendlyGainPercentage": <percent>}

2. dailySchedules: For days ${startDay}-${endDay}, simple array with date & device hours
3. dailyTips: dayNumber, 3-5 SHORT tips per day
4. smartAlerts: 3-5 brief alerts (only in LAST chunk for days 28-30)

Return ONLY this JSON:
{
  "costSaver": {"metrics":{...}, "dailySchedules":[...], "dailyTips":[...], "smartAlerts":[...]},
  "ecoMode": {"metrics":{...}, "dailySchedules":[...], "dailyTips":[...], "smartAlerts":[...]},
  "comfortBalance": {"metrics":{...}, "dailySchedules":[...], "dailyTips":[...], "smartAlerts":[...]}
}

Keep JSON COMPACT. NO explanations.`;
    }

    /**
     * Combine all chunks into complete 30-day plans
     */
    private combineChunks(chunks: any[], inputData: AIAnalysisInput): AIPlansResponse {
        const now = new Date();
        const validUntil = new Date(now);
        validUntil.setDate(validUntil.getDate() + 30);

        // Initialize combined structure
        const combined: Record<string, any> = {
            costSaver: {
                id: 'cost-saver-plan',
                type: 'cost',
                name: 'Cost Saver',
                dailySchedules: [],
                dailyTips: [],
                smartAlerts: [],
                devices: inputData.devices.map(d => d.id),
                metrics: { initialBudget: 0, optimizedBudget: 0, monthlySaving: 0 }
            },
            ecoMode: {
                id: 'eco-mode-plan',
                type: 'eco',
                name: 'Eco Mode',
                dailySchedules: [],
                dailyTips: [],
                smartAlerts: [],
                devices: inputData.devices.map(d => d.id),
                metrics: { initialEcoScore: 0, optimizedEcoScore: 0, ecoImprovementPercentage: 0, monthlyCostCap: 0 }
            },
            comfortBalance: {
                id: 'balanced-plan',
                type: 'balance',
                name: 'Comfort Balance',
                dailySchedules: [],
                dailyTips: [],
                smartAlerts: [],
                devices: inputData.devices.map(d => d.id),
                metrics: { optimizedBudget: 0, budgetReductionPercentage: 0, ecoFriendlyGainPercentage: 0 }
            }
        };

        // Combine chunks
        for (const chunk of chunks) {
            const plans = chunk.data;

            for (const planType of ['costSaver', 'ecoMode', 'comfortBalance']) {
                if (plans[planType]) {
                    // Merge daily schedules
                    if (plans[planType].dailySchedules) {
                        combined[planType].dailySchedules.push(...plans[planType].dailySchedules);
                    }

                    // Merge daily tips
                    if (plans[planType].dailyTips) {
                        combined[planType].dailyTips.push(...plans[planType].dailyTips);
                    }

                    // Collect smart alerts (deduplicate later)
                    if (plans[planType].smartAlerts) {
                        combined[planType].smartAlerts.push(...plans[planType].smartAlerts);
                    }

                    // Use metrics from last chunk (most complete)
                    if (plans[planType].metrics) {
                        combined[planType].metrics = plans[planType].metrics;
                    }
                }
            }
        }

        // Deduplicate smart alerts
        for (const planType of ['costSaver', 'ecoMode', 'comfortBalance']) {
            combined[planType].smartAlerts = [...new Set(combined[planType].smartAlerts)];
        }

        return {
            costSaver: combined.costSaver as any,
            ecoMode: combined.ecoMode as any,
            comfortBalance: combined.comfortBalance as any,
            generatedAt: now.toISOString(),
            validUntil: validUntil.toISOString(),
            analysisDays: inputData.analysisDays,
            weatherSource: inputData.weatherSource,
        };
    }

    /**
     * Build main analysis prompt (deprecated - now using buildChunkPrompt)
     */
    private buildPrompt(data: AIAnalysisInput): string {
        const deviceList = data.devices.map((d, i) =>
            `${i + 1}. ${d.name} (${d.type}): ${d.wattage}W, Priority: ${d.priority}, Usage: ${d.survey.hoursPerDay}hrs/day`
        ).join('\n');

        return `Generate three distinct ${data.analysisDays}-day energy optimization plans.

USER CONTEXT:
- Household: ${data.userProfile.householdSize} people, ${data.userProfile.homeType}
- Occupation: ${data.userProfile.occupationType}
- Location: ${data.location.city}, ${data.location.country}
- Current Temperature: ${data.location.temperature}°C
- Average Monthly Cost: ${data.energyCosts.currencySymbol}${data.energyCosts.averageMonthlyCost}
- Preferred Budget: ${data.energyCosts.currencySymbol}${data.energyCosts.preferredBudget}
- Price per kWh: ${data.energyCosts.currencySymbol}${data.energyCosts.pricePerKwh}

DEVICES TO OPTIMIZE (${data.devices.length} total):
${deviceList}

WEATHER FORECAST (${data.analysisDays} days):
First 16 days are accurate forecasts. ${data.analysisDays > 16 ? 'Days 17-30 use seasonal climate averages.' : ''}
${JSON.stringify(data.weatherForecast.slice(0, 5), null, 2)}... (showing first 5 days)

GENERATE 3 PLANS:

## PLAN 1: COST SAVER
**Objective**: Minimize costs within preferred budget
- Split ${data.energyCosts.currencySymbol}${data.energyCosts.preferredBudget || 0} across ${data.analysisDays} days = ${((data.energyCosts.preferredBudget || 0) / data.analysisDays).toFixed(2)} per day
- Schedule devices to NOT exceed daily budget
- Avoid AC on cool days, reduce lighting on bright days
- If employed, minimize daytime usage (9am-5pm)

**Required Metrics**:
{
  "initialBudget": ${data.energyCosts.preferredBudget || 0},
  "optimizedBudget": <calculated total>,
  "monthlySaving": <initialBudget - optimizedBudget>
}

## PLAN 2: ECO MODE
**Objective**: Minimize environmental impact
- Drastically reduce high-pollution devices (ACs, heaters: 50-70% reduction)
- IGNORE user priority - eco takes precedence
- No AC when temp < 25°C, no heater when temp > 20°C
- Monthly cost MUST NOT exceed ${data.energyCosts.currencySymbol}${data.energyCosts.averageMonthlyCost}

**Eco Score** (0-100, start at 100):
- Deduct points based on usage × pollution level
- AC: -5/hr, Heater: -4/hr, Refrigerator: -2/hr, etc.

**Required Metrics**:
{
  "initialEcoScore": <baseline score>,
  "optimizedEcoScore": <after optimization>,
  "ecoImprovementPercentage": <percentage improvement>,
  "monthlyCostCap": ${data.energyCosts.averageMonthlyCost}
}

## PLAN 3: COMFORT BALANCE
**Objective**: Balance cost + environment + comfort
- 20-30% budget reduction from preferred
- 30-40% eco improvement
- Respect high priority devices (priority >= 3)
- Maintain comfort during peak hours

**Required Metrics**:
{
  "optimizedBudget": <calculated>,
  "budgetReductionPercentage": <% reduction>,
  "ecoFriendlyGainPercentage": <% eco improvement>
}

For EACH plan, provide:
1. Daily schedules for all ${data.analysisDays} days
2. Device usage hours and time windows per day
3. Peak usage periods based on weather
4. 5-8 smart alerts (tips, warnings, info)
5. **Daily tips** for notifications (one per day):
   - morningTip: Brief tip for 8:30 AM notification
   - deviceTips: 1-3 device-specific recommendations
   - weatherTip: Weather-based advice (if relevant)
   - savingOpportunity: Energy-saving action for the day

Example daily tip:
{
  "dayNumber": 1,
  "date": "2025-01-15",
  "morningTip": "Good morning! Today's plan saves $1.20. Check your schedule.",
  "deviceTips": [
    "Your AC will run 3 hrs less today due to cooler weather",
    "LED bulbs: Turn off when leaving for work"
  ],
  "weatherTip": "Mild 24°C today - great day to skip the AC!",
  "savingOpportunity": "Shift TV usage to evening for better energy rates"
}

Return valid JSON matching this schema:
{
  "costSaver": { 
    "id": "...", 
    "type": "cost", 
    "name": "Cost Saver", 
    "metrics": {...}, 
    "dailySchedules": [...${data.analysisDays} days...], 
    "dailyTips": [...${data.analysisDays} tips...],
    "smartAlerts": [...], 
    "devices": ["dev_1", "dev_2"] 
  },
  "ecoMode": { ... },
  "comfortBalance": { ... },
  "generatedAt": "2025-01-15T10:00:00Z",
  "validUntil": "2025-02-15T10:00:00Z",
  "analysisDays": ${data.analysisDays},
  "weatherSource": "${FEATURES.usePremiumWeatherAPI ? 'openweathermap' : data.analysisDays > 16 ? 'hybrid' : 'open-meteo'}"
}`;
    }

    /**
     * Parse and validate AI response
     */
    private parseAIResponse(aiResponse: any, inputData: AIAnalysisInput): AIPlansResponse {
        // Basic validation
        if (!aiResponse.costSaver || !aiResponse.ecoMode || !aiResponse.comfortBalance) {
            throw new Error('AI response missing required plans');
        }

        // Add metadata
        const response: AIPlansResponse = {
            ...aiResponse,
            generatedAt: new Date().toISOString(),
            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            analysisDays: inputData.analysisDays,
            weatherSource: FEATURES.usePremiumWeatherAPI
                ? 'openweathermap'
                : inputData.analysisDays > 16
                    ? 'hybrid'
                    : 'open-meteo',
        };

        return response;
    }
}

export default new AIPlanService();
