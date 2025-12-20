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


DEVICE CATEGORIZATION (check name AND type fields):

1. COOLING DEVICES:
   - Keywords in name/type: "AC", "air conditioner", "air condition", "fan", "cooler", "cooling"
   - Examples: "Room AC", "Living room fan", "Air cooler"
   
2. HEATING DEVICES (room heating only):
   - Keywords in name/type: "heater", "space heater", "room heater", "heating"
   - Exclude if name contains: "water", "geyser", "boiler" (these are for bathing, not room heating)
   - Examples: "Space heater", "Room heater"
   
3. OTHER DEVICES (never exclude):
   - Everything else: TV, fridge, lights, washing machine, chargers, water heaters, etc.

EXCLUSION RULES (be aggressive):

For COOLING devices:
- EXCLUDE if temperature < 20°C
- EXCLUDE if weather condition contains: "rain", "cold", "storm", "cloudy", "overcast"
- Reasoning: Nobody needs cooling when it's cold or rainy

For HEATING devices (room heating only):
- EXCLUDE if temperature > 25°C
- EXCLUDE if weather condition contains: "hot", "sunny", "warm", "clear"
- Reasoning: Nobody needs room heating when it's already warm

For OTHER devices:
- NEVER exclude (weather doesn't affect their usage)

IMPORTANT:
- Check BOTH device name AND type for keywords
- If device name has "AC" or "cooler" → it's a cooling device
- If device name has "heater" BUT NOT "water" → it's a heating device
- When in doubt about cooling/heating device, err on the side of exclusion

Return JSON with device IDs to exclude per day:
{
  "1": ["device-id-1", "device-id-2"],
  "2": ["device-id-3"],
  ...
}

Only return days with exclusions. If cooling device exists and temp < 20°C, YOU MUST exclude it.`;
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
