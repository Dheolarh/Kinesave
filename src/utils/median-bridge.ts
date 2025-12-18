/**
 * Median.co JavaScript Bridge utilities
 * Provides helpers for median.co native app features
 */

export const median = {
    /**
     * Check if running in median.co native app
     */
    isApp(): boolean {
        return typeof (window as any).median !== 'undefined';
    },

    /**
     * Request location permission (Android)
     * For Android, must be called before using geolocation
     */
    requestLocationPermission(): Promise<boolean> {
        return new Promise((resolve) => {
            if (this.isApp() && (window as any).median?.permissions) {
                (window as any).median.permissions.request(
                    'location',
                    (granted: boolean) => {
                        resolve(granted);
                    }
                );
            } else {
                // Not in median app or no permissions API, assume granted
                resolve(true);
            }
        });
    },

    /**
     * Check if location services are ready (iOS)
     * This prevents double prompting on iOS
     */
    isGeolocationReady(): boolean {
        if (this.isApp() && (window as any).median_geolocation_ready) {
            return (window as any).median_geolocation_ready();
        }
        return true; // Assume ready if not in median app
    },

    /**
     * Register user for push notifications via OneSignal
     */
    registerForPush(userId: string, tags?: Record<string, any>): void {
        if (this.isApp() && (window as any).median?.onesignal) {
            (window as any).median.onesignal.register({
                userId,
                tags: tags || {},
            });
        }
    },

    /**
     * Send local push notification (OneSignal)
     */
    sendNotification(title: string, message: string, data?: Record<string, any>): void {
        if (this.isApp() && (window as any).median?.onesignal) {
            (window as any).median.onesignal.send({
                title,
                message,
                data: data || {},
            });
        }
    },

    /**
     * Set user tags for segmentation
     */
    setUserTags(tags: Record<string, any>): void {
        if (this.isApp() && (window as any).median?.onesignal) {
            (window as any).median.onesignal.setTags(tags);
        }
    },

    /**
     * Get device info
     */
    getDeviceInfo(): { platform: string; version: string } | null {
        if (this.isApp() && (window as any).median?.device) {
            return (window as any).median.device.info();
        }
        return null;
    },
};

export default median;
