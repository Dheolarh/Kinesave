/**
 * Frequency Enforcement Utility
 * 
 * Enforces device usage frequency rules (daily, weekends, rarely, frequently)
 * after AI suggests device hours but before budget trimming.
 */

export interface FrequencyRule {
    deviceId: string;
    frequency: 'daily' | 'weekends' | 'rarely' | 'frequently';
    priority: number;  // 1-5
    userSetHours: number;  // Original hours user set
    wattage: number;
    type: string;
}

export interface DaySchedule {
    dayNumber: number;  // 1-30
    isWeekend: boolean;
    deviceHours: { [deviceId: string]: number };  // AI-suggested or enforced hours
}

/**
 * Enforce frequency rules for 30-day schedule
 * 
 * Rules:
 * - Daily: Must appear all 30 days with minimum hours
 * - Weekends: OFF Mon-Fri, ON Sat-Sun with priority-based hours
 * - Rarely: Max 3 random days per week, OFF other days
 * - Frequently: Max 3 days per week (user clarification)
 */
export function enforceFrequencyRules(
    aiSchedule: { [day: string]: { [deviceId: string]: number } },
    devices: FrequencyRule[],
    isEcoMode: boolean = false
): DaySchedule[] {
    let schedules: DaySchedule[] = [];

    // Helper: Check if day is weekend
    const isWeekendDay = (dayNum: number): boolean => {
        // Assuming day 1 is a Monday for simplicity
        // Day 6 and 7 in each week are Sat/Sun
        const dayOfWeek = ((dayNum - 1) % 7) + 1;
        return dayOfWeek === 6 || dayOfWeek === 7;  // Saturday or Sunday
    };

    // Process each day (1-30)
    for (let dayNum = 1; dayNum <= 30; dayNum++) {
        const dayKey = `day${dayNum}`;
        const aiDayHours = aiSchedule[dayKey] || {};
        const isWeekend = isWeekendDay(dayNum);

        const deviceHours: { [deviceId: string]: number } = {};

        // Process each device
        devices.forEach(device => {
            const aiSuggestedHours = aiDayHours[device.deviceId] || 0;
            let enforcedHours = aiSuggestedHours;

            switch (device.frequency) {
                case 'daily':
                    // DAILY devices: Must appear every day
                    enforcedHours = enforceDailyDevice(device, aiSuggestedHours, isEcoMode);
                    break;

                case 'weekends':
                    // WEEKENDS devices: OFF weekdays, ON weekends
                    enforcedHours = enforceWeekendsDevice(device, isWeekend, isEcoMode);
                    break;

                case 'rarely':
                    // RARELY devices: Max 3 random days per week
                    enforcedHours = enforceRarelyDevice(device, dayNum, aiSuggestedHours);
                    break;

                case 'frequently':
                    // FREQUENTLY devices: Max 3 days per week
                    enforcedHours = enforceFrequentlyDevice(device, dayNum, aiSuggestedHours);
                    break;

                default:
                    // Unknown frequency: use AI suggestion
                    enforcedHours = aiSuggestedHours;
            }

            deviceHours[device.deviceId] = Math.max(0, enforcedHours);  // Never negative
        });

        schedules.push({
            dayNumber: dayNum,
            isWeekend,
            deviceHours
        });
    }

    // Post-process rarely and frequently devices to ensure week-level constraints
    schedules = enforceWeeklyConstraints(schedules, devices);

    return schedules;
}

/**
 * Enforce DAILY device rules
 * - Must appear every day (1-30)
 * - In Cost Mode: Minimum hours based on priority
 * - In Eco Mode: High emission = low hours regardless of priority
 */
function enforceDailyDevice(
    device: FrequencyRule,
    aiSuggestedHours: number,
    isEcoMode: boolean
): number {
    // In Eco Mode, check emission rate
    if (isEcoMode) {
        const emissionLevel = getDeviceEmissionLevel(device.type);

        if (emissionLevel === 'VERY_HIGH' || emissionLevel === 'HIGH') {
            // High emission daily device: Still daily, but LOW hours
            const maxHours = device.userSetHours * 0.3;  // Max 30% of user-set hours
            return Math.min(aiSuggestedHours, maxHours);
        }
    }

    // Cost Mode OR Eco Mode with low emission
    // Minimum hours = userSetHours × (priority / 5) × 0.6
    // Ensure priority is at least 1 to avoid 0 hours
    const minHours = device.userSetHours * (Math.max(1, device.priority) / 5) * 0.6;

    return Math.max(aiSuggestedHours, minHours);
}

/**
 * Enforce WEEKENDS device rules
 * - OFF during weekdays (Mon-Fri)
 * - ON during weekends (Sat-Sun)
 * - In Cost Mode: Hours based on priority
 * - In Eco Mode: Emission overrides priority (high emission = low hours)
 */
