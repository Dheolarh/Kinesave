/**
 * TypeScript types for AI energy plan generation
 */

// ============================================
// INPUT TYPES (Data sent to AI)
// ============================================

export interface AIAnalysisInput {
    devices: DeviceForAnalysis[];
    userProfile: UserContext;
    energyCosts: EnergyCostContext;
    location: LocationContext;
    weatherForecast: WeatherForecast[];
    analysisDays: number; // 16 or 30 based on subscription
    weatherSource: 'open-meteo' | 'openweathermap' | 'hybrid';
}

export interface DeviceForAnalysis {
    id: string;
    name: string;
    type: string;
    wattage: number;
    priority: number | string;
    survey: {
        frequency: string;
        hoursPerDay: number;
        usageTimes: string[];
        room: string;
    };
}

export interface UserContext {
    householdSize: number;
    occupationType: string;
    homeType: string;
}

export interface EnergyCostContext {
    averageMonthlyCost: number;
    pricePerKwh: number;
    preferredBudget: number | null;
    currency: string;
    currencySymbol: string;
}

export interface LocationContext {
    city: string;
    region: string;
    country: string;
    latitude: number;
    longitude: number;
    temperature: number;
    weatherDescription: string;
}

export interface WeatherForecast {
    date: string;
    tempMin: number;
    tempMax: number;
    avgTemp: number;
    humidity: number;
    weatherCode: number;
    condition: string;
    isEstimated?: boolean; // true for days 17-30 in hybrid mode
    estimateMethod?: 'real' | 'seasonal_average'; // how this forecast was generated
}

// ============================================
// OUTPUT TYPES (AI Response)
// ============================================

export interface AIPlansResponse {
    costSaver: AIPlan;
    ecoMode: AIPlan;
    comfortBalance: AIPlan;
    generatedAt: string;
    validUntil: string;
    analysisDays: number; // 16 or 30
    weatherSource: 'open-meteo' | 'openweathermap' | 'hybrid';
}

export interface AIPlan {
    id: string;
    type: 'cost' | 'eco' | 'balance';
    name: string;
    description: string;
    metrics: PlanMetrics;
    dailySchedules: DailySchedule[];
    dailyTips: DailyTip[]; // AI-generated tips for notifications
    smartAlerts: SmartAlert[];
    devices: string[]; // device IDs included in analysis
}

// ============================================
// PLAN METRICS (Different per plan type)
// ============================================

export interface PlanMetrics {
    // For Cost Saver Plan
    initialBudget?: number;
    optimizedBudget?: number;
    monthlySaving?: number;

    // For Eco Mode Plan
    initialEcoScore?: number; // 0-100
    optimizedEcoScore?: number; // 0-100
    ecoImprovementPercentage?: number;
    monthlyCostCap?: number;

    // For Comfort Balance Plan
    budgetReductionPercentage?: number;
    ecoFriendlyGainPercentage?: number;
}

// ============================================
// DAILY SCHEDULE TYPES
// ============================================

export interface DailySchedule {
    date: string; // ISO date "2025-01-15"
    dayNumber: number; // 1-30
    isEstimatedWeather?: boolean; // true for days 17-30 in hybrid mode
    weather: {
        condition: string;
        temperature: number;
        humidity: number;
        weatherCode: number;
    };
    totalUsageHours: number;
    estimatedCost: number;
    peakUsagePeriod: {
        start: string; // "12pm"
        end: string; // "6pm"
    };
    deviceSchedules: DeviceSchedule[];
}

export interface DeviceSchedule {
    deviceId: string;
    deviceName: string;
    hoursOfUse: number;
    priority: 'high' | 'medium' | 'low';
    usageWindows: UsageWindow[];
    estimatedCost: number;
}

export interface UsageWindow {
    start: string; // "9:00 AM"
    end: string; // "2:00 PM"
    reason?: string; // "Peak heat hours" or "Weather-driven usage"
}

// ============================================
// SMART ALERTS
// ============================================

export interface SmartAlert {
    id: string;
    type: 'info' | 'warning' | 'tip';
    message: string;
    deviceId?: string; // null for general alerts
    condition?: string; // "temperature > 30°C"
    priority?: 'high' | 'medium' | 'low';
}

// ============================================
// DAILY TIPS (AI-Generated for Notifications)
// ============================================

export interface DailyTip {
    dayNumber: number; // 1-30
    date: string; // "2025-01-15"
    morningTip: string; // Main tip for 8:30 AM notification
    deviceTips: string[]; // Device-specific tips
    weatherTip?: string; // Weather-based recommendation
    savingOpportunity?: string; // Energy-saving opportunity
}

// ============================================
// POLLUTION ASSESSMENT
// ============================================

export enum PollutionLevel {
    VERY_HIGH = 'VERY_HIGH',
    HIGH = 'HIGH',
    MEDIUM = 'MEDIUM',
    LOW = 'LOW',
}

export interface DevicePollutionProfile {
    deviceType: string;
    pollutionLevel: PollutionLevel;
    impactFactors: string[];
    ecoScoreDeduction: number; // points per hour
}
