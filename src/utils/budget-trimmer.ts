
export interface DeviceHours {
    id: string;
    hours: number;
    wattage: number;
    priority: number;
    type: string;
    frequency?: 'daily' | 'weekends' | 'rarely' | 'frequently';  // NEW: For frequency tracking
}

export interface TrimmedResult {
    [deviceId: string]: {
        hours: number;
        cost: number;
    };
}

export interface FrequencyConstraints {
    [deviceId: string]: number;  // Minimum required hours per device
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
 * NEW: Respects frequency constraints (minimum required hours)
 */
export function trimToFitBudget(
    deviceHours: DeviceHours[],
    dailyBudget: number,
    pricePerKwh: number,
    frequencyConstraints?: FrequencyConstraints  // NEW: Minimum hours per device
): TrimmedResult {
    // Make copies to avoid mutating original
    let devices = deviceHours.map(d => ({ ...d }));

    // Calculate initial total cost
    let totalCost = devices.reduce((sum, d) => sum + calculateCost(d, pricePerKwh), 0);

    console.log(`Initial total: ₦${totalCost.toFixed(2)}, Budget: ₦${dailyBudget.toFixed(2)}`);

    // If already under budget, return as-is
    if (totalCost <= dailyBudget) {
        console.log('Already under budget, no trimming needed');
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

            // NEW: Check frequency minimum
            const minimumHours = frequencyConstraints?.[device.id] || 0;

            // Skip if already at minimum
            if (device.hours <= minimumHours) {
                continue;
            }

            // Calculate trim amount based on current hours
            // Trim by HOURS to keep under budget (user requirement)
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
                // Minimal usage: Set to minimum
                trimAmount = device.hours - minimumHours;
            }

            // NEW: Never trim below minimum hours
            const oldHours = device.hours;
            const newHours = Math.max(minimumHours, device.hours - trimAmount);

            // If no change possible, skip
            if (newHours === oldHours) continue;

            device.hours = newHours;

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

    // STRICT BUDGET ENFORCEMENT: If still over budget, trim aggressively (ignore minimums)
    if (totalCost > dailyBudget) {
        console.warn(`Still over budget (₦${totalCost.toFixed(2)}). Performing strict enforcement...`);

        let strictIterations = 0;
        const MAX_STRICT_ITERATIONS = 50;

        while (totalCost > dailyBudget && strictIterations < MAX_STRICT_ITERATIONS) {
            strictIterations++;

            // Sort by hours (trim highest first)
            devices.sort((a, b) => b.hours - a.hours);

            let trimmed = false;
            for (const device of devices) {
                if (device.hours <= 0) continue;

                // Aggressive trim: 0.1 hour at a time, ignoring minimums
                const trimAmount = Math.min(0.1, device.hours);
                device.hours = Math.max(0, device.hours - trimAmount);

                totalCost = devices.reduce((sum, d) => sum + calculateCost(d, pricePerKwh), 0);
                trimmed = true;

                if (totalCost <= dailyBudget) {
                    console.log(`Strict enforcement succeeded: ₦${totalCost.toFixed(2)}`);
                    break;
                }
            }

            if (!trimmed) break;
        }
    }

    if (totalCost > dailyBudget) {
        console.warn(`Could not trim to budget. Final: ${totalCost.toFixed(2)}`);
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
