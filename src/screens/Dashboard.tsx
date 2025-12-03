import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Plus, Wind, Droplets, Flame, Fan, CloudSun } from "lucide-react";
import BottomNav from "../components/BottomNav";
import FloatingAIRing from "../components/FloatingAIRing";
import AddDeviceModal from "../components/AddDeviceModal";
import { getUserDevices } from "../utils/api";
import { getLocationFromStorage } from "../utils/location";
import { motion } from "motion/react";

const iconMap = {
  ac: Wind,
  air_conditioner: Wind,
  dehumidifier: Droplets,
  refrigerator: Droplets,
  heater: Flame,
  fan: Fan,
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [showAddModal, setShowAddModal] = useState(false);
  const [devices, setDevices] = useState<any[]>([]);
  const [activePlan, setActivePlan] = useState<any>(null);
  const [location, setLocation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Load devices from backend API
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load location
      const savedLocation = getLocationFromStorage();
      if (savedLocation) {
        setLocation(savedLocation);
      }

      // Load devices from backend
      const result = await getUserDevices();
      setDevices(result.devices || []);

      // Load active plan
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
    // Device already added to backend, just refresh
    loadData();
    setShowAddModal(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-20 overflow-y-auto scrollbar-hide">
      <div className="px-5 pt-8 pb-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl mb-3 tracking-tight font-semibold">My Devices</h1>
          <div className="flex items-center justify-between text-sm text-black/60">
            <div>{location?.city || 'Location'}, {location?.region || 'Unknown'}</div>
            <div className="flex items-center gap-2">
              <span>{location?.temperature || '—'}°C • {location?.humidity || '—'}%</span>
              <CloudSun className="w-4 h-4" strokeWidth={1.5} />
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
            const Icon = iconMap[device.type as keyof typeof iconMap];
            return (
              <motion.button
                key={device.id}
                onClick={() => navigate(`/device/${device.id}`)}
                className="aspect-square bg-white/40 backdrop-blur-xl border border-white/60 rounded-3xl p-4 flex flex-col items-center justify-center gap-3 hover:bg-white/50 transition-all shadow-lg text-center relative"
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
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
                  <div className="text-xs tracking-wide mb-1 line-clamp-2">{device.name}</div>
                  <div className="text-xs text-black/50">{device.power}W</div>
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
    </div>
  );
}