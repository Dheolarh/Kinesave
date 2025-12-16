import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Edit2, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import BottomNav from "../components/BottomNav";
import { getUserData, updateUserDevices } from "../utils/user-storage";
import { getDeviceIcon } from "../utils/device-types";


// Helper function to calculate estimated costs based on power rating
const calculateDeviceCosts = (power: number, pricePerKwh: number, currencySymbol: string = '$') => {
  const dailyUsageHours = Math.random() * 12 + 2; // Random between 2-14 hours
  const dailyKwh = (power / 1000) * dailyUsageHours;
  const dailyCost = dailyKwh * pricePerKwh;
  const monthlyCost = dailyCost * 30;

  return {
    dailyUsage: `${dailyUsageHours.toFixed(1)} hrs`,
    dailyCost: `${currencySymbol}${dailyCost.toFixed(2)}`,
    monthlyCost: `${currencySymbol}${monthlyCost.toFixed(2)}`,
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
  const [wattage, setWattage] = useState("");
  const [priority, setPriority] = useState("");
  const [frequency, setFrequency] = useState("");
  const [hoursPerDay, setHoursPerDay] = useState("");

  // Helper function to check if device is in active plan
  const isDeviceInActivePlan = (deviceId: string): boolean => {
    try {
      const savedPlan = localStorage.getItem("activePlan");
      if (!savedPlan) return false;

      const plan = JSON.parse(savedPlan);

      // Get the full plan details from aiGeneratedPlans
      const savedPlans = localStorage.getItem('aiGeneratedPlans');
      if (!savedPlans) return false;

      const plansData = JSON.parse(savedPlans);
      let fullPlan = null;

      // Map plan ID to full plan data
      if (plan.id === '1') fullPlan = plansData.costSaver;
      else if (plan.id === '2') fullPlan = plansData.ecoMode;
      else if (plan.id === '3') fullPlan = plansData.comfortBalance;

      if (!fullPlan || !fullPlan.devices) return false;

      // Check if device ID is in the plan's devices array
      return fullPlan.devices.includes(deviceId);
    } catch (error) {
      console.error("Error checking device in active plan:", error);
      return false;
    }
  };

  useEffect(() => {
    // Load device from localStorage
    const loadDevice = () => {
      try {
        const userData = getUserData();
        const foundDevice = userData?.devices?.find((d: any) => d.id === id);

        if (foundDevice) {
          const pricePerKwh = userData?.energyCosts?.pricePerKwh || 0.15;
          const currencySymbol = userData?.energyCosts?.currencySymbol || '$';
          const devicePower = foundDevice.wattage || 0;
          const calculatedCosts = calculateDeviceCosts(devicePower, pricePerKwh, currencySymbol);

          // Determine device status based on active plan inclusion
          const deviceStatus = isDeviceInActivePlan(foundDevice.id) ? "active" : "inactive";

          setDevice({
            ...foundDevice,
            power: devicePower,
            type: foundDevice.deviceType,
            status: deviceStatus,
            ...calculatedCosts,
          });
          setDeviceName(foundDevice.customName || foundDevice.originalName);
          setWattage(foundDevice.wattage?.toString() || "");
          setPriority(String(foundDevice.priority || ""));
          setFrequency(foundDevice.survey?.frequency || "");
          setHoursPerDay(foundDevice.survey?.hoursPerDay ? foundDevice.survey.hoursPerDay.toString() : "");
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

  const handleSaveName = () => {
    try {
      // Update device name and survey data in localStorage
      const userData = getUserData();

      if (userData) {
        const updatedDevices = userData.devices.map((d: any) =>
          d.id === id ? {
            ...d,
            customName: deviceName,
            wattage: parseFloat(wattage) || 0,
            priority: priority,
            survey: {
              ...d.survey,
              frequency: frequency,
              hoursPerDay: parseFloat(hoursPerDay) || 0,
            }
          } : d
        );
        updateUserDevices(updatedDevices);

        // Update local device state
        setDevice({
          ...device,
          customName: deviceName,
          wattage: parseFloat(wattage) || 0,
          power: parseFloat(wattage) || 0,
          priority: priority,
          survey: {
            ...device.survey,
            frequency: frequency,
            hoursPerDay: parseFloat(hoursPerDay) || 0,
          }
        });
        setShowEditModal(false);
      }
    } catch (error) {
      console.error("Failed to update device:", error);
    }
  };

  const Icon = getDeviceIcon(device.type);

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
            <div className="text-lg mb-0.5">{device.power}W</div>
            <div className="text-xs text-black/50">Power Rating</div>
          </motion.div>

          <motion.div
            className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-2xl p-4 shadow-lg"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="text-lg mb-0.5">{device.priority || "0"}</div>
            <div className="text-xs text-black/50">Priority</div>
          </motion.div>

          <motion.div
            className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-2xl p-4 shadow-lg"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="text-lg mb-0.5 capitalize">{device.survey?.frequency || "N/A"}</div>
            <div className="text-xs text-black/50">Use Frequency</div>
          </motion.div>

          <motion.div
            className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-2xl p-4 shadow-lg"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <div className="text-lg mb-0.5">{device.survey?.hoursPerDay ? `${device.survey.hoursPerDay} hrs/day` : "N/A"}</div>
            <div className="text-xs text-black/50">Usage Time</div>
          </motion.div>
        </div>
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
              className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-2xl rounded-t-3xl z-50 border-t border-white/60 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] flex flex-col"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              style={{ maxHeight: "85vh" }}
            >
              {/* Header */}
              <div className="px-6 pt-6 pb-4 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl tracking-tight">Edit Device</h2>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="w-8 h-8 rounded-full border border-black/10 flex items-center justify-center hover:border-black/20 transition-colors"
                  >
                    <X className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="px-6 flex-1 overflow-y-auto scrollbar-hide pb-6" style={{ minHeight: 0 }}>
                <div className="space-y-5">
                  {/* Device Name */}
                  <div>
                    <label className="block text-xs text-black/60 mb-2 pt-4 tracking-wide">
                      Device Name
                    </label>
                    <input
                      type="text"
                      value={deviceName}
                      onChange={(e) => setDeviceName(e.target.value)}
                      placeholder="Enter device name"
                      className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-white/60 rounded-xl text-sm shadow-lg focus:outline-none focus:border-black/30 transition-colors"
                    />
                  </div>

                  {/* Wattage */}
                  <div>
                    <label className="block text-xs text-black/60 mb-2 tracking-wide">
                      Power Rating (Watts)
                    </label>
                    <input
                      type="number"
                      value={wattage}
                      onChange={(e) => setWattage(e.target.value)}
                      placeholder="e.g., 2000"
                      min="0"
                      className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-white/60 rounded-xl text-sm shadow-lg focus:outline-none focus:border-black/30 transition-colors"
                    />
                  </div>

                  {/* Priority - Range Slider */}
                  <div>
                    <label className="block text-xs text-black/60 mb-2 tracking-wide">
                      Priority
                    </label>
                    <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-2xl p-4 shadow-lg">
                      <input
                        type="range"
                        min="0"
                        max="5"
                        step="1"
                        value={priority || 0}
                        onChange={(e) => setPriority(e.target.value)}
                        style={{
                          accentColor: '#000000',
                        }}
                        className="w-full h-2 rounded-full appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between mt-3 text-xs text-black/40">
                        <span>0</span>
                        <span>1</span>
                        <span>2</span>
                        <span>3</span>
                        <span>4</span>
                        <span>5</span>
                      </div>
                    </div>
                  </div>

                  {/* Frequency - Button Grid */}
                  <div>
                    <label className="block text-xs text-black/60 mb-2 tracking-wide">
                      Use Frequency
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {["daily", "weekends", "frequently", "rarely"].map((freq) => (
                        <button
                          key={freq}
                          onClick={() => setFrequency(freq)}
                          className={`p-3 rounded-xl text-xs shadow-lg hover:shadow-xl transition-all border capitalize ${frequency === freq
                            ? "bg-black text-white border-black"
                            : "bg-white/40 border-white/60 hover:bg-white/50"
                            }`}
                        >
                          {freq}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Usage Time */}
                  <div>
                    <label className="block text-xs text-black/60 mb-2 tracking-wide">
                      Usage Time(hours/day)
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={hoursPerDay}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9.]/g, '');
                        setHoursPerDay(value);
                      }}
                      onBlur={() => {
                        const val = parseFloat(hoursPerDay);
                        if (val < 0) setHoursPerDay("0");
                        if (val > 24) setHoursPerDay("24");
                      }}
                      placeholder="e.g., 8 (hours), 0.2 (20 minutes)"
                      className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-white/60 rounded-xl text-sm shadow-lg focus:outline-none focus:border-black/30 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Save Button - Fixed at bottom */}
              <div className="px-6 py-4 flex-shrink-0">
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