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
            `${i + 1}. ID: "${d.id}" - ${d.name} (${d.type}): ${d.wattage}W, Priority ${d.priority}, User typically uses ${d.survey.hoursPerDay}hrs/day`
        ).join('\n');

        const deviceIds = data.devices.map(d => d.id).join(', ');

        const weatherChunk = data.weatherForecast.slice(startDay - 1, endDay);

        // Format weather data clearly for each day
        const weatherByDay = weatherChunk.map((w, i) =>
            `Day ${startDay + i}: ${w.condition}, ${w.avgTemp}°C`
        ).join('\n');

        return `You are creating energy optimization plans for days ${startDay}-${endDay}.

DEVICES TO SCHEDULE (MUST USE EXACT IDs):
${deviceList}

WEATHER FORECAST (USE THIS DATA):
${weatherByDay}

CRITICAL RULES:
1. Use ONLY these device IDs: ${deviceIds}
2. DO NOT invent fake device IDs or random numbers
3. VARY schedules based on ACTUAL weather conditions per day:
   - Hot days (>25°C): Increase cooling devices, reduce heating
   - Cold days (<15°C): Increase heating, reduce cooling
   - Rainy/cloudy: Can use more indoor devices
   - Sunny: Reduce indoor device usage during peak sun
4. EVERY device the user added MUST be scheduled for reasonable hours each day
5. Schedules MUST differ between days based on weather
6. Minimum usage per device per day: 1 hour (unless weather makes it unnecessary)

USER BUDGET: ${data.energyCosts.currencySymbol}${data.energyCosts.preferredBudget || 0}/month

Generate 3 DIFFERENT optimization plans:

PLAN 1 - COST SAVER:
- Minimize energy costs while meeting basic needs
- Shift usage to off-peak hours where possible  
- Reduce non-essential device hours
- Target: Save 20-30% vs unoptimized

PLAN 2 - ECO MODE:
- Minimize environmental impact
- Drastically reduce high-wattage devices
- Optimize based on weather to avoid waste
- Target: 15-25% eco improvement

PLAN 3 - COMFORT BALANCE:
- Balance cost savings with comfort
- Respect user priorities (high priority = more hours)
- Weather-appropriate comfort levels
- Target: 10-20% budget reduction + 5-15% eco improvement

JSON STRUCTURE (return ONLY valid JSON):
{
  "costSaver": {
    "metrics": {
      "initialBudget": ${data.energyCosts.preferredBudget || 120},
      "optimizedBudget": <calculate based on reduced usage>,
      "monthly Saving": <initialBudget - optimizedBudget>
    },
    "dailySchedules": [
      {
        "dayNumber": ${startDay},
        "date": "2025-12-<day>",
        "day": "Monday",
        "${data.devices[0]?.id || 'device1'}": { "usage": <hours>, "window": "time" },
        "${data.devices[1]?.id || 'device2'}": { "usage": <hours>, "window": "time" }
      }
    ],
    "dailyTips": [{"dayNumber": ${startDay}, "tip": "Brief tip based on weather"}],
    "smartAlerts": []
  },
  "ecoMode": { <same structure> },
  "comfortBalance": { <same structure> }
}

SMART ALERTS MUST BE ACTIONABLE AND WEATHER-BASED:
Generate 3-5 alerts that help users optimize energy:
✓ "Weather will be cold on Dec 15-17, use heating devices only"
✓ "Hot weather expected Dec 20-22, avoid heating appliances"
✓ "Turn off TV when not in use - can save up to 10% monthly"
✓ "Reduce freezer usage during peak hours (2pm-6pm)"
✓ "Rainy days ahead - good time for indoor device maintenance"
✗ DO NOT: Generic alerts like "Save energy" or "Be efficient"

EXAMPLE for a HOT day (30°C, Sunny):
- Cooling devices: MORE hours
- TV/Freezer: NORMAL hours
- Heating: ZERO hours

EXAMPLE for a COLD day (10°C, Rainy):
- Heating devices: MORE hours
- Cooling: ZERO hours
- Indoor devices like TV: INCREASE (people stay inside)

Keep response COMPACT. Return ONLY JSON. NO markdown, NO explanations.`;
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
