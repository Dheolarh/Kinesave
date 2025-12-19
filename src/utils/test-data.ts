/**
 * Test Data Configuration
 * Pre-configured devices and energy costs for quick testing
 */

export const testEnergyCosts = {
    monthlyCost: 6000,
    pricePerKwh: 36,
    preferredBudget: 4000,
};

export const testDevices = [
    {
        id: 'tv-001',
        customName: 'Room TV',
        originalName: 'TV',
        deviceType: 'television',
        wattage: 150,
        priority: 1,
        survey: {
            frequency: 'rarely',
            hoursPerDay: 1,
            usageTimes: ['19:00', '20:00'],
            room: 'Living Room',
        },
    },
    {
        id: 'blender-001',
        customName: 'Kitchen blender',
        originalName: 'Blender',
        deviceType: 'blender',
        wattage: 400,
        priority: 3,
        survey: {
            frequency: 'frequently',
            hoursPerDay: 0.33, // 20 minutes
            usageTimes: ['07:00', '18:00'],
            room: 'Kitchen',
        },
    },
    {
        id: 'freezer-001',
        customName: 'kitchen freezer',
        originalName: 'Freezer',
        deviceType: 'freezer',
        wattage: 200,
        priority: 5,
        survey: {
            frequency: 'daily',
            hoursPerDay: 8,
            usageTimes: ['00:00', '08:00'],
            room: 'Kitchen',
        },
    },
    {
        id: 'laptop-001',
        customName: 'my laptop',
        originalName: 'Laptop',
        deviceType: 'laptop',
        wattage: 80,
        priority: 5,
        survey: {
            frequency: 'daily',
            hoursPerDay: 8,
            usageTimes: ['09:00', '17:00'],
            room: 'Office',
        },
    },
    {
        id: 'washing-machine-001',
        customName: 'washing machine',
        originalName: 'Washing Machine',
        deviceType: 'washing_machine',
        wattage: 900,
        priority: 3,
        survey: {
            frequency: 'weekends',
            hoursPerDay: 2,
            usageTimes: ['10:00', '15:00'],
            room: 'Laundry',
        },
    },
    {
        id: 'bulb-001',
        customName: 'home bulbs',
        originalName: 'LED Bulb',
        deviceType: 'led_bulb',
        wattage: 15,
        priority: 5,
        survey: {
            frequency: 'daily',
            hoursPerDay: 10,
            usageTimes: ['18:00', '23:00'],
            room: 'All Rooms',
        },
    },
    {
        id: 'phone-001',
        customName: 'My phone',
        originalName: 'Phone Charger',
        deviceType: 'phone_charger',
        wattage: 20,
        priority: 5,
        survey: {
            frequency: 'daily',
            hoursPerDay: 5,
            usageTimes: ['22:00', '06:00'],
            room: 'Bedroom',
        },
    },
];