function enforceWeekendsDevice(
    device: FrequencyRule,
    isWeekend: boolean,
    isEcoMode: boolean
): number {
    if (!isWeekend) {
        // Weekday: OFF
        return 0;
    }

    // Weekend: ON with calculated hours
    if (isEcoMode) {
        const emissionLevel = getDeviceEmissionLevel(device.type);

        if (emissionLevel === 'VERY_HIGH' || emissionLevel === 'HIGH') {
            // High emission: Low hours on weekends
            return device.userSetHours * 0.3;  // 30% of user-set hours
        } else {
            // Low emission: Higher hours
            return device.userSetHours * 0.8;  // 80% of user-set hours
        }
    }

    // Cost Mode: Priority-based hours
    // Hours = userSetHours × (priority / 5)
    // Ensure priority is at least 1 to avoid 0 hours
    return device.userSetHours * (Math.max(1, device.priority) / 5);
}

/**
 * Enforce RARELY device rules
 * - Max 3 random days per week
 * - Will be filtered in enforceWeeklyConstraints()
 */
function enforceRarelyDevice(
    _device: FrequencyRule,
    _dayNum: number,
    aiSuggestedHours: number
): number {
    // Return AI suggestion for now
    // Weekly constraint enforcement will filter to 3 days/week
    return aiSuggestedHours;
}

/**
 * Enforce FREQUENTLY device rules
 * - Max 3 days per week
 * - Will be enforced in enforceWeeklyConstraints()
 */
function enforceFrequentlyDevice(
    _device: FrequencyRule,
    _dayNum: number,
    aiSuggestedHours: number
): number {
    // Return AI suggestion for now
    // Weekly constraint enforcement will limit to max 3 days/week
    return aiSuggestedHours;
}

/**
 * Post-process schedules to enforce weekly constraints for rarely/frequently devices
 */
function enforceWeeklyConstraints(
    schedules: DaySchedule[],
    devices: FrequencyRule[]
): DaySchedule[] {
    // Group schedules by week (7 days each)
    const weeks: DaySchedule[][] = [];
    for (let i = 0; i < schedules.length; i += 7) {
        weeks.push(schedules.slice(i, i + 7));
    }

    devices.forEach(device => {
        if (device.frequency === 'rarely' || device.frequency === 'frequently') {
            weeks.forEach(week => {
                processWeeklyDevice(week, device);
            });
        }
    });

    return schedules;
}

/**
 * Process rarely/frequently devices for a single week
 */
function processWeeklyDevice(week: DaySchedule[], device: FrequencyRule) {
    const deviceId = device.deviceId;

    // Count days with non-zero hours
    const activeDays = week.map((day, idx) => ({
        dayIndex: idx,
        hours: day.deviceHours[deviceId] || 0,
        day: day
    })).filter(d => d.hours > 0);

    if (device.frequency === 'rarely') {
        // RARELY: Max 3 days per week
        if (activeDays.length > 3) {
            // Randomly select 3 days to keep active
            const shuffled = [...activeDays].sort(() => Math.random() - 0.5);
            const toDeactivate = shuffled.slice(3);

            toDeactivate.forEach(d => {
                d.day.deviceHours[deviceId] = 0;
            });
        }
    } else if (device.frequency === 'frequently') {
        // FREQUENTLY: Max 3 days per week (user clarification)
        if (activeDays.length > 3) {
            // Randomly select 3 days to keep active, deactivate the rest
            const shuffled = [...activeDays].sort(() => Math.random() - 0.5);
            const toDeactivate = shuffled.slice(3);

            toDeactivate.forEach(d => {
                d.day.deviceHours[deviceId] = 0;
            });
        }
    }
}

/**
 * Get device emission level based on device type
 * Used in Eco Mode to override priority
 */
export function getDeviceEmissionLevel(deviceType: string): 'VERY_HIGH' | 'HIGH' | 'MEDIUM' | 'LOW' {
    const type = deviceType.toLowerCase();

    // VERY_HIGH emission (gas-powered, old appliances)
    if (type.includes('gas') || (type.includes('heater') && type.includes('water'))) {
        return 'VERY_HIGH';
    }

    // HIGH emission (AC, electric heaters, dryers)
    if (
        type.includes('air conditioner') ||
        type.includes('heater') ||
        type.includes('dryer') ||
        type.includes('oven') ||
        type.includes('stove')
    ) {
        return 'HIGH';
    }

    // MEDIUM emission (TVs, microwaves, washing machines)
    if (
        type.includes('tv') ||
        type.includes('television') ||
        type.includes('microwave') ||
        type.includes('washing machine') ||
        type.includes('dishwasher')
    ) {
        return 'MEDIUM';
    }

    // LOW emission (fans, LED lights, laptops, energy-efficient devices)
    return 'LOW';
}
