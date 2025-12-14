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
     * Generate all three optimization plans for selected devices
     */
    async generatePlans(deviceIds: string[]): Promise<AIPlansResponse> {
        try {
            console.log('Starting AI plan generation for', deviceIds.length, 'devices');

            // Step 1: Prepare analysis input data
            const inputData = await this.prepareAnalysisInput(deviceIds);

            // Step 2: Build AI prompt
            const prompt = this.buildPrompt(inputData);

            // Step 3: Call AWS Bedrock
            console.log('Calling AWS Bedrock...');
            const aiResponse = await bedrockService.getJSONResponse(
                prompt,
                this.getSystemPrompt()
            );

            // Step 4: Parse and validate response
            const parsedPlans = this.parseAIResponse(aiResponse, inputData);

            console.log('AI plan generation complete');
            return parsedPlans;
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
     * Build main analysis prompt
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
