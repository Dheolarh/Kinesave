/**
 * Seasonal climate averages for weather estimation
 * Used for days 17-30 when hybrid forecast mode is enabled
 * 
 * Data based on Köppen climate classification zones
 */

interface SeasonalAverage {
    tempMin: number;
    tempMax: number;
    avgTemp: number;
    humidity: number;
    weatherCode: number;
    condition: string;
}

interface MonthlyAverages {
    [month: number]: SeasonalAverage; // 0-11 (Jan-Dec)
}

/**
 * Climate zones based on Köppen classification
 */
export enum ClimateZone {
    TROPICAL = 'tropical', // Af, Am, Aw
    ARID = 'arid', // BWh, BWk, BSh, BSk
    TEMPERATE = 'temperate', // Cfa, Cfb, Csa, Csb
    CONTINENTAL = 'continental', // Dfa, Dfb, Dwa, Dwb
    POLAR = 'polar', // ET, EF
}

/**
 * Seasonal climate data for different zones
 */
const CLIMATE_AVERAGES: Record<ClimateZone, MonthlyAverages> = {
    [ClimateZone.TROPICAL]: {
        0: { tempMin: 22, tempMax: 31, avgTemp: 27, humidity: 75, weatherCode: 2, condition: 'Partly cloudy' }, // Jan
        1: { tempMin: 23, tempMax: 32, avgTemp: 28, humidity: 75, weatherCode: 2, condition: 'Partly cloudy' },
        2: { tempMin: 24, tempMax: 33, avgTemp: 29, humidity: 75, weatherCode: 2, condition: 'Partly cloudy' },
        3: { tempMin: 24, tempMax: 32, avgTemp: 28, humidity: 78, weatherCode: 61, condition: 'Light rain' },
        4: { tempMin: 24, tempMax: 31, avgTemp: 28, humidity: 80, weatherCode: 63, condition: 'Rain' },
        5: { tempMin: 23, tempMax: 30, avgTemp: 27, humidity: 82, weatherCode: 63, condition: 'Rain' },
        6: { tempMin: 22, tempMax: 29, avgTemp: 26, humidity: 82, weatherCode: 63, condition: 'Rain' },
        7: { tempMin: 22, tempMax: 29, avgTemp: 26, humidity: 82, weatherCode: 63, condition: 'Rain' },
        8: { tempMin: 23, tempMax: 30, avgTemp: 27, humidity: 80, weatherCode: 61, condition: 'Light rain' },
        9: { tempMin: 23, tempMax: 31, avgTemp: 27, humidity: 78, weatherCode: 2, condition: 'Partly cloudy' },
        10: { tempMin: 23, tempMax: 31, avgTemp: 27, humidity: 77, weatherCode: 2, condition: 'Partly cloudy' },
        11: { tempMin: 22, tempMax: 31, avgTemp: 27, humidity: 76, weatherCode: 2, condition: 'Partly cloudy' },
    },

    [ClimateZone.ARID]: {
        0: { tempMin: 10, tempMax: 22, avgTemp: 16, humidity: 40, weatherCode: 0, condition: 'Clear sky' },
        1: { tempMin: 12, tempMax: 24, avgTemp: 18, humidity: 38, weatherCode: 0, condition: 'Clear sky' },
        2: { tempMin: 15, tempMax: 28, avgTemp: 22, humidity: 35, weatherCode: 0, condition: 'Clear sky' },
        3: { tempMin: 18, tempMax: 32, avgTemp: 25, humidity: 32, weatherCode: 1, condition: 'Mainly clear' },
        4: { tempMin: 22, tempMax: 37, avgTemp: 30, humidity: 28, weatherCode: 0, condition: 'Clear sky' },
        5: { tempMin: 25, tempMax: 41, avgTemp: 33, humidity: 25, weatherCode: 0, condition: 'Clear sky' },
        6: { tempMin: 27, tempMax: 43, avgTemp: 35, humidity: 23, weatherCode: 0, condition: 'Clear sky' },
        7: { tempMin: 26, tempMax: 42, avgTemp: 34, humidity: 24, weatherCode: 0, condition: 'Clear sky' },
        8: { tempMin: 23, tempMax: 38, avgTemp: 31, humidity: 27, weatherCode: 0, condition: 'Clear sky' },
        9: { tempMin: 19, tempMax: 33, avgTemp: 26, humidity: 30, weatherCode: 1, condition: 'Mainly clear' },
        10: { tempMin: 14, tempMax: 27, avgTemp: 21, humidity: 35, weatherCode: 0, condition: 'Clear sky' },
        11: { tempMin: 11, tempMax: 23, avgTemp: 17, humidity: 38, weatherCode: 0, condition: 'Clear sky' },
    },

    [ClimateZone.TEMPERATE]: {
        0: { tempMin: 2, tempMax: 10, avgTemp: 6, humidity: 75, weatherCode: 3, condition: 'Overcast' },
        1: { tempMin: 2, tempMax: 11, avgTemp: 7, humidity: 72, weatherCode: 2, condition: 'Partly cloudy' },
        2: { tempMin: 5, tempMax: 14, avgTemp: 10, humidity: 68, weatherCode: 2, condition: 'Partly cloudy' },
        3: { tempMin: 8, tempMax: 18, avgTemp: 13, humidity: 65, weatherCode: 61, condition: 'Light rain' },
        4: { tempMin: 12, tempMax: 22, avgTemp: 17, humidity: 63, weatherCode: 2, condition: 'Partly cloudy' },
        5: { tempMin: 16, tempMax: 26, avgTemp: 21, humidity: 60, weatherCode: 1, condition: 'Mainly clear' },
        6: { tempMin: 18, tempMax: 28, avgTemp: 23, humidity: 58, weatherCode: 0, condition: 'Clear sky' },
        7: { tempMin: 18, tempMax: 28, avgTemp: 23, humidity: 58, weatherCode: 0, condition: 'Clear sky' },
        8: { tempMin: 15, tempMax: 24, avgTemp: 20, humidity: 62, weatherCode: 1, condition: 'Mainly clear' },
        9: { tempMin: 11, tempMax: 19, avgTemp: 15, humidity: 68, weatherCode: 2, condition: 'Partly cloudy' },
        10: { tempMin: 6, tempMax: 14, avgTemp: 10, humidity: 73, weatherCode: 3, condition: 'Overcast' },
        11: { tempMin: 3, tempMax: 11, avgTemp: 7, humidity: 76, weatherCode: 3, condition: 'Overcast' },
    },

    [ClimateZone.CONTINENTAL]: {
        0: { tempMin: -10, tempMax: -2, avgTemp: -6, humidity: 70, weatherCode: 71, condition: 'Light snow' },
        1: { tempMin: -8, tempMax: 0, avgTemp: -4, humidity: 68, weatherCode: 71, condition: 'Light snow' },
        2: { tempMin: -3, tempMax: 5, avgTemp: 1, humidity: 65, weatherCode: 2, condition: 'Partly cloudy' },
        3: { tempMin: 3, tempMax: 13, avgTemp: 8, humidity: 60, weatherCode: 61, condition: 'Light rain' },
        4: { tempMin: 10, tempMax: 20, avgTemp: 15, humidity: 58, weatherCode: 2, condition: 'Partly cloudy' },
        5: { tempMin: 15, tempMax: 25, avgTemp: 20, humidity: 60, weatherCode: 1, condition: 'Mainly clear' },
        6: { tempMin: 18, tempMax: 28, avgTemp: 23, humidity: 62, weatherCode: 0, condition: 'Clear sky' },
        7: { tempMin: 17, tempMax: 27, avgTemp: 22, humidity: 63, weatherCode: 1, condition: 'Mainly clear' },
        8: { tempMin: 12, tempMax: 22, avgTemp: 17, humidity: 65, weatherCode: 2, condition: 'Partly cloudy' },
        9: { tempMin: 5, tempMax: 14, avgTemp: 10, humidity: 68, weatherCode: 61, condition: 'Light rain' },
        10: { tempMin: -2, tempMax: 6, avgTemp: 2, humidity: 72, weatherCode: 3, condition: 'Overcast' },
        11: { tempMin: -8, tempMax: 0, avgTemp: -4, humidity: 73, weatherCode: 71, condition: 'Light snow' },
    },

    [ClimateZone.POLAR]: {
        0: { tempMin: -15, tempMax: -8, avgTemp: -12, humidity: 75, weatherCode: 73, condition: 'Snow' },
        1: { tempMin: -16, tempMax: -9, avgTemp: -13, humidity: 74, weatherCode: 73, condition: 'Snow' },
        2: { tempMin: -12, tempMax: -5, avgTemp: -9, humidity: 72, weatherCode: 71, condition: 'Light snow' },
        3: { tempMin: -6, tempMax: 1, avgTemp: -3, humidity: 70, weatherCode: 71, condition: 'Light snow' },
        4: { tempMin: 0, tempMax: 7, avgTemp: 4, humidity: 68, weatherCode: 2, condition: 'Partly cloudy' },
        5: { tempMin: 5, tempMax: 12, avgTemp: 9, humidity: 65, weatherCode: 1, condition: 'Mainly clear' },
        6: { tempMin: 8, tempMax: 15, avgTemp: 12, humidity: 63, weatherCode: 0, condition: 'Clear sky' },
        7: { tempMin: 7, tempMax: 14, avgTemp: 11, humidity: 64, weatherCode: 1, condition: 'Mainly clear' },
        8: { tempMin: 3, tempMax: 9, avgTemp: 6, humidity: 67, weatherCode: 2, condition: 'Partly cloudy' },
        9: { tempMin: -3, tempMax: 3, avgTemp: 0, humidity: 71, weatherCode: 71, condition: 'Light snow' },
        10: { tempMin: -9, tempMax: -3, avgTemp: -6, humidity: 74, weatherCode: 71, condition: 'Light snow' },
        11: { tempMin: -14, tempMax: -7, avgTemp: -11, humidity: 76, weatherCode: 73, condition: 'Snow' },
    },
};

