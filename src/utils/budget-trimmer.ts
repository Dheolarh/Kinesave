
export interface DeviceHours {
    id: string;
    hours: number;
    wattage: number;
    priority: number;
    type: string;
}

export interface TrimmedResult {
    [deviceId: string]: {
        hours: number;
        cost: number;
    };
}

/**
 * Calculate cost for device hours
 */
function calculateCost(device: DeviceHours, pricePerKwh: number): number {
    const kwhUsed = (device.wattage * device.hours) / 1000;
    return kwhUsed * pricePerKwh;
}

/**
 * Trim device hours to fit within daily budget
 */
export function trimToFitBudget(
    deviceHours: DeviceHours[],
    dailyBudget: number,
    pricePerKwh: number
): TrimmedResult {
    // Make copies to avoid mutating original
    let devices = deviceHours.map(d => ({ ...d }));

    // Calculate initial total cost
    let totalCost = devices.reduce((sum, d) => sum + calculateCost(d, pricePerKwh), 0);

    console.log(`Initial total: ₦${totalCost.toFixed(2)}, Budget: ₦${dailyBudget.toFixed(2)}`);

    // If already under budget, return as-is
    if (totalCost <= dailyBudget) {
        console.log('✅ Already under budget, no trimming needed');
        return buildResult(devices, pricePerKwh);
    }

    // Start trimming sequence
    let iterations = 0;
    const MAX_ITERATIONS = 100; // Prevent infinite loops

    while (totalCost > dailyBudget && iterations < MAX_ITERATIONS) {
        iterations++;

        // Sort devices by usage hours (high to low)
        devices.sort((a, b) => b.hours - a.hours);

        // Trim devices proportionally
        let trimmed = false;

        for (let i = 0; i < devices.length; i++) {
            const device = devices[i];

            if (device.hours <= 0) continue;

            // Calculate trim amount based on current hours
            // High-usage devices: Remove bigger chunks
            // Low-usage devices: Remove smaller chunks
            let trimAmount: number;

            if (device.hours > 8) {
                // High usage: Remove 0.5-1.0 hours
                trimAmount = 0.5;
            } else if (device.hours > 4) {
                // Medium usage: Remove 0.3 hours
                trimAmount = 0.3;
            } else if (device.hours > 2) {
                // Low usage: Remove 0.2 hours
                trimAmount = 0.2;
            } else if (device.hours > 0.5) {
                // Very low usage: Remove 0.1 hours
                trimAmount = 0.1;
            } else {
                // Minimal usage: Set to 0
                trimAmount = device.hours;
            }

            // Protect high-priority devices more
            if (device.priority >= 5) {
                trimAmount *= 0.5; // Trim half as much
            } else if (device.priority === 1) {
                trimAmount *= 1.5; // Trim more aggressively
            }

            // Apply trim
            const oldHours = device.hours;
            device.hours = Math.max(0, device.hours - trimAmount);

            // Recalculate total
            totalCost = devices.reduce((sum, d) => sum + calculateCost(d, pricePerKwh), 0);

            trimmed = true;

            // If we're now under budget, stop trimming
            if (totalCost <= dailyBudget) {
                console.log(`Trimmed to ₦${totalCost.toFixed(2)} after ${iterations} iterations`);
                break;
            }
        }

        if (!trimmed) {
            // No more trimming possible
            break;
        }
    }

    if (totalCost > dailyBudget) {
        console.warn(`⚠️ Could not trim to budget. Final: ₦${totalCost.toFixed(2)}`);
    }

    return buildResult(devices, pricePerKwh);
}

/**
 * Build result object
 */
function buildResult(devices: DeviceHours[], pricePerKwh: number): TrimmedResult {
    const result: TrimmedResult = {};

    devices.forEach(device => {
        result[device.id] = {
            hours: Math.round(device.hours * 10) / 10, // Round to 1 decimal
            cost: Math.round(calculateCost(device, pricePerKwh) * 100) / 100 // Round to 2 decimals
        };
    });

    return result;
}

/**
 * Validate total cost
 */
export function validateTrimmedBudget(
    trimmed: TrimmedResult,
    dailyBudget: number
): { valid: boolean; totalCost: number; underBy: number } {
    const totalCost = Object.values(trimmed).reduce((sum, d) => sum + d.cost, 0);
    const roundedTotal = Math.round(totalCost * 100) / 100;

    return {
        valid: roundedTotal <= dailyBudget,
        totalCost: roundedTotal,
        underBy: dailyBudget - roundedTotal
    };
}

/**
 * Get trimming summary
 */
export function getTrimmingSummary(trimmed: TrimmedResult): string {
    const entries = Object.entries(trimmed)
        .filter(([_, data]) => data.hours > 0)
        .sort(([_, a], [__, b]) => b.hours - a.hours);

    const summary = entries.map(([id, data]) =>
        `${id}: ${data.hours}h (₦${data.cost.toFixed(2)})`
    ).join(', ');

    const total = Object.values(trimmed).reduce((sum, d) => sum + d.cost, 0);
    return `${summary} | Total: ₦${total.toFixed(2)}`;
}
