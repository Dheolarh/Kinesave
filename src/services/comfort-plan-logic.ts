import type { CostPlan, DaySchedule, DeviceHours } from './cost-plan-logic';
import type { EcoPlan } from './eco-plan-logic';

export interface ComfortPlan {
    schedule: DaySchedule[];
    totalMonthlyCost: number;
    totalMonthlyKwh: number;
    dailyBudget: number;
    pricePerKwh: number;
}

function calculateCost(watts: number, hours: number, pricePerKwh: number): number {
    const kwh = (watts / 1000) * hours;
    return kwh * pricePerKwh;
}

function calculateKwh(watts: number, hours: number): number {
    return (watts / 1000) * hours;
}

function getTrimPercentage(priority: number): number {
    switch (priority) {
        case 5: return 0.10;
        case 4: return 0.15;
        case 3: return 0.20;
        case 2: return 0.30;
        case 1: return 0.50;
        default: return 0.20;
    }
}

function trimDevices(
    devices: DeviceHours[],
    dailyBudget: number,
    pricePerKwh: number
): DeviceHours[] {
    const trimmedDevices = devices.map(d => ({ ...d }));
    let totalCost = trimmedDevices.reduce((sum, d) => sum + d.cost, 0);

    let iterations = 0;
    const MAX_ITERATIONS = 100;

    while (totalCost > dailyBudget && iterations < MAX_ITERATIONS) {
        iterations++;

        trimmedDevices.sort((a, b) => b.cost - a.cost);
        const highestCostDevice = trimmedDevices[0];

        if (highestCostDevice.hours <= 0) break;

        const trimPercent = getTrimPercentage(highestCostDevice.priority);
        const newCost = highestCostDevice.cost * (1 - trimPercent);
        const newKwh = newCost / pricePerKwh;
        const newHours = (newKwh * 1000) / highestCostDevice.watts;

        highestCostDevice.hours = Math.max(0, newHours);
        highestCostDevice.kwh = newKwh;
        highestCostDevice.cost = newCost;

        totalCost = trimmedDevices.reduce((sum, d) => sum + d.cost, 0);

        if (totalCost <= dailyBudget) break;
    }

    return trimmedDevices;
}

export function generateComfortPlan(
    costPlan: CostPlan,
    ecoPlan: EcoPlan,
    avgMonthlyCost: number,
    preferredBudget: number,
    pricePerKwh: number
): ComfortPlan {
    // 1. Calculate Comfort Budget: Average of AvgMonthlyCost & PreferredBudget
    const monthlyBudget = (avgMonthlyCost + preferredBudget) / 2;
    const dailyBudget = monthlyBudget / 30;

    const schedule: DaySchedule[] = [];

    // 2. Iterate through 30 days
    for (let i = 0; i < 30; i++) {
        const costDay = costPlan.schedule[i];
        const ecoDay = ecoPlan.schedule[i];

        const dayDevices: DeviceHours[] = [];

        // Map devices from cost plan for easy lookup
        const costDeviceMap = new Map(costDay.devices.map(d => [d.id, d]));
        const ecoDeviceMap = new Map(ecoDay.devices.map(d => [d.id, d]));

        // Union of all device IDs present in either plan for this day
        const allDeviceIds = new Set([...costDeviceMap.keys(), ...ecoDeviceMap.keys()]);

        for (const deviceId of allDeviceIds) {
            const costDevice = costDeviceMap.get(deviceId);
            const ecoDevice = ecoDeviceMap.get(deviceId);

            // Get base device info from whichever exists
            const baseDevice = costDevice || ecoDevice!;

            // Get hours from both plans (0 if not present)
            const costHours = costDevice?.hours || 0;
            const ecoHours = ecoDevice?.hours || 0;

            // 3. Average the hours
            const comfortHours = (costHours + ecoHours) / 2;

            const cost = calculateCost(baseDevice.watts, comfortHours, pricePerKwh);
            const kwh = calculateKwh(baseDevice.watts, comfortHours);

            dayDevices.push({
                id: baseDevice.id,
                name: baseDevice.name,
                watts: baseDevice.watts,
                hours: comfortHours,
                priority: baseDevice.priority,
                cost,
                kwh
            });
        }

        const totalCost = dayDevices.reduce((sum, d) => sum + d.cost, 0);

        // 4. Trim if over daily budget
        let finalDevices = dayDevices;
        if (totalCost > dailyBudget) {
            finalDevices = trimDevices(dayDevices, dailyBudget, pricePerKwh);
        }

        const finalTotalCost = finalDevices.reduce((sum, d) => sum + d.cost, 0);
        const finalTotalKwh = finalDevices.reduce((sum, d) => sum + d.kwh, 0);

        schedule.push({
            dayNumber: costDay.dayNumber,
            date: costDay.date,
            isWeekend: costDay.isWeekend,
            devices: finalDevices,
            totalCost: finalTotalCost,
            totalKwh: finalTotalKwh
        });
    }

    const totalMonthlyCost = schedule.reduce((sum, day) => sum + day.totalCost, 0);
    const totalMonthlyKwh = schedule.reduce((sum, day) => sum + day.totalKwh, 0);

    return {
        schedule,
        totalMonthlyCost,
        totalMonthlyKwh,
        dailyBudget,
        pricePerKwh
    };
}
