// Location and Weather utility functions with Median.co support

// TypeScript declarations for Median.co global object
declare global {
    interface Window {
        median?: {
            geolocation: {
                getCurrentPosition: (
                    success: (position: GeolocationPosition) => void,
                    error?: (error: GeolocationPositionError) => void,
                    options?: PositionOptions
                ) => void;
            };
        };
    }
}

export interface LocationData {
    city: string;
    region: string;
    country: string;
    lat: number;
    lon: number;
    temperature: number;
    humidity: number;
    weatherDescription?: string;
}

/**
 * Detect if app is running inside Median.co mobile wrapper
 */
export function isMedianApp(): boolean {
    return typeof window !== 'undefined' && typeof window.median !== 'undefined';
}

/**
 * Get current position using Median.co native API (mobile) or browser API (web)
 */
export function getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
        const options: PositionOptions = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
        };

        const success = (position: GeolocationPosition) => {
            resolve(position);
        };

        const error = (err: GeolocationPositionError) => {
            reject(err);
        };

        // Use Median.co native geolocation if available, otherwise fallback to browser
        if (isMedianApp() && window.median?.geolocation) {
            window.median.geolocation.getCurrentPosition(success, error, options);
        } else if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(success, error, options);
        } else {
            reject(new Error('Geolocation is not supported by this browser/device'));
        }
    });
}

/**
 * Reverse geocode coordinates to get city name using Nominatim (OpenStreetMap)
 * Free service, no API key required
 */
export async function reverseGeocode(lat: number, lon: number): Promise<{
    city: string;
    region: string;
    country: string;
}> {
    try {
        // Nominatim reverse geocoding API (OpenStreetMap)
        // Must include User-Agent header as per usage policy
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`,
            {
                headers: {
                    'User-Agent': 'KineSave/1.0 (Energy Optimization App)',
                },
            }
        );

        if (!response.ok) {
            throw new Error('Geocoding failed');
        }

        const data = await response.json();

        if (data && data.address) {
            const addr = data.address;
            return {
                // Check suburb/neighbourhood first for specific areas, then fall back to city
                city: addr.suburb || addr.neighbourhood || addr.city || addr.town || addr.village || addr.hamlet || addr.municipality || 'Unknown',
                region: addr.state || addr.county || addr.region || '',
                country: addr.country || '',
            };
        }

        // Fallback if no results
        return {
            city: 'Unknown Location',
            region: '',
            country: '',
        };
    } catch (error) {
        console.error('Reverse geocoding error:', error);
        throw new Error('Failed to get location name');
    }
}

export interface LocationSearchResult {
    displayName: string;
    city: string;
    region: string;
    country: string;
    lat: number;
    lon: number;
}

/**
 * Search for locations by name (for autocomplete)
 * Returns a list of matching locations
 */
export async function searchLocation(query: string): Promise<LocationSearchResult[]> {
    try {
        if (query.length < 2) {
            return [];
        }

        // Nominatim search API
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`,
            {
                headers: {
                    'User-Agent': 'KineSave/1.0 (Energy Optimization App)',
                },
            }
        );

        if (!response.ok) {
            throw new Error('Location search failed');
        }

        const data = await response.json();

        return data.map((item: any) => ({
            displayName: item.display_name,
            city: item.address?.suburb || item.address?.neighbourhood || item.address?.city || item.address?.town || item.address?.village || item.name || 'Unknown',
            region: item.address?.state || item.address?.county || '',
            country: item.address?.country || '',
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
        }));
    } catch (error) {
        console.error('Location search error:', error);
        return [];
    }
}

/**
 * Fetch current weather data using Open-Meteo Weather API
 */
export async function getWeatherData(lat: number, lon: number): Promise<{
    temperature: number;
    humidity: number;
    weatherDescription: string;
}> {
    try {
        // Open-Meteo Weather API - current weather
        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code&temperature_unit=celsius&timezone=auto`
        );

        if (!response.ok) {
            throw new Error('Weather data fetch failed');
        }

        const data = await response.json();

        if (data.current) {
            const current = data.current;

            // Convert WMO weather code to description
            const weatherDescription = getWeatherDescription(current.weather_code);

            return {
                temperature: Math.round(current.temperature_2m),
                humidity: Math.round(current.relative_humidity_2m),
                weatherDescription,
            };
        }

        throw new Error('No weather data available');
    } catch (error) {
        console.error('Weather data fetch error:', error);
        throw new Error('Failed to get weather data');
    }
}

/**
 * Convert WMO weather code to human-readable description
 * https://open-meteo.com/en/docs
 */
function getWeatherDescription(code: number): string {
    const weatherCodes: { [key: number]: string } = {
        0: 'Clear sky',
        1: 'Mainly clear',
        2: 'Partly cloudy',
        3: 'Overcast',
        45: 'Foggy',
        48: 'Foggy',
        51: 'Light drizzle',
        53: 'Drizzle',
        55: 'Heavy drizzle',
        61: 'Light rain',
        63: 'Rain',
        65: 'Heavy rain',
        71: 'Light snow',
        73: 'Snow',
        75: 'Heavy snow',
        77: 'Snow grains',
        80: 'Light showers',
        81: 'Showers',
        82: 'Heavy showers',
        85: 'Light snow showers',
        86: 'Snow showers',
        95: 'Thunderstorm',
        96: 'Thunderstorm with hail',
        99: 'Thunderstorm with hail',
    };

    return weatherCodes[code] || 'Unknown';
}

/**
 * Save location data to localStorage
 */
export function saveLocationToStorage(locationData: LocationData): void {
    try {
        localStorage.setItem('userLocation', JSON.stringify(locationData));
    } catch (error) {
        console.error('Failed to save location to storage:', error);
    }
}

/**
 * Retrieve location data from localStorage
 */
export function getLocationFromStorage(): LocationData | null {
    try {
        const data = localStorage.getItem('userLocation');
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Failed to retrieve location from storage:', error);
        return null;
    }
}

/**
 * Full location detection flow
 */
export async function detectLocation(): Promise<LocationData> {
    // Step 1: Get coordinates
    const position = await getCurrentPosition();
    const { latitude, longitude } = position.coords;

    // Step 2: Reverse geocode to get city name
    const locationInfo = await reverseGeocode(latitude, longitude);

    // Step 3: Fetch weather data
    const weatherData = await getWeatherData(latitude, longitude);

    // Step 4: Combine all data
    const fullLocationData: LocationData = {
        ...locationInfo,
        lat: latitude,
        lon: longitude,
        ...weatherData,
    };

    // Step 5: Save to storage
    saveLocationToStorage(fullLocationData);

    return fullLocationData;
}
