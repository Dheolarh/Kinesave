import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { MapPin, Search } from "lucide-react";
import { searchLocation, getWeatherData, getLocationFromStorage, saveLocationToStorage, type LocationData, type LocationSearchResult } from "../utils/location";
import { updateUserLocation, updateUserEnergyCosts, updateUserDevices, getUserData } from "../utils/user-storage";
import { testEnergyCosts, testDevices } from "../utils/test-data";
import getSymbolFromCurrency from "currency-symbol-map";
// @ts-ignore - Library doesn't have TypeScript types
import { getCountry } from "country-currency-map";

export default function LocationDetection() {
  const navigate = useNavigate();
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [mapPinTapCount, setMapPinTapCount] = useState(0);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get currency info for any country (automatic mapping!)
  const getCurrencyForCountry = (countryName: string): { symbol: string; code: string } => {
    try {
      const countryData = getCountry(countryName);
      if (countryData && countryData.currency) {
        const code = countryData.currency;
        const symbol = getSymbolFromCurrency(code) || "$";
        return { symbol, code };
      }
    } catch (error) {
      console.log(`Currency mapping not found for ${countryName}, using USD`);
    }
    // Default to USD if not found
    return { symbol: "$", code: "USD" };
  };

  useEffect(() => {
    // Check if location is already stored
    const savedLocation = getLocationFromStorage();
    if (savedLocation) {
      setLocationData(savedLocation);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      const results = await searchLocation(searchQuery);
      setSearchResults(results);
      setIsSearching(false);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handleLocationSelect = async (result: LocationSearchResult) => {
    try {
      setSearchQuery("");
      setSearchResults([]);

      // Fetch weather data for selected location
      const weatherData = await getWeatherData(result.lat, result.lon);

      const fullLocationData: LocationData = {
        city: result.city,
        region: result.region,
        country: result.country,
        lat: result.lat,
        lon: result.lon,
        ...weatherData,
      };

      // Save to localStorage so EnergyCostSetup can read it
      saveLocationToStorage(fullLocationData);
      setLocationData(fullLocationData);

      // Auto-save to user storage immediately
      updateUserLocation({
        city: fullLocationData.city,
        region: fullLocationData.region,
        country: fullLocationData.country,
        latitude: fullLocationData.lat || 0,
        longitude: fullLocationData.lon || 0,
        temperature: fullLocationData.temperature,
        weatherDescription: fullLocationData.weatherDescription || "",
      });

      // Auto-save energy costs with currency from location
      const currencyData = getCurrencyForCountry(fullLocationData.country);

      updateUserEnergyCosts({
        monthlyCost: 0,
        pricePerKwh: 0,
        preferredBudget: null,
        currency: currencyData.code,
        currencySymbol: currencyData.symbol,
      });
    } catch (err) {
      console.error("Weather fetch error:", err);
      alert("Failed to fetch weather data. Please try another location.");
    }
  };

  const handleContinue = () => {
    try {
      if (locationData) {
        // Save location to new storage
        updateUserLocation({
          city: locationData.city,
          region: locationData.region,
          country: locationData.country,
          latitude: locationData.lat || 0,
          longitude: locationData.lon || 0,
          temperature: locationData.temperature,
          weatherDescription: locationData.weatherDescription || "",
        });
      }

      // Navigate to energy setup
      navigate("/setup");
    } catch (error) {
      console.error("Failed to save location:", error);
      alert("Failed to save location. Please try again.");
    }
  };

  // Handle MapPin tap for test mode activation (4 taps)
  const handleMapPinTap = () => {
    if (!locationData) return;

    const newCount = mapPinTapCount + 1;
    setMapPinTapCount(newCount);

    // Reset counter after 2 seconds
    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
    }
    tapTimeoutRef.current = setTimeout(() => {
      setMapPinTapCount(0);
    }, 2000);

    // Activate test mode on 4th tap
    if (newCount === 4) {
      setMapPinTapCount(0);

      // Check if user has saved location first
      const userData = getUserData();
      if (!userData?.location) {
        alert('Please save your location first before activating test mode!');
        return;
      }

      // Save test mode to localStorage
      localStorage.setItem('testModeActive', 'true');

      // Load test data (devices and energy costs only, NOT location)
      import('../utils/test-data').then(({ testEnergyCosts, testDevices }) => {
        // Get currency from current location
        const currency = userData?.energyCosts?.currency || 'USD';
        const currencySymbol = userData?.energyCosts?.currencySymbol || '$';

        // Merge test costs with location-based currency
        updateUserEnergyCosts({
          ...testEnergyCosts,
          currency,
          currencySymbol
        });
        updateUserDevices(testDevices);
        console.log('Test mode activated: loaded test devices and energy costs');

        // Navigate to dashboard after data is loaded
        setTimeout(() => navigate('/dashboard'), 500);
      });
    }
  };

  // TEST SETUP - Pre-configure 7 devices and go to dashboard
  const handleTestSetup = () => {
    try {
      if (!locationData) {
        alert('Please set a location first!');
        return;
      }

      // Save location
      updateUserLocation({
        city: locationData.city,
        region: locationData.region,
        country: locationData.country,
        latitude: locationData.lat || 0,
        longitude: locationData.lon || 0,
        temperature: locationData.temperature,
        weatherDescription: locationData.weatherDescription || "",
      });

      // Set up test energy costs (imported from test-data.ts)
      // Get currency from detected location
      const currency = getCurrencyForCountry(locationData.country);
      updateUserEnergyCosts({
        ...testEnergyCosts,
        currency: currency.code,
        currencySymbol: currency.symbol,
      });

      // Pre-configure 7 test devices (imported from test-data.ts)
      updateUserDevices(testDevices);

      // Navigate to dashboard
      console.log('Test setup complete! 7 devices configured.');
      navigate('/dashboard');
    } catch (error) {
      console.error('Test setup failed:', error);
      alert('Test setup failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center px-6">
      <motion.div
        className="text-center max-w-sm w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {locationData ? (
          // Show detected location with Continue button
          <>
            <div className="mb-8">
              <button
                onClick={handleMapPinTap}
                className="w-16 h-16 mx-auto mb-6 bg-white/40 backdrop-blur-xl border border-white/60 rounded-full flex items-center justify-center shadow-lg hover:bg-white/50 transition-colors"
              >
                <MapPin className="w-7 h-7" strokeWidth={1.5} />
              </button>
            </div>

            <h2 className="text-2xl mb-3 tracking-tight">Location Set</h2>

            <p className="text-sm text-black/60 leading-relaxed mb-4">
              Your location has been saved
            </p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mt-8"
            >
              <p className="text-sm mb-2 text-black/70 font-medium">
                {locationData.city}
                {locationData.region && `, ${locationData.region} `}
                {locationData.country && `, ${locationData.country} `}
              </p>

              <p className="text-xs mb-6 text-black/50">
                {locationData.temperature}°C • {locationData.humidity}% humidity
                {locationData.weatherDescription && ` • ${locationData.weatherDescription} `}
              </p>

              <button
                onClick={handleContinue}
                className="px-8 py-3 bg-black text-white rounded-full text-sm tracking-wide hover:bg-black/90 transition-colors"
              >
                Continue
              </button>
            </motion.div>
          </>
        ) : (
          // Show manual entry search by default
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h2 className="text-2xl mb-3 tracking-tight">Enter Your Location</h2>
            <p className="text-sm text-black/60 mb-6">
              Search for your city or area
            </p>

            <div className="relative">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black/40" strokeWidth={1.5} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g., Tokyo, Japan"
                  className="w-full pl-12 pr-4 py-3 bg-white/40 backdrop-blur-xl border border-white/60 rounded-2xl text-sm placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-black/10"
                  autoFocus
                />
              </div>

              <AnimatePresence>
                {searchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute z-10 w-full mt-2 bg-white/90 backdrop-blur-xl border border-white/60 rounded-2xl shadow-lg overflow-hidden"
                  >
                    {searchResults.map((result, index) => (
                      <motion.button
                        key={index}
                        onClick={() => handleLocationSelect(result)}
                        className="w-full px-4 py-3 text-left hover:bg-black/5 transition-colors border-b border-white/40 last:border-b-0"
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="text-sm font-medium text-black/80">
                          {result.city}{result.region && `, ${result.region} `}
                        </div>
                        <div className="text-xs text-black/50 mt-0.5 truncate">
                          {result.displayName}
                        </div>
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {isSearching && searchQuery.length >= 2 && (
                <div className="text-xs text-black/50 mt-2">Searching...</div>
              )}

              {!isSearching && searchQuery.length >= 2 && searchResults.length === 0 && (
                <div className="text-xs text-black/50 mt-2">No results found</div>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}