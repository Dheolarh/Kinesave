import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import BottomNav from "../components/BottomNav";
import FloatingAIRing from "../components/FloatingAIRing";
import AddDeviceModal from "../components/AddDeviceModal";
import { getCurrentUserId, getCurrentUserProfile, updateUserProfile } from "../utils/storage";
import { searchLocation, getWeatherData } from "../utils/location";
import type { LocationSearchResult, LocationData } from "../utils/location";
import { Plus, Wind, Droplets, Flame, Fan, CloudSun, Tv, Zap, X, MapPin, Bell } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import NotificationCenter from "../components/NotificationCenter";
import notificationService from "../services/notification.service";

const iconMap = {
  ac: Wind,
  air_conditioner: Wind,
  dehumidifier: Droplets,
  refrigerator: Droplets,
  heater: Flame,
  fan: Fan,
  tv: Tv,
  washing_machine: Fan,
  led_bulb: Zap,
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [showAddModal, setShowAddModal] = useState(false);
  const [devices, setDevices] = useState<any[]>([]);
  const [activePlan, setActivePlan] = useState<any>(null);
  const [location, setLocation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Long press and delete states
  const [longPressDevice, setLongPressDevice] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [locationSearchQuery, setLocationSearchQuery] = useState("");
  const [locationSearchResults, setLocationSearchResults] = useState<LocationSearchResult[]>([]);
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // User ID state for double-tap reveal
  const [showUserId, setShowUserId] = useState(false);
  const [userId, setUserId] = useState<string>("");

  // Load devices
  useEffect(() => {
    loadData();
    // Load userId from localStorage
    const storedUserId = getCurrentUserId() || "";
    setUserId(storedUserId);
    // Load notification count
    loadUnreadCount();
  }, []);

  const loadUnreadCount = () => {
    setUnreadCount(notificationService.getUnreadCount());
  };

  const handleNotificationCenterClose = () => {
    setShowNotificationCenter(false);
    loadUnreadCount(); // Refresh count when closing
  };

  const loadData = () => {
    try {
      setLoading(true);

      // Load complete user profile from localStorage
      const profile = getCurrentUserProfile();

      if (!profile) {
        console.error("No user profile found");
        setLoading(false);
        return;
      }

      // Set location
      if (profile.location) {
        setLocation(profile.location);
      }

      // Set devices  
      if (profile.devices) {
        setDevices(profile.devices);
      }

      // Load active plan (still from localStorage for now)
      const savedPlan = localStorage.getItem("activePlan");
      if (savedPlan) {
        setActivePlan(JSON.parse(savedPlan));
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDevice = (device: any) => {
    try {
      // Get current profile
      const profile = getCurrentUserProfile();

      if (profile) {
        // Add new device to existing devices
        const updatedDevices = [...(profile.devices || []), device];

        // Save to localStorage
        updateUserProfile({ devices: updatedDevices });

        // Reload dashboard to show new device
        loadData();
      }

      setShowAddModal(false);
    } catch (error) {
      console.error("Failed to add device:", error);
    }
  };

  // Long press handlers
  const handlePressStart = (device: any) => {
    longPressTimer.current = setTimeout(() => {
      setLongPressDevice(device);
      setShowDeleteModal(true);
    }, 500); // 500ms long press
  };

  const handlePressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // Delete device
  const handleDeleteDevice = () => {
    if (!longPressDevice) return;

    setIsDeleting(true);
    try {
      // Delete from localStorage
      const profile = getCurrentUserProfile();

      if (profile) {
        // Remove device from array
        const updatedDevices = profile.devices.filter((d: any) => d.id !== longPressDevice.id);

        // Save back to localStorage
        updateUserProfile({ devices: updatedDevices });

        // Update UI
        setDevices(updatedDevices);
      }

      setShowDeleteModal(false);
      setLongPressDevice(null);
    } catch (error) {
      console.error("Failed to delete device:", error);
      alert("Failed to delete device. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Location search with debouncing
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (locationSearchQuery.length < 2) {
      setLocationSearchResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchLocation(locationSearchQuery);
        setLocationSearchResults(results);
      } catch (error) {
        console.error("Location search error:", error);
        setLocationSearchResults([]);
      }
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [locationSearchQuery]);

  // Handle location selection
  const handleLocationSelect = async (result: LocationSearchResult) => {
    try {
      setIsUpdatingLocation(true);

      // Fetch weather data for selected location
      const weatherData = await getWeatherData(result.lat, result.lon);

      const newLocationData = {
        city: result.city,
        region: result.region,
        country: result.country,
        latitude: result.lat,
        longitude: result.lon,
        temperature: weatherData.temperature,
        weatherDescription: weatherData.weatherDescription,
      };

      // Update location in localStorage
      updateUserProfile({ location: newLocationData });

      // Update local state
      setLocation(newLocationData);

      // Close modal and reset
      setShowLocationModal(false);
      setLocationSearchQuery("");
      setLocationSearchResults([]);
      setIsUpdatingLocation(false);
    } catch (error) {
      console.error("Failed to update location:", error);
      setIsUpdatingLocation(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-20 overflow-y-auto scrollbar-hide">
      <div className="px-5 pt-4 pb-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="px-3 pt-2 pb-4">
            <div className="flex items-center justify-between mb-2">
              <h1
                className="text-2xl tracking-tight flex-shrink-0"
                onDoubleClick={() => setShowUserId(!showUserId)}
              >
                {showUserId ? (
                  <div className="font-mono text-base overflow-x-auto max-w-[8rem] whitespace-nowrap">{userId}</div>
                ) : (
                  "My Devices"
                )}
              </h1>
              {/* Notification Bell */}
              <button
                onClick={() => setShowNotificationCenter(true)}
                className="relative w-10 h-10 flex items-center justify-center"
              >
                <Bell className="w-5 h-5" strokeWidth={1.5} />
                {/* Unread indicator dot */}
                {unreadCount > 0 && (
                  <div
                    className="absolute bg-black rounded-full"
                    style={{
                      top: '6px',
                      right: '6px',
                      width: '6px',
                      height: '6px'
                    }}
                  />
                )}
              </button>
            </div>
            <div className="flex items-center justify-between text-sm text-black/60">
              {/* Clickable location */}
              <button
                onClick={() => setShowLocationModal(true)}
                className="hover:text-black transition-colors flex items-center gap-1.5"
              >
                <MapPin className="w-4 h-4" strokeWidth={1.5} />
                <span>{location?.city || 'Location'}, {location?.region || 'Unknown'}</span>
              </button>
              <div className="flex items-center gap-2">
                <span>{location?.temperature || '—'}°C • {location?.weatherDescription || '—'}</span>
                <CloudSun className="w-4 h-4" strokeWidth={1.5} />
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="px-5 space-y-4">
        {/* Active Plan Card - Only show if user has an active plan */}
        {activePlan && (
          <motion.button
            onClick={() => navigate("/plans")}
            className="w-full bg-white/40 backdrop-blur-xl border border-white/60 rounded-3xl p-6 hover:bg-white/50 transition-all shadow-lg text-left"
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-xs tracking-wide text-black/60 mb-2">ACTIVE PLAN</div>
                <h3 className="text-lg tracking-tight mb-1">{activePlan.name}</h3>
                <p className="text-xs text-black/60">Monthly savings: {activePlan.savings}</p>
              </div>
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
            </div>
            <div className="pt-3 border-t border-white/40 text-xs text-black/60">
              Tap to view or change plan
            </div>
          </motion.button>
        )}

        {/* Device Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Add Device Button */}
          <motion.button
            onClick={() => setShowAddModal(true)}
            className="aspect-square bg-white/40 backdrop-blur-xl border border-white/60 rounded-3xl p-4 flex flex-col items-center justify-center gap-3 hover:bg-white/50 transition-all shadow-lg"
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="w-12 h-12 bg-white/50 backdrop-blur-sm border border-white/60 rounded-full flex items-center justify-center">
              <Plus className="w-6 h-6" strokeWidth={1.5} />
            </div>
            <span className="text-xs tracking-wide text-center">Add Device</span>
          </motion.button>

          {/* Device Cards */}
          {devices.map((device, index) => {
            const Icon = iconMap[device.deviceType as keyof typeof iconMap] || iconMap[device.type as keyof typeof iconMap] || Zap;
            return (
              <motion.button
                key={device.id}
                onClick={() => navigate(`/device/${device.id}`)}
                onPointerDown={() => handlePressStart(device)}
                onPointerUp={handlePressEnd}
                onPointerLeave={handlePressEnd}
                className="aspect-square bg-white/40 backdrop-blur-xl border border-white/60 rounded-3xl p-4 flex flex-col items-center justify-center gap-3 hover:bg-white/50 transition-all shadow-lg text-center relative"
                whileTap={{ scale: 0.98 }}
                animate={{
                  opacity: showDeleteModal && longPressDevice?.id === device.id ? 0.5 : 1,
                  scale: showDeleteModal && longPressDevice?.id === device.id ? 0.95 : 1,
                }}
                initial={{ opacity: 0, y: 10 }}
                transition={{ delay: 0.2 + (index + 1) * 0.05 }}
              >
                <div
                  className={`absolute top-3 right-3 w-2 h-2 rounded-full ${device.status === "active" ? "bg-green-500" : "bg-black/20"}`}
                />
                <div className="w-12 h-12 bg-white/50 backdrop-blur-sm border border-white/60 rounded-2xl flex items-center justify-center">
                  <Icon className="w-6 h-6" strokeWidth={1.5} />
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <div className="text-xs tracking-wide mb-1 line-clamp-2">{device.customName || device.name}</div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      <FloatingAIRing onClick={() => navigate("/ai-analysis")} />
      {/* Notification Center Modal */}
      <NotificationCenter
        isOpen={showNotificationCenter}
        onClose={handleNotificationCenterClose}
      />

      <BottomNav active="home" />
      <AddDeviceModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddDevice}
      />

      {/* Location Update Modal */}
      <AnimatePresence>
        {showLocationModal && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowLocationModal(false);
                setLocationSearchQuery("");
                setLocationSearchResults([]);
              }}
            />
            <motion.div
              className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-2xl rounded-t-3xl z-50 border-t border-white/60 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] flex flex-col"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              style={{ maxHeight: "75vh" }}
            >
              {/* Header */}
              <div className="px-6 pt-6 pb-4 flex-shrink-0 flex items-center justify-between">
                <h2 className="text-xl tracking-tight">Update Location</h2>
                <button
                  onClick={() => {
                    setShowLocationModal(false);
                    setLocationSearchQuery("");
                    setLocationSearchResults([]);
                  }}
                  className="w-8 h-8 rounded-full border border-black/10 flex items-center justify-center hover:border-black/20 transition-colors"
                >
                  <X className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 pb-6 flex-1 overflow-y-auto scrollbar-hide">
                <div className="space-y-4">
                  <p className="text-sm text-black/60">
                    Search for your city to update location
                  </p>

                  {/* Current Location Display */}
                  {location && (
                    <div className="bg-white/50 backdrop-blur-xl border border-white/60 rounded-2xl p-4 shadow-lg">
                      <div className="text-xs text-black/60 mb-1">Current Location</div>
                      <div className="text-sm font-medium">
                        {location.city}, {location.region}
                      </div>
                      <div className="text-xs text-black/60 mt-1">
                        {location.country} • {location.temperature}°C • {location.weatherDescription}
                      </div>
                    </div>
                  )}

                  {/* Search Input */}
                  <div>
                    <label className="block text-xs text-black/60 mb-2 tracking-wide">
                      Search City
                    </label>
                    <input
                      type="text"
                      value={locationSearchQuery}
                      onChange={(e) => setLocationSearchQuery(e.target.value)}
                      placeholder="e.g., Lagos, London, New York"
                      className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-white/60 rounded-xl text-sm shadow-lg focus:outline-none focus:border-black/30"
                    />
                  </div>

                  {/* Search Results */}
                  {locationSearchResults.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs text-black/60">Select Location:</div>
                      {locationSearchResults.map((result, index) => (
                        <button
                          key={index}
                          onClick={() => handleLocationSelect(result)}
                          disabled={isUpdatingLocation}
                          className="w-full text-left p-4 bg-white/40 backdrop-blur-xl border border-white/60 rounded-2xl shadow-lg hover:bg-white/50 transition-all disabled:opacity-50"
                        >
                          <div className="text-sm font-medium">{result.displayName}</div>
                          <div className="text-xs text-black/60 mt-1">
                            {result.city}, {result.region} • {result.country}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {isUpdatingLocation && (
                    <div className="flex items-center justify-center py-8">
                      <motion.div
                        className="w-8 h-8 border-2 border-black/20 border-t-black rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                    </div>
                  )}

                  <div className="text-center">
                    <p className="text-xs text-black/40">
                      We'll use your location to provide accurate energy pricing and weather data
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && longPressDevice && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/20 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowDeleteModal(false);
                setLongPressDevice(null);
              }}
            />

            {/* Bottom Sheet Modal */}
            <motion.div
              className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-2xl rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)]"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
            >
              {/* Header */}
              <div className="px-6 pt-6 pb-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl tracking-tight">Remove Device</h2>
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setLongPressDevice(null);
                    }}
                    className="w-8 h-8 rounded-full border border-black/10 flex items-center justify-center hover:border-black/20 transition-colors"
                  >
                    <X className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 pb-6">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <p className="text-sm text-black/60">
                    Are you sure you want to remove this device?
                  </p>

                  {/* Device Info Card */}
                  <div className="bg-white/50 backdrop-blur-sm border border-white/60 rounded-2xl p-4 shadow-lg">
                    <p className="text-sm font-medium mb-1">
                      {longPressDevice.customName || longPressDevice.name}
                    </p>
                    <p className="text-xs text-black/50">
                      {longPressDevice.wattage || 0}W
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => {
                        setShowDeleteModal(false);
                        setLongPressDevice(null);
                      }}
                      className="flex-1 py-3.5 bg-white/60 backdrop-blur-xl border border-white/60 text-black rounded-full text-sm tracking-wide hover:bg-white/70 transition-colors"
                    >
                      Cancel
                    </button>
                    <motion.button
                      onClick={handleDeleteDevice}
                      disabled={isDeleting}
                      className="flex-1 py-3.5 bg-black text-white rounded-full text-sm tracking-wide hover:bg-black/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      whileTap={{ scale: 0.98 }}
                    >
                      {isDeleting ? (
                        <>
                          <motion.div
                            className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          />
                          Removing...
                        </>
                      ) : (
                        "Remove"
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}