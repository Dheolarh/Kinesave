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
}

export default new WeatherService();
export { WeatherData, WeatherForecast };
