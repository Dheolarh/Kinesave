import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Wind, Droplets, Flame, Fan, TrendingDown, Zap, Thermometer, Edit2, X, Tv } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import BottomNav from "../components/BottomNav";
import { getUserDevices, updateDevice } from "../utils/api";

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

// Helper function to calculate estimated costs based on power rating
const calculateDeviceCosts = (power: number, pricePerKwh: number) => {
  const dailyUsageHours = Math.random() * 12 + 2; // Random between 2-14 hours
  const dailyKwh = (power / 1000) * dailyUsageHours;
  const dailyCost = dailyKwh * pricePerKwh;
  const monthlyCost = dailyCost * 30;

  return {
    dailyUsage: `${dailyUsageHours.toFixed(1)} hrs`,
    dailyCost: `$${dailyCost.toFixed(2)}`,
    monthlyCost: `$${monthlyCost.toFixed(2)}`,
    efficiency: power > 1000 ? "A+" : power > 500 ? "A" : "B",
    heatOutput: power > 1000 ? `${Math.floor(power * 3.4)} BTU` : "N/A",
  };
};

export default function DeviceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [device, setDevice] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deviceName, setDeviceName] = useState("");

  useEffect(() => {
    // Load device from backend API
    const loadDevice = async () => {
      try {
        const result = await getUserDevices();
        const foundDevice = result.devices?.find((d: any) => d.id === id);

        if (foundDevice) {
          const energyData = localStorage.getItem("energyData");
          const pricePerKwh = energyData ? JSON.parse(energyData).pricePerKwh : 0.15;
          const devicePower = foundDevice.power || foundDevice.energyStarSpecs?.powerRatingW || 0;
          const calculatedCosts = calculateDeviceCosts(devicePower, parseFloat(pricePerKwh));

          setDevice({
            ...foundDevice,
            power: devicePower,
            type: foundDevice.deviceType || foundDevice.type,
            status: "active",
            ...calculatedCosts,
          });
          setDeviceName(foundDevice.customName || foundDevice.name);
        }
      } catch (error) {
        console.error("Failed to load device:", error);
      }
    };
    loadDevice();
  }, [id]);

  if (!device) {
    return null;
  }

  const handleSaveName = async () => {
    try {
      // Update device name via API
      await updateDevice(id!, { customName: deviceName });
      setDevice({ ...device, customName: deviceName });
      setShowEditModal(false);
    } catch (error) {
      console.error("Failed to update device name:", error);
    }
  };

  const Icon = iconMap[device.type as keyof typeof iconMap] || Wind;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-20 overflow-y-auto scrollbar-hide">
      <div className="px-5 pt-6 pb-8 bg-white/40 backdrop-blur-xl border-b border-white/60">
        <button
          onClick={() => navigate("/dashboard")}
          className="w-10 h-10 rounded-full border border-black/10 flex items-center justify-center mb-6 hover:border-black/20 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
        </button>

        <div className="flex items-start gap-4">
          <div className="w-16 h-16 border border-black/10 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Icon className="w-7 h-7" strokeWidth={1.5} />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h1 className="text-2xl tracking-tight">{deviceName}</h1>
              <button
                onClick={() => setShowEditModal(true)}
                className="w-8 h-8 rounded-full border border-black/10 flex items-center justify-center hover:border-black/20 transition-colors flex-shrink-0"
              >
                <Edit2 className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${device.status === "active" ? "bg-green-500" : "bg-black/20"
                  }`}
              />
              <span className="text-xs text-black/60">
                {device.status === "active" ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 py-6 space-y-4">
        <h2 className="text-xs tracking-wide text-black/60 mb-3">SPECIFICATIONS</h2>

        <div className="grid grid-cols-2 gap-3">
          <motion.div
            className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-2xl p-4 shadow-lg"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Zap className="w-5 h-5 mb-2 text-black/60" strokeWidth={1.5} />
            <div className="text-lg mb-0.5">{device.power}W</div>
            <div className="text-xs text-black/50">Power Rating</div>
          </motion.div>

          <motion.div
            className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-2xl p-4 shadow-lg"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <TrendingDown className="w-5 h-5 mb-2 text-black/60" strokeWidth={1.5} />
            <div className="text-lg mb-0.5">{device.efficiency}</div>
            <div className="text-xs text-black/50">Efficiency</div>
          </motion.div>

          <motion.div
            className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-2xl p-4 shadow-lg"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Thermometer className="w-5 h-5 mb-2 text-black/60" strokeWidth={1.5} />
            <div className="text-lg mb-0.5">{device.heatOutput}</div>
            <div className="text-xs text-black/50">Heat Output</div>
          </motion.div>

          <motion.div
            className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-2xl p-4 shadow-lg"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <div className="text-lg mb-0.5">{device.dailyUsage}</div>
            <div className="text-xs text-black/50">Daily Usage</div>
          </motion.div>
        </div>
      </div>

      <div className="px-5 py-6 space-y-4">
        <h2 className="text-xs tracking-wide text-black/60 mb-3">COST ANALYSIS</h2>

        <motion.div
          className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-3xl p-5 shadow-lg"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl tracking-tight">{device.dailyCost}</span>
            <span className="text-xs text-black/50">/ day</span>
          </div>
          <p className="text-xs text-black/50">Estimated daily cost</p>
        </motion.div>

        <motion.div
          className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-3xl p-5 shadow-lg"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl tracking-tight">{device.monthlyCost}</span>
            <span className="text-xs text-black/50">/ month</span>
          </div>
          <p className="text-xs text-black/50">Estimated monthly cost</p>
        </motion.div>

        <motion.div
          className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-3xl p-5 shadow-lg"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-xs tracking-wide mb-3">OPTIMIZATION TIP</h3>
          <p className="text-sm leading-relaxed text-black/70">
            Running this device during off-peak hours (10 PM - 6 AM) could save you up to 15% on energy costs.
          </p>
        </motion.div>
      </div>

      <BottomNav active="home" />

      {/* Edit Device Name Modal */}
      <AnimatePresence>
        {showEditModal && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/20 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditModal(false)}
            />
            <motion.div
              className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-2xl rounded-t-3xl z-50 px-6 py-6 border-t border-white/60 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl tracking-tight">Edit Device Name</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="w-8 h-8 rounded-full border border-black/10 flex items-center justify-center hover:border-black/20 transition-colors"
                >
                  <X className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs text-black/60 mb-2 tracking-wide">
                    DEVICE NAME
                  </label>
                  <input
                    type="text"
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                    placeholder="Enter device name"
                    className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-white/60 rounded-2xl text-sm focus:outline-none focus:border-black/30 transition-colors"
                    autoFocus
                  />
                </div>

                <button
                  onClick={handleSaveName}
                  disabled={!deviceName.trim()}
                  className="w-full py-3.5 bg-black text-white rounded-full text-sm tracking-wide hover:bg-black/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}