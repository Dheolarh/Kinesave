/**
 * Feature flags configuration for KineSave
 * Control analysis periods and weather API usage based on subscription tier
 */

export interface FeatureConfig {
    /**
     * Main feature flag: Enable 30-day analysis
     * - true: AI generates 30-day plans
     * - false: AI generates only 16-day plans (remaining 14 days locked)
     * 
     * DEFAULT: false (free tier uses 16-day analysis)
     */
    use30DayAnalysis: boolean;

    /**
     * Nested feature flag: Use premium weather API for full 30 days
     * Only applies when use30DayAnalysis = true
     * 
     * - true: Use OpenWeatherMap Climatic Forecast (paid, accurate 30 days)
     * - false: Use hybrid approach (Open-Meteo 16 days + seasonal averages for days 17-30)
     * 
     * DEFAULT: false (use free hybrid approach)
     */
    usePremiumWeatherAPI: boolean;

    /**
     * OpenWeatherMap API key (required if usePremiumWeatherAPI = true)
     */
    openWeatherMapApiKey?: string;

    /**
     * NEW: Use 3-stage AI prompt architecture
     * - true: Use new device allocation → cost analysis → tips flow
     * - false: Use legacy chunked generation approach
     * 
     * DEFAULT: true (new architecture is production-ready)
     */
    useNewAILogic: boolean;
}

/**
 * Current feature configuration
 * 
 * SUBSCRIPTION TIERS (for future implementation):
 * - Free: { use30DayAnalysis: false, usePremiumWeatherAPI: false } → 16-day analysis
 * - Standard: { use30DayAnalysis: true, usePremiumWeatherAPI: false } → 30-day with hybrid weather
 * - Premium: { use30DayAnalysis: true, usePremiumWeatherAPI: true } → 30-day with accurate weather
 */
export const FEATURES: FeatureConfig = {
    // Main toggle: Set to true to enable 30-day analysis
    use30DayAnalysis: true, // MVP: Standard tier (hybrid forecast)

    // Premium weather API: Set to true to use OpenWeatherMap 30-day forecast
    usePremiumWeatherAPI: false, // MVP: Use free hybrid approach

    // OpenWeatherMap API key (add when enabling premium)
    openWeatherMapApiKey: import.meta.env.VITE_OPENWEATHER_API_KEY || undefined,

    // NEW: 3-stage AI prompt architecture
    useNewAILogic: true, // Set to false to use legacy chunked approach
};

/**
 * Helper function to get analysis period based on current config
 */
export function getAnalysisPeriod(): { days: number; description: string } {
    if (!FEATURES.use30DayAnalysis) {
        return {
            days: 16,
            description: 'Free Tier: 16-day analysis with Open-Meteo forecast',
        };
    }

    if (FEATURES.usePremiumWeatherAPI) {
        return {
            days: 30,
            description: 'Premium Tier: 30-day analysis with OpenWeatherMap accurate forecast',
        };
    }

    return {
        days: 30,
        description: 'Standard Tier: 30-day analysis with hybrid forecast (16 days real + 14 days seasonal)',
    };
}

/**
 * Check if premium weather API is configured correctly
 */
export function isPremiumWeatherConfigured(): boolean {
    return FEATURES.usePremiumWeatherAPI && !!FEATURES.openWeatherMapApiKey;
}

/**
 * Get user-facing tier name
 */
export function getCurrentTier(): 'free' | 'standard' | 'premium' {
    if (!FEATURES.use30DayAnalysis) return 'free';
    if (FEATURES.usePremiumWeatherAPI) return 'premium';
    return 'standard';
}
