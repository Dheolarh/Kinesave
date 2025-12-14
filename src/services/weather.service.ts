import axios from 'axios';

interface WeatherData {
    temperature: number;
    humidity: number;
    condition: string;
    weatherCode: number;
    timestamp: Date;
}

interface WeatherForecast {
    date: string;
    tempMin: number;
    tempMax: number;
    avgTemp: number;
    condition: string;
    humidity: number;
    weatherCode: number;
}

/**
 * Weather Service using Open-Meteo API (Free, no API key needed)
 * Same API used by frontend for consistency
 */
class WeatherService {
    private readonly baseURL = 'https://api.open-meteo.com/v1';

    /**
     * Get current weather for a location
     */
    async getCurrentWeather(lat: number, lon: number): Promise<WeatherData> {
        try {
            const response = await axios.get(`${this.baseURL}/forecast`, {
                params: {
                    latitude: lat,
                    longitude: lon,
                    current: 'temperature_2m,relative_humidity_2m,weather_code',
                    temperature_unit: 'celsius',
                    timezone: 'auto',
                },
            });

            const current = response.data.current;

            return {
                temperature: Math.round(current.temperature_2m),
                humidity: Math.round(current.relative_humidity_2m),
                weatherCode: current.weather_code,
                condition: this.getWeatherDescription(current.weather_code),
                timestamp: new Date(),
            };
        } catch (error: any) {
            console.error('Weather API error:', error.message);
            throw new Error('Failed to get weather data');
        }
    }

    /**
     * Get 7-day forecast for monthly planning
     */
    async getWeeklyForecast(lat: number, lon: number): Promise<WeatherForecast[]> {
        try {
            const response = await axios.get(`${this.baseURL}/forecast`, {
                params: {
                    latitude: lat,
                    longitude: lon,
                    daily: 'temperature_2m_max,temperature_2m_min,weather_code,relative_humidity_2m_mean',
                    temperature_unit: 'celsius',
                    timezone: 'auto',
                    forecast_days: 7,
                },
            });

            const daily = response.data.daily;
            const forecasts: WeatherForecast[] = [];

            for (let i = 0; i < daily.time.length; i++) {
                const tempMin = daily.temperature_2m_min[i];
                const tempMax = daily.temperature_2m_max[i];

                forecasts.push({
                    date: daily.time[i],
                    tempMin: Math.round(tempMin),
                    tempMax: Math.round(tempMax),
                    avgTemp: Math.round((tempMin + tempMax) / 2),
                    humidity: Math.round(daily.relative_humidity_2m_mean[i]),
                    weatherCode: daily.weather_code[i],
                    condition: this.getWeatherDescription(daily.weather_code[i]),
                });
            }

            return forecasts;
        } catch (error: any) {
            console.error('Forecast API error:', error.message);
            throw new Error('Failed to get forecast data');
        }
    }

