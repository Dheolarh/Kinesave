import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { MapPin, AlertCircle, Search, X } from "lucide-react";
import {
  detectLocation,
  getLocationFromStorage,
  searchLocation,
  getWeatherData,
  saveLocationToStorage,
  type LocationData,
  type LocationSearchResult
} from "../utils/location";

export default function LocationDetection() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check if location is already stored
    const savedLocation = getLocationFromStorage();
    if (savedLocation) {
      setLocationData(savedLocation);
      setLoading(false);
      return;
    }

    // Auto-detect location
    detectLocationAsync();
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

  const detectLocationAsync = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await detectLocation();
      setLocationData(data);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      if (err instanceof GeolocationPositionError) {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError("Location access denied. Please enable location permissions or enter manually.");
            break;
          case err.POSITION_UNAVAILABLE:
            setError("Location information unavailable.");
            break;
          case err.TIMEOUT:
            setError("Location request timed out.");
            break;
          default:
            setError("Failed to detect location.");
        }
      } else {
        setError("Failed to detect location. Please try again.");
      }
      console.error("Location detection error:", err);
    }
  };

  const handleLocationSelect = async (result: LocationSearchResult) => {
    try {
      setLoading(true);
      setShowManualEntry(false);
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

      saveLocationToStorage(fullLocationData);
      setLocationData(fullLocationData);
      setError(null);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError("Failed to fetch weather data for selected location.");
      console.error("Weather fetch error:", err);
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
        {!showManualEntry ? (
          <>
            <div className="mb-8">
              <motion.div
                className="w-16 h-16 mx-auto mb-6 bg-white/40 backdrop-blur-xl border border-white/60 rounded-full flex items-center justify-center shadow-lg"
                animate={{
                  rotate: loading ? 360 : 0,
                  scale: error ? [1, 1.1, 1] : 1
                }}
                transition={{
                  rotate: { duration: 2, repeat: loading ? Infinity : 0, ease: "linear" },
                  scale: { duration: 0.3 }
                }}
              >
                {error ? (
                  <AlertCircle className="w-7 h-7 text-red-500" strokeWidth={1.5} />
                ) : (
                  <MapPin className="w-7 h-7" strokeWidth={1.5} />
                )}
              </motion.div>
            </div>

            <h2 className="text-2xl mb-3 tracking-tight">
              {loading
                ? "Detecting Your Location..."
                : error
                  ? "Location Detection Failed"
                  : "Location Detected"}
            </h2>

            <p className="text-sm text-black/60 leading-relaxed mb-4">
              {error
                ? error
                : "We tailor your energy optimization to your climate."}
            </p>

            {locationData && !error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mt-8"
              >
                <p className="text-sm mb-2 text-black/70 font-medium">
                  {locationData.city}
                  {locationData.region && `, ${locationData.region}`}
                  {locationData.country && `, ${locationData.country}`}
                </p>
                <p className="text-xs mb-6 text-black/50">
                  {locationData.temperature}°C • {locationData.humidity}% humidity
                  {locationData.weatherDescription && ` • ${locationData.weatherDescription}`}
                </p>
                <button
                  onClick={() => navigate("/setup")}
                  className="px-8 py-3 bg-black text-white rounded-full text-sm tracking-wide hover:bg-black/90 transition-colors"
                >
                  Continue
                </button>
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mt-8 space-y-3"
              >
                <button
                  onClick={detectLocationAsync}
                  className="px-8 py-3 bg-black text-white rounded-full text-sm tracking-wide hover:bg-black/90 transition-colors w-full"
                >
                  Try Again
                </button>
                <button
                  onClick={() => setShowManualEntry(true)}
                  className="px-8 py-3 bg-white/40 backdrop-blur-xl border border-white/60 rounded-full text-sm tracking-wide hover:bg-white/50 transition-colors w-full"
                >
                  Enter Location Manually
                </button>
              </motion.div>
            )}
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="relative"
          >
            <button
              onClick={() => {
                setShowManualEntry(false);
                setSearchQuery("");
                setSearchResults([]);
              }}
              className="absolute -top-2 -right-2 w-8 h-8 bg-black/10 hover:bg-black/20 rounded-full flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" strokeWidth={2} />
            </button>

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
                  placeholder="e.g., Agege, Lagos"
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
                          {result.city}{result.region && `, ${result.region}`}
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