/**
 * Generate a clean, unique device ID from user's custom device name
 * @param customName - The custom name entered by the user (e.g., "Living Room AC")
 * @param existingIds - Array of existing device IDs to check for uniqueness
 * @returns A clean, unique device ID (e.g., "living_room_ac" or "living_room_ac_2")
 */
export function generateDeviceId(customName: string, existingIds: string[] = []): string {
    // Sanitize: lowercase, replace spaces/special chars with underscore
    const baseName = customName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '_')  // Replace non-alphanumeric with underscore
        .replace(/^_+|_+$/g, '')      // Remove leading/trailing underscores
        .replace(/_+/g, '_');          // Replace multiple underscores with single

    // If empty after sanitization, use a default
    if (!baseName) {
        return `device_${Date.now()}`;
    }

    // Check if ID already exists
    if (!existingIds.includes(baseName)) {
        return baseName;
    }

    // ID exists, append a counter
    let counter = 2;
    let uniqueId = `${baseName}_${counter}`;

    while (existingIds.includes(uniqueId)) {
        counter++;
        uniqueId = `${baseName}_${counter}`;
    }

    return uniqueId;
}

/**
 * Example usage:
 * generateDeviceId("Living Room AC", []) // → "living_room_ac"
 * generateDeviceId("Living Room AC", ["living_room_ac"]) // → "living_room_ac_2"
 * generateDeviceId("Kitchen Freezer!", []) // → "kitchen_freezer"
 * generateDeviceId("My TV (55\")", []) // → "my_tv_55"
 */