    /**
     * Convert WMO weather code to human-readable description
     * https://open-meteo.com/en/docs
     */
    private getWeatherDescription(code: number): string {
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
     * Check for extreme weather conditions
     */
    isExtremeHeat(temperature: number): boolean {
        return temperature > 35; // > 35°C
    }

    isHumid(humidity: number): boolean {
        return humidity > 70; // > 70%
    }

    /**
     * Get monthly forecast based on subscription tier configuration
     * 
     * SUBSCRIPTION LOGIC:
     * - Free tier (use30DayAnalysis = false): 16 days only
     * - Standard tier (use30DayAnalysis = true, usePremiumWeatherAPI = false): 16 days real + 14 days seasonal
     * - Premium tier (use30DayAnalysis = true, usePremiumWeatherAPI = true): 30 days OpenWeatherMap
     */
    async getMonthlyForecast(
        lat: number,
        lon: number,
        analysisDays: number = 16,
        usePremiumAPI: boolean = false,
        premiumApiKey?: string
    ): Promise<WeatherForecast[]> {
        // If only 16 days requested (free tier), use standard forecast
        if (analysisDays === 16) {
            return this.getWeeklyForecast(lat, lon);
        }

        // If premium API enabled and configured
        if (usePremiumAPI && premiumApiKey) {
            return this.getOpenWeatherMapForecast(lat, lon, premiumApiKey);
        }

        // Hybrid approach: Open-Meteo 16 days + seasonal averages for remaining days
        return this.getHybridForecast(lat, lon, analysisDays);
    }

    /**
     * Hybrid forecast: Open-Meteo (16 days) + Seasonal averages (days 17-30)
     * Used for STANDARD tier
     */
    private async getHybridForecast(lat: number, lon: number, totalDays: number): Promise<WeatherForecast[]> {
        const forecasts: WeatherForecast[] = [];

        try {
            // Step 1: Get 16-day forecast from Open-Meteo
            const response = await axios.get(`${this.baseURL}/forecast`, {
                params: {
                    latitude: lat,
                    longitude: lon,
                    daily: 'temperature_2m_max,temperature_2m_min,weather_code,relative_humidity_2m_mean',
                    temperature_unit: 'celsius',
                    timezone: 'auto',
                    forecast_days: 16,
                },
            });

            const daily = response.data.daily;

            // Process first 16 days (real API data)
            for (let i = 0; i < daily.time.length; i++) {
                const tempMin = daily.temperature_2m_min[i];
                const tempMax = daily.temperature_2m_max[i];

                forecasts.push({
                    date: daily.time[i],
                    tempMin: Math.round(tempMin),
                    tempMax: Math.round(tempMax),
                    avgTemp: Math.round((tempMin + tempMax) / 2),
                    humidity: Math.round(daily.relative_humidity_2m_mean[i]),
                    weatherCode: daily.weather_code[i],
                    condition: this.getWeatherDescription(daily.weather_code[i]),
                });
            }

            // Step 2: Add seasonal averages for remaining days (17-30)
            if (totalDays > 16) {
                const { detectClimateZone, generateSeasonalForecasts } = await import('../utils/seasonal-climate');

                // Detect climate zone using location and average temp from forecast
                const avgTemp = forecasts.reduce((sum, f) => sum + f.avgTemp, 0) / forecasts.length;
                const climateZone = detectClimateZone(lat, avgTemp);

                // Generate seasonal forecasts for remaining days
                const lastForecastDate = new Date(forecasts[forecasts.length - 1].date);
                lastForecastDate.setDate(lastForecastDate.getDate() + 1);

                const seasonalForecasts = generateSeasonalForecasts(
                    lastForecastDate,
                    totalDays - 16,
                    climateZone
                );

                // Add seasonal forecasts to array
                seasonalForecasts.forEach((sf) => {
                    forecasts.push({
                        date: sf.date,
                        tempMin: sf.tempMin,
                        tempMax: sf.tempMax,
                        avgTemp: sf.avgTemp,
                        humidity: sf.humidity,
                        weatherCode: sf.weatherCode,
                        condition: sf.condition,
                    });
                });
            }

            return forecasts;
        } catch (error: any) {
            console.error('Hybrid forecast error:', error.message);
            throw new Error('Failed to get hybrid forecast');
        }
    }

    /**
     * Premium forecast using OpenWeatherMap 30-day Climatic Forecast
     * Used for PREMIUM tier
     */
    private async getOpenWeatherMapForecast(
        lat: number,
        lon: number,
        apiKey: string
    ): Promise<WeatherForecast[]> {
        try {
            // OpenWeatherMap Climatic Forecast 30 Days endpoint
            const response = await axios.get(
                `https://api.openweathermap.org/data/2.5/forecast/climate`,
                {
                    params: {
                        lat,
                        lon,
                        appid: apiKey,
                        units: 'metric',
                        cnt: 30, // 30 days
                    },
                }
            );

            const forecasts: WeatherForecast[] = [];

            // Parse OpenWeatherMap response
            response.data.list.forEach((day: any) => {
                const tempMin = day.temp.min;
                const tempMax = day.temp.max;

                forecasts.push({
                    date: new Date(day.dt * 1000).toISOString().split('T')[0],
                    tempMin: Math.round(tempMin),
                    tempMax: Math.round(tempMax),
                    avgTemp: Math.round((tempMin + tempMax) / 2),
                    humidity: Math.round(day.humidity || 60),
                    weatherCode: this.convertOWMToWMO(day.weather[0].id),
                    condition: day.weather[0].description,
                });
            });

            return forecasts;
        } catch (error: any) {
            console.error('OpenWeatherMap forecast error:', error.message);
            throw new Error('Failed to get premium weather forecast');
        }
    }

    /**
     * Convert OpenWeatherMap weather codes to WMO codes (for consistency)
     */
    private convertOWMToWMO(owmCode: number): number {
        // Basic mapping (can be expanded)
        if (owmCode >= 200 && owmCode < 300) return 95; // Thunderstorm
        if (owmCode >= 300 && owmCode < 400) return 51; // Drizzle
        if (owmCode >= 500 && owmCode < 600) return 61; // Rain
        if (owmCode >= 600 && owmCode < 700) return 71; // Snow
        if (owmCode === 800) return 0; // Clear
        if (owmCode === 801) return 1; // Few clouds
        if (owmCode === 802) return 2; // Scattered clouds
        if (owmCode >= 803) return 3; // Broken/overcast
        return 1; // Default
    }
}

export default new WeatherService();
export type { WeatherData, WeatherForecast };
