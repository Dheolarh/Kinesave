/**
 * Data Migration Utility
 * Migrates from old decentralized storage to new centralized userId structure
 */

import { createUser, saveUserData, setCurrentUserId, getUserData, type CentralizedUserData, type UserDevice } from './user-storage';
import { getCurrentUserId as getOldUserId } from './storage';

export function migrateToNewStorage(): boolean {
    console.log('🔄 Starting data migration...');

    // Check if already migrated
    const migrationComplete = localStorage.getItem('storage_migration_v2');
    if (migrationComplete === 'true') {
        console.log('✅ Migration already completed');
        return true;
    }

    try {
        // Get current user ID from old system
        const oldUserId = getOldUserId();
        if (!oldUserId) {
            console.log('⚠️  No existing user found, skipping migration');
            localStorage.setItem('storage_migration_v2', 'true');
            return true;
        }

        // Get old user data
        const oldUsersJson = localStorage.getItem('users');
        if (!oldUsersJson) {
            console.log('⚠️  No old user data found');
            localStorage.setItem('storage_migration_v2', 'true');
            return true;
        }

        const oldUsers = JSON.parse(oldUsersJson);
        const oldProfile = oldUsers[oldUserId];

        if (!oldProfile) {
            console.log('⚠️  User profile not found');
            localStorage.setItem('storage_migration_v2', 'true');
            return true;
        }

        console.log(`📦 Migrating data for user: ${oldProfile.userName}`);

        // Map old devices to new structure (remove brand, modelNumber)
        const migratedDevices: UserDevice[] = (oldProfile.devices || []).map((d: any) => ({
            id: d.id,
            customName: d.customName,
            originalName: d.originalName,
            deviceType: d.deviceType,
            wattage: d.wattage,
            priority: d.priority || 3,
            survey: d.survey || {
                frequency: 'daily',
                hoursPerDay: 8,
                usageTimes: [],
                room: 'Living Room'
            }
        }));

        // Create new centralized data structure
        const newUserData: CentralizedUserData = {
            profile: {
                userName: oldProfile.userName || 'User',
                createdAt: oldProfile.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
            devices: migratedDevices,
            location: oldProfile.location || null,
            energyCosts: oldProfile.energyCosts ? {
                monthlyCost: oldProfile.energyCosts.monthlyCost || 0,
                pricePerKwh: oldProfile.energyCosts.pricePerKwh || 50,
                preferredBudget: oldProfile.energyCosts.preferredBudget || null,
                currency: oldProfile.energyCosts.currency || 'NGN',
                currencySymbol: oldProfile.energyCosts.currencySymbol || '₦',
                // Removed: powerHoursPerDay, availableKwhPerMonth
            } : null,
            aboutUser: oldProfile.aboutUser || null,
            weather: null, // Will be fetched fresh
            plans: null, // Will be generated fresh
            analysisResults: null,
            notifications: []
        };

        // Save to new structure
        setCurrentUserId(oldUserId);
        saveUserData(newUserData, oldUserId);

        console.log('✅ Migration successful!');
        console.log(`   - Migrated ${migratedDevices.length} devices`);
        console.log(`   - Location: ${newUserData.location ? 'Yes' : 'No'}`);
        console.log(`   - Energy costs: ${newUserData.energyCosts ? 'Yes' : 'No'}`);

        // Mark migration as complete
        localStorage.setItem('storage_migration_v2', 'true');

        // Optional: Clean up old data after successful migration
        console.log('🧹 Cleaning up old storage keys...');
        localStorage.removeItem('users');
        localStorage.removeItem('userDevices');
        localStorage.removeItem('aiGeneratedPlans');
        localStorage.removeItem('activePlan');
        localStorage.removeItem('activeEnergyPlan');
        localStorage.removeItem('selectedPlan');

        console.log('✅ Migration complete!');
        return true;

    } catch (error) {
        console.error('❌ Migration failed:', error);
        return false;
    }
}

/**
 * Check if migration is needed
 */
export function needsMigration(): boolean {
    const migrationComplete = localStorage.getItem('storage_migration_v2');
    return migrationComplete !== 'true';
}

/**
 * Force re-migration (useful for testing)
 */
export function resetMigration(): void {
    localStorage.removeItem('storage_migration_v2');
    console.log('Migration flag reset. Run migrateToNewStorage() to re-migrate.');
}