/**
 * Determine climate zone based on latitude and average temperature
 */
export function detectClimateZone(latitude: number, avgTemp: number): ClimateZone {
    const absLat = Math.abs(latitude);

    // Polar zones (above 60° latitude)
    if (absLat > 60) {
        return ClimateZone.POLAR;
    }

    // Continental zones (40-60° latitude with cold winters)
    if (absLat > 40 && avgTemp < 15) {
        return ClimateZone.CONTINENTAL;
    }

    // Tropical zones (below 23.5° latitude with warm year-round)
    if (absLat < 23.5 && avgTemp > 20) {
        return ClimateZone.TROPICAL;
    }

    // Arid zones (hot, low humidity)
    if (avgTemp > 18 && avgTemp > 25) {
        return ClimateZone.ARID;
    }

    // Default to temperate
    return ClimateZone.TEMPERATE;
}

/**
 * Get seasonal average for a specific date and climate zone
 */
export function getSeasonalAverage(
    date: Date,
    climateZone: ClimateZone
): SeasonalAverage {
    const month = date.getMonth(); // 0-11
    return CLIMATE_AVERAGES[climateZone][month];
}

/**
 * Generate estimated forecast for days 17-30 using seasonal averages
 */
export function generateSeasonalForecasts(
    startDate: Date,
    numberOfDays: number,
    climateZone: ClimateZone
): Array<SeasonalAverage & { date: string }> {
    const forecasts: Array<SeasonalAverage & { date: string }> = [];

    for (let i = 0; i < numberOfDays; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(currentDate.getDate() + i);

        const seasonal = getSeasonalAverage(currentDate, climateZone);

        forecasts.push({
            ...seasonal,
            date: currentDate.toISOString().split('T')[0],
        });
    }

    return forecasts;
}
