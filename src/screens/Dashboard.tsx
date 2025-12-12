import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import BottomNav from "../components/BottomNav";
import FloatingAIRing from "../components/FloatingAIRing";
import AddDeviceModal from "../components/AddDeviceModal";
import { getCurrentUserId, getCurrentUserProfile, updateUserProfile } from "../utils/storage";
import { Plus, Wind, Droplets, Flame, Fan, CloudSun, Tv, Zap, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

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
  const [isDeleting, setIsDeleting] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  // User ID state for double-tap reveal
  const [showUserId, setShowUserId] = useState(false);
  const [userId, setUserId] = useState<string>("");

  // Load devices
  useEffect(() => {
    loadData();
    // Load userId from localStorage
    const storedUserId = getCurrentUserId() || "";
    setUserId(storedUserId);
  }, []);

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
            <h1
              className="text-2xl mb-2 tracking-tight font-semibold cursor-pointer select-none"
              onDoubleClick={() => setShowUserId(!showUserId)}
            >
              {showUserId ? (
                <span className="font-mono text-base">{userId}</span>
              ) : (
                "My Devices"
              )}
            </h1>
            <div className="flex items-center justify-between text-sm text-black/60">
              <div>{location?.city || 'Location'}, {location?.region || 'Unknown'}</div>
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
                  className={`absolute top-3 right-3 w-2 h-2 rounded-full ${device.status === "active" ? "bg-green-500" : "bg-black/20"
                    }`}
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
      <BottomNav active="home" />
      <AddDeviceModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddDevice}
      />

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