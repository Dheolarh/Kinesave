import {
    Wind, Flame, Fan, Droplets, Container, Snowflake, Box,
    CircleDot, Tv, Monitor, Laptop, Smartphone, Gamepad2,
    Lightbulb, Scissors, Wrench, Zap, Coffee, Microwave,
    type LucideIcon
} from 'lucide-react';

export interface DeviceType {
    value: string;
    label: string;
    icon: LucideIcon;
    category: string;
}

export const DEVICE_CATEGORIES = [
    'Temperature',
    'Kitchen',
    'Laundry',
    'Electronics',
    'Lighting',
    'Utilities',
    'Outdoor',
    'Cleaning',
    'Health',
    'Other'
] as const;

export const DEVICE_TYPES: DeviceType[] = [
    // Temperature
    { value: 'air_conditioner', label: 'Air Conditioner', icon: Wind, category: 'Temperature' },
    { value: 'heater', label: 'Heater', icon: Flame, category: 'Temperature' },
    { value: 'fan', label: 'Fan', icon: Fan, category: 'Temperature' },
    { value: 'ceiling_fan', label: 'Ceiling Fan', icon: Fan, category: 'Temperature' },
    { value: 'dehumidifier', label: 'Dehumidifier', icon: Droplets, category: 'Temperature' },

    // Kitchen Appliances
    { value: 'refrigerator', label: 'Refrigerator', icon: Container, category: 'Kitchen' },
    { value: 'freezer', label: 'Freezer', icon: Snowflake, category: 'Kitchen' },
    { value: 'microwave', label: 'Microwave', icon: Microwave, category: 'Kitchen' },
    { value: 'oven', label: 'Oven', icon: Flame, category: 'Kitchen' },
    { value: 'electric_stove', label: 'Electric Stove', icon: Flame, category: 'Kitchen' },
    { value: 'dishwasher', label: 'Dishwasher', icon: CircleDot, category: 'Kitchen' },
    { value: 'blender', label: 'Blender', icon: CircleDot, category: 'Kitchen' },
    { value: 'toaster', label: 'Toaster', icon: Box, category: 'Kitchen' },
    { value: 'coffee_maker', label: 'Coffee Maker', icon: Coffee, category: 'Kitchen' },
    { value: 'electric_kettle', label: 'Electric Kettle', icon: Coffee, category: 'Kitchen' },

    // Laundry
    { value: 'washing_machine', label: 'Washing Machine', icon: CircleDot, category: 'Laundry' },
    { value: 'dryer', label: 'Clothes Dryer', icon: Wind, category: 'Laundry' },
    { value: 'iron', label: 'Electric Iron', icon: Flame, category: 'Laundry' },

    // Electronics  
    { value: 'television', label: 'Television', icon: Tv, category: 'Electronics' },
    { value: 'computer', label: 'Desktop Computer', icon: Monitor, category: 'Electronics' },
    { value: 'laptop', label: 'Laptop', icon: Laptop, category: 'Electronics' },
    { value: 'phone_charger', label: 'Phone Charger', icon: Smartphone, category: 'Electronics' },
    { value: 'gaming_console', label: 'Gaming Console', icon: Gamepad2, category: 'Electronics' },
    { value: 'router', label: 'WiFi Router', icon: Zap, category: 'Electronics' },
    { value: 'sound_system', label: 'Sound System', icon: Zap, category: 'Electronics' },

    // Lighting
    { value: 'led_bulb', label: 'LED Bulb', icon: Lightbulb, category: 'Lighting' },
    { value: 'fluorescent_light', label: 'Fluorescent Light', icon: Lightbulb, category: 'Lighting' },
    { value: 'incandescent_bulb', label: 'Incandescent Bulb', icon: Lightbulb, category: 'Lighting' },

    // Water & Utilities
    { value: 'water_pump', label: 'Water Pump', icon: Droplets, category: 'Utilities' },
    { value: 'water_heater', label: 'Water Heater', icon: Flame, category: 'Utilities' },
    { value: 'generator', label: 'Generator', icon: Zap, category: 'Utilities' },

    // Outdoor
    { value: 'lawn_mower', label: 'Lawn Mower (Electric)', icon: Scissors, category: 'Outdoor' },
    { value: 'power_tools', label: 'Power Tools', icon: Wrench, category: 'Outdoor' },

    // Cleaning
    { value: 'vacuum_cleaner', label: 'Vacuum Cleaner', icon: Wind, category: 'Cleaning' },

    // Health
    { value: 'air_purifier', label: 'Air Purifier', icon: Wind, category: 'Health' },

    // Other
    { value: 'other', label: 'Other', icon: Zap, category: 'Other' },
];

// Helper function to get device type by value
export const getDeviceType = (value: string): DeviceType | undefined => {
    return DEVICE_TYPES.find(dt => dt.value === value);
};

// Helper function to get all devices in a category
export const getDevicesByCategory = (category: string): DeviceType[] => {
    return DEVICE_TYPES.filter(dt => dt.category === category);
};

// Helper function to get icon for device type value
export const getDeviceIcon = (value: string): LucideIcon => {
    const deviceType = getDeviceType(value);
    return deviceType?.icon || Zap;
};
