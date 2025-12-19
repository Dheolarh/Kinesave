export interface WeatherExclusions {
    [dayNumber: number]: string[];
}

export interface EmissionLevels {
    [deviceId: string]: number;
}

export interface DeviceInput {
    id: string;
    name: string;
    watts: number;
    hoursPerDay: number;
    priority: number;
    frequency: 'daily' | 'weekends' | 'frequently' | 'rarely';
}

export interface DaySchedule {
    dayNumber: number;
    date: string;
    isWeekend: boolean;
    devices: DeviceHours[];
    totalCost: number;
    totalKwh: number;
}

export interface DeviceHours {
    id: string;
    name: string;
    watts: number;
    hours: number;
    priority: number;
    cost: number;
    kwh: number;
    emissionLevel: number;
}

export interface EcoPlan {
    schedule: DaySchedule[];
    totalMonthlyCost: number;
    totalMonthlyKwh: number;
    dailyBudget: number;
    pricePerKwh: number;
    avgEmissionReduction: number;
}

function calculateCost(watts: number, hours: number, pricePerKwh: number): number {
    const kwh = (watts / 1000) * hours;
    return kwh * pricePerKwh;
}

function calculateKwh(watts: number, hours: number): number {
    return (watts / 1000) * hours;
}

function isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6;
}

function shouldDeviceRunOnDay(
    frequency: string,
    isWeekendDay: boolean,
    dayNumber: number
): boolean {
    if (frequency === 'daily') return true;
    if (frequency === 'weekends') return isWeekendDay;
    if (frequency === 'frequently') return dayNumber % 10 < 3;
    if (frequency === 'rarely') return dayNumber % 10 === 1;
    return false;
}

function getEmissionReduction(emissionLevel: number): number {
    switch (emissionLevel) {
        case 5: return 0.30;
        case 4: return 0.20;
        case 3: return 0.15;
        case 2: return 0.10;
        case 1: return 0.05;
        default: return 0;
    }
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

export function generateEcoPlan(
    devices: DeviceInput[],
    avgMonthlyCost: number,
    pricePerKwh: number,
    weatherExclusions: WeatherExclusions = {},
    emissionLevels: EmissionLevels = {}
): EcoPlan {
    const dailyBudget = avgMonthlyCost / 30;
    const schedule: DaySchedule[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let dayNum = 1; dayNum <= 30; dayNum++) {
        const currentDate = new Date(today);
        currentDate.setDate(today.getDate() + dayNum);
        const isWeekendDay = isWeekend(currentDate);

        const dayDevices: DeviceHours[] = [];

        for (const device of devices) {
            if (!shouldDeviceRunOnDay(device.frequency, isWeekendDay, dayNum)) {
                continue;
            }

            const excludedDevices = weatherExclusions[dayNum] || [];
            if (excludedDevices.includes(device.id)) {
                continue;
            }

            const emissionLevel = emissionLevels[device.id] || 1;
            const emissionReduction = getEmissionReduction(emissionLevel);
            const reducedHours = device.hoursPerDay * (1 - emissionReduction);

            const cost = calculateCost(device.watts, reducedHours, pricePerKwh);
            const kwh = calculateKwh(device.watts, reducedHours);

            dayDevices.push({
                id: device.id,
                name: device.name,
                watts: device.watts,
                hours: reducedHours,
                priority: device.priority,
                cost,
                kwh,
                emissionLevel,
            });
        }

        const totalCost = dayDevices.reduce((sum, d) => sum + d.cost, 0);

        let finalDevices = dayDevices;
        if (totalCost > dailyBudget) {
            finalDevices = trimDevices(dayDevices, dailyBudget, pricePerKwh);
        }

        const finalTotalCost = finalDevices.reduce((sum, d) => sum + d.cost, 0);
        const finalTotalKwh = finalDevices.reduce((sum, d) => sum + d.kwh, 0);

        schedule.push({
            dayNumber: dayNum,
            date: currentDate.toISOString(),
            isWeekend: isWeekendDay,
            devices: finalDevices,
            totalCost: finalTotalCost,
            totalKwh: finalTotalKwh,
        });
    }

    const totalMonthlyCost = schedule.reduce((sum, day) => sum + day.totalCost, 0);
    const totalMonthlyKwh = schedule.reduce((sum, day) => sum + day.totalKwh, 0);

    const totalEmissionReductions = schedule.reduce((sum, day) => {
        return sum + day.devices.reduce((deviceSum, d) => {
            return deviceSum + getEmissionReduction(d.emissionLevel);
        }, 0);
    }, 0);
    const avgEmissionReduction = totalEmissionReductions / (schedule.length * devices.length);

    return {
        schedule,
        totalMonthlyCost,
        totalMonthlyKwh,
        dailyBudget,
        pricePerKwh,
        avgEmissionReduction: Math.round(avgEmissionReduction * 100),
    };
}
