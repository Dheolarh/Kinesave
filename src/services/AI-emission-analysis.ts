import bedrockService from './bedrock.service';

export interface DeviceInfo {
    id: string;
    name: string;
    type: string;
    watts: number;
}

export interface EmissionLevels {
    [deviceId: string]: number;
}

function buildEmissionPrompt(devices: DeviceInfo[]): string {
    const devicesList = devices.map(d =>
        `- ID: ${d.id}, Name: ${d.name}, Type: ${d.type}, Watts: ${d.watts}`
    ).join('\n');

    return `Rate these devices by toxic emissions or chemicals directly or indirectly which are released into the atmosphere and cause global warming or greenhouse effects, think carefully about it (1=lowest, 5=highest).

DEVICES:
${devicesList}

RATING GUIDE:
1 = Very Low
2 = Low
3 = Medium
4 = High
5 = Very High

Consider:
- Device type and typical usage
- Wattage (higher = more emissions)
- Relative comparison within this device list

Example:
Air conditioners release CFCs which are greenhouse gases and HFCs which are also greenhouse gases.
Cooking stoves release methane which is a greenhouse gas.

Return JSON mapping device IDs to emission levels (1-5):
{
  "device-id-1": 3,
  "device-id-2": 5,
  "device-id-3": 1,
  ...
}`;
}

export async function analyzeEmissions(devices: DeviceInfo[]): Promise<EmissionLevels> {
    try {
        const prompt = buildEmissionPrompt(devices);
        const emissions = await bedrockService.getJSONResponse(prompt);
        return emissions || getDefaultEmissions(devices);
    } catch (error) {
        console.error('Emission analysis failed:', error);
        return getDefaultEmissions(devices);
    }
}

function getDefaultEmissions(devices: DeviceInfo[]): EmissionLevels {
    const defaults: EmissionLevels = {};

    for (const device of devices) {
        const type = device.type.toLowerCase();

        if (type.includes('ac') || type.includes('air conditioner')) {
            defaults[device.id] = 5;
        } else if (type.includes('heater') || type.includes('dryer') || type.includes('stove')) {
            defaults[device.id] = 4;
        } else if (type.includes('tv') || type.includes('washing') || type.includes('microwave')) {
            defaults[device.id] = 3;
        } else if (type.includes('fan') || type.includes('blender')) {
            defaults[device.id] = 2;
        } else {
            defaults[device.id] = 1;
        }
    }

    return defaults;
}
