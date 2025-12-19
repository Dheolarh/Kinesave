import bedrockService from './bedrock.service';

export interface WeatherDay {
    dayNumber: number;
    temp: number;
    condition: string;
}

export interface DeviceInfo {
    id: string;
    name: string;
    type: string;
}

export interface WeatherExclusions {
    [dayNumber: number]: string[];
}

function buildWeatherPrompt(devices: DeviceInfo[], weather: WeatherDay[]): string {
    const devicesList = devices.map(d => `- ${d.name} (${d.type})`).join('\n');
    const weatherList = weather.map(w => `Day ${w.dayNumber}: ${w.temp}°C, ${w.condition}`).join('\n');

    return `Analyze weather impact on device usage.

DEVICES:
${devicesList}

WEATHER (30 DAYS):
${weatherList}

RULES:
1. AC/Cooling or devices that are used to cool environment: OFF if temp < 15°C OR rainy
2. Heater or devices that are used to heat up environment: OFF if temp > 29°C
3. All other devices: NO exclusions (weather has no strong impact)

Return JSON with device IDs to exclude per day:
{
  "1": ["device-id-1", "device-id-2"],
  "2": ["device-id-3"],
  ...
}

Only exclude devices with STRONG weather impact. If unsure, don't exclude.`;
}

export async function analyzeWeatherExclusions(
    devices: DeviceInfo[],
    weather: WeatherDay[]
): Promise<WeatherExclusions> {
    try {
        const prompt = buildWeatherPrompt(devices, weather);
        const exclusions = await bedrockService.getJSONResponse(prompt);
        return exclusions || {};
    } catch (error) {
        console.error('Weather analysis failed:', error);
        return {};
    }
}
