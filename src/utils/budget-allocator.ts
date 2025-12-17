
export interface Device {
    id: string;
    wattage: number;
    priority: number; // 1-5, where 5 = critical (freezer), 1 = optional (TV)
    type: string;
    hoursPerDay?: number; // User's normal usage
}

export interface BudgetAllocationResult {
    [deviceId: string]: {
        hours: number;
        cost: number;
    };
}

export interface AllocationParams {
    devices: Device[];
    dailyBudget: number;
    pricePerKwh: number;
    weatherTemp?: number; // Optional: for weather-based adjustments
}

/**
 * Calculate the cost of running a device for given hours
 */
function calculateCost(device: Device, hours: number, pricePerKwh: number): number {
    const kwhUsed = (device.wattage * hours) / 1000;
    return kwhUsed * pricePerKwh;
}

/**
 * Get minimum viable hours for a device based on its type
 */
function getMinimumHours(device: Device): number {
    const type = device.type.toLowerCase();

    // Critical 24/7 appliances need minimum hours
    if (type.includes('freezer') || type.includes('refrigerator')) {
        return 4; // Minimum to stay cold
    }

    return 0; // Other devices can be 0
}

/**
 * Allocate device hours to fit within daily budget
 * 
 * Algorithm:
 * 1. Sort devices by priority (highest first)
 * 2. Allocate minimum hours to critical devices
 * 3. Distribute remaining budget to devices by priority
 * 4. Adjust hours to maximize usage within budget
 */
export function allocateBudget(params: AllocationParams): BudgetAllocationResult {
    const { devices, dailyBudget, pricePerKwh } = params;
    const result: BudgetAllocationResult = {};
    let remainingBudget = dailyBudget;

    // Sort devices by priority (high to low), then by wattage (low to high)
    const sortedDevices = [...devices].sort((a, b) => {
        if (b.priority !== a.priority) {
            return b.priority - a.priority; // Higher priority first
        }
        return a.wattage - b.wattage; // Lower wattage first (more hours per naira)
    });

    // Phase 1: Allocate minimum hours to critical devices
    for (const device of sortedDevices) {
        const minHours = getMinimumHours(device);
        if (minHours > 0) {
            const cost = calculateCost(device, minHours, pricePerKwh);

            if (cost <= remainingBudget) {
                result[device.id] = { hours: minHours, cost };
                remainingBudget -= cost;
            } else {
                // Even minimum hours exceed budget - allocate what we can
                const affordableHours = (remainingBudget * 1000) / (device.wattage * pricePerKwh);
                const actualCost = calculateCost(device, affordableHours, pricePerKwh);
                result[device.id] = {
                    hours: Math.max(0, Math.floor(affordableHours * 10) / 10),
                    cost: actualCost
                };
                remainingBudget -= actualCost;
            }
        }
    }

    // Phase 2: Distribute remaining budget to devices by priority
    for (const device of sortedDevices) {
        if (remainingBudget <= 0) break;

        // Skip if already allocated minimum
        if (result[device.id]) continue;

        // Calculate max affordable hours for this device
        const maxAffordableHours = (remainingBudget * 1000) / (device.wattage * pricePerKwh);

        // Cap at user's typical usage (if available) or reasonable limit
        const typicalHours = device.hoursPerDay || 8;
        const allocatedHours = Math.min(maxAffordableHours, typicalHours);

        if (allocatedHours > 0.1) { // Only allocate if > 0.1 hours (6 minutes)
            const cost = calculateCost(device, allocatedHours, pricePerKwh);
            result[device.id] = {
                hours: Math.floor(allocatedHours * 10) / 10, // Round to 1 decimal
                cost: Math.floor(cost * 100) / 100 // Round to 2 decimals
            };
            remainingBudget -= cost;
        } else {
            // Not enough budget for this device
            result[device.id] = { hours: 0, cost: 0 };
        }
    }

    // Phase 3: Add any devices that weren't allocated (set to 0 hours)
    for (const device of devices) {
        if (!result[device.id]) {
            result[device.id] = { hours: 0, cost: 0 };
        }
    }

    return result;
}

/**
 * Validate that total cost doesn't exceed budget
 */
export function validateBudget(
    allocation: BudgetAllocationResult,
    dailyBudget: number
): { valid: boolean; totalCost: number } {
    const totalCost = Object.values(allocation).reduce((sum, device) => sum + device.cost, 0);
    return {
        valid: totalCost <= dailyBudget,
        totalCost: Math.floor(totalCost * 100) / 100
    };
}

/**
 * Get allocation summary for logging/debugging
 */
export function getAllocationSummary(allocation: BudgetAllocationResult): string {
    const entries = Object.entries(allocation);
    const summary = entries.map(([id, data]) =>
        `${id}: ${data.hours}h (₦${data.cost.toFixed(2)})`
    ).join(', ');

    const total = Object.values(allocation).reduce((sum, d) => sum + d.cost, 0);
    return `${summary} | Total: ₦${total.toFixed(2)}`;
}
