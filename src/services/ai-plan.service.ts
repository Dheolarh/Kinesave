import bedrockService from './bedrock.service';
import weatherService from './weather.service';
import { getUserData } from '../utils/user-storage';
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
    private readonly ANALYSIS_KEY = 'lastAnalysisDate';

    /**
     * Check if user has already analyzed today (one-time analysis limit)
     */
    private hasAnalyzedToday(): boolean {
        const lastAnalysis = localStorage.getItem(this.ANALYSIS_KEY);
        if (!lastAnalysis) return false;

        const lastDate = new Date(lastAnalysis);
        const today = new Date();

        return (
            lastDate.getDate() === today.getDate() &&
            lastDate.getMonth() === today.getMonth() &&
            lastDate.getFullYear() === today.getFullYear()
        );
    }

    /**
     * Mark that analysis was performed today
     */
    private markAnalysisCompleted(): void {
        localStorage.setItem(this.ANALYSIS_KEY, new Date().toISOString());
    }

    /**
     * Main entry point - Generate AI-powered energy plans
     */
    async generatePlans(deviceIds: string[]): Promise<AIPlansResponse> {
        // Check analysis limit (optional - comment out to disable)
        // if (this.hasAnalyzedToday()) {
        //     throw new Error('You have already generated an analysis today. Please try again tomorrow.');
        // }

        try {
            console.log('🚀 Starting AI plan generation for', deviceIds.length, 'devices');

            // Step 1: Prepare data using PreAnalysisData
            const { PreAnalysisData } = await import('./pre-analysis-data');
            const preData = new PreAnalysisData();
            await preData.fetchAll(deviceIds);

            console.log('✅ Pre-analysis data prepared');

            // Step 2: Generate all 3 plans in parallel
            const { CostSaverPlan } = await import('./plans/cost-saver-plan');
            const { EcoModePlan } = await import('./plans/eco-mode-plan');
            const { ComfortBalancePlan } = await import('./plans/comfort-balance-plan');

            const costSaverGenerator = new CostSaverPlan();
            const ecoModeGenerator = new EcoModePlan();
            const comfortBalanceGenerator = new ComfortBalancePlan();

            console.log('Starting AI plan generation...');

            // Generate plans SEQUENTIALLY to avoid rate limits
            const startTime = Date.now();

            // Helper to add delay between requests
            const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

            console.log('Generating Cost Saver plan...');
            const costSaver = await costSaverGenerator.generate(preData);

            await delay(5000); // 5 second delay (increased for Claude 3)
            console.log('Generating Eco Mode plan...');
            const ecoMode = await ecoModeGenerator.generate(preData);

            // No delay needed for Comfort Balance - it's pure calculation, no AI
            console.log('Generating Comfort Balance plan (calculated)...');
            const comfortBalance = await comfortBalanceGenerator.generate(preData, costSaver, ecoMode);

            const endTime = Date.now();
            console.log(`All plans generated successfully in ${((endTime - startTime) / 1000).toFixed(1)}s`);

            // Step 3: Save to storage
            const { updateUserPlans } = await import('../utils/user-storage');
            const now = new Date();
            const validUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

            updateUserPlans({
                costSaver,
                ecoMode,
                comfortBalance
            });

            console.log('✅ Plans saved to user storage');

            // Mark analysis as completed
            this.markAnalysisCompleted();

            return {
                costSaver,
                ecoMode,
                comfortBalance,
                generatedAt: now.toISOString(),
                validUntil: validUntil.toISOString(),
                analysisDays: 30,
                weatherSource: 'hybrid'
            };

        } catch (error: any) {
            console.error('AI plan generation failed:', error);
            throw new Error(`Failed to generate AI plans: ${error.message}`);
        }
    }

    /**
     * Prepare analysis input data
     * Fetches weather, device data, user context
     */
    async prepareAnalysisInput(deviceIds: string[]): Promise<AIAnalysisInput> {
        const userData = getUserData();
        if (!userData) {
            throw new Error('No user profile found. Please complete setup first.');
        }

        // Fetch weather data
        console.log('📡 Fetching weather forecast...');
        const weatherForecast = await weatherService.getMonthlyForecast(
            userData.location!.latitude,
            userData.location!.longitude,
            30 // Always fetch 30 days
        );

        console.log(`✅ Weather forecast retrieved: ${weatherForecast.length} days`);
        if (weatherForecast.length > 0) {
            console.log('First 5 days:', weatherForecast.slice(0, 5).map((w: any) => `${w.condition} ${w.avgTemp}°C`).join(', '));
            console.log(`Last 5 days (${weatherForecast.length - 4}-${weatherForecast.length}):`,
                weatherForecast.slice(-5).map((w: any) => `${w.condition} ${w.avgTemp}°C`).join(', '));
        }

        // Filter and prepare devices
        const devices: DeviceForAnalysis[] = userData.devices
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

        const preferredBudget = userData.energyCosts?.preferredBudget || userData.energyCosts?.monthlyCost || 0;

        return {
            devices,
            userProfile: {
                householdSize: userData.aboutUser?.householdSize || 1,
                occupationType: userData.aboutUser?.occupationType || 'employed',
                homeType: userData.aboutUser?.homeType || 'apartment',
            },
            energyCosts: {
                averageMonthlyCost: userData.energyCosts?.monthlyCost || 0,
                pricePerKwh: userData.energyCosts?.pricePerKwh || 0,
                preferredBudget,
                currency: userData.energyCosts?.currency || 'USD',
                currencySymbol: userData.energyCosts?.currencySymbol || '$',
            },
            location: {
                city: userData.location!.city,
                region: userData.location!.region,
                country: userData.location!.country,
                latitude: userData.location!.latitude,
                longitude: userData.location!.longitude,
                temperature: userData.location!.temperature,
                weatherDescription: userData.location!.weatherDescription,
            },
            weatherForecast,
            analysisDays: 30,
            weatherSource: FEATURES.usePremiumWeatherAPI ? 'openweathermap' : 'hybrid',
        };
    }
}

export default new AIPlanService();
