import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { DollarSign, Zap } from "lucide-react";
import AddDeviceModal from "../components/AddDeviceModal";

export default function EnergyCostSetup() {
  const navigate = useNavigate();
  const [monthlyCost, setMonthlyCost] = useState("");
  const [pricePerKwh, setPricePerKwh] = useState("");
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [selectedDevices, setSelectedDevices] = useState<any[]>([]);

  // Currency based on detected location (San Francisco, CA = USD)
  const currency = "$";
  const location = "San Francisco, CA";

  const handleAddDevices = (device: any) => {
    // Check if device already exists to avoid duplicates
    setSelectedDevices((prev) => {
      const exists = prev.find(d => d.name === device.name);
      if (exists) {
        return prev;
      }
      return [...prev, device];
    });
  };

  const handleProceedToDashboard = () => {
    // Save energy cost data and devices to localStorage
    const energyData = {
      monthlyCost,
      pricePerKwh,
      currency,
      location,
    };
    localStorage.setItem("energyData", JSON.stringify(energyData));
    localStorage.setItem("userDevices", JSON.stringify(selectedDevices));
    
    // Navigate to dashboard
    navigate("/dashboard");
  };

  const isFormValid = monthlyCost && pricePerKwh && selectedDevices.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-32 overflow-y-auto scrollbar-hide">
      <div className="px-5 pt-8 pb-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl mb-2 tracking-tight font-semibold">Energy Cost Setup</h1>
          <p className="text-sm text-black/60">
            Help us calculate your potential savings
          </p>
        </motion.div>
      </div>

      <div className="px-5 space-y-6">
        {/* Location Info */}
        <motion.div
          className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-3xl p-5 shadow-lg"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <p className="text-xs tracking-wide text-black/60 mb-1">DETECTED LOCATION</p>
          <p className="text-sm">{location}</p>
        </motion.div>

        {/* Monthly Cost Input */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <label className="block text-xs text-black/60 mb-3 tracking-wide px-1">
            AVERAGE MONTHLY ELECTRICITY COST
          </label>
          <div className="relative">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-black/40">
              {currency}
            </div>
            <input
              type="number"
              value={monthlyCost}
              onChange={(e) => setMonthlyCost(e.target.value)}
              placeholder="150.00"
              className="w-full pl-10 pr-4 py-4 bg-white/50 backdrop-blur-sm border border-white/60 rounded-2xl text-sm focus:outline-none focus:border-black/30 transition-colors"
            />
            <div className="absolute right-5 top-1/2 -translate-y-1/2">
              <DollarSign className="w-5 h-5 text-black/20" strokeWidth={1.5} />
            </div>
          </div>
        </motion.div>

        {/* Price per kWh Input */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <label className="block text-xs text-black/60 mb-3 tracking-wide px-1">
            PRICE PER KILOWATT-HOUR (kWh)
          </label>
          <div className="relative">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-black/40">
              {currency}
            </div>
            <input
              type="number"
              step="0.01"
              value={pricePerKwh}
              onChange={(e) => setPricePerKwh(e.target.value)}
              placeholder="0.15"
              className="w-full pl-10 pr-4 py-4 bg-white/50 backdrop-blur-sm border border-white/60 rounded-2xl text-sm focus:outline-none focus:border-black/30 transition-colors"
            />
            <div className="absolute right-5 top-1/2 -translate-y-1/2">
              <Zap className="w-5 h-5 text-black/20" strokeWidth={1.5} />
            </div>
          </div>
        </motion.div>

        {/* Devices Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <label className="block text-xs text-black/60 mb-3 tracking-wide px-1">
            YOUR DEVICES
          </label>
          
          {selectedDevices.length === 0 ? (
            <div className="bg-white/30 backdrop-blur-sm border border-white/60 rounded-2xl p-6 text-center">
              <p className="text-sm text-black/50">No devices added yet</p>
              <p className="text-xs text-black/40 mt-1">Scan to add your devices</p>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedDevices.map((device, index) => (
                <div
                  key={index}
                  className="bg-white/50 backdrop-blur-sm border border-white/60 rounded-2xl p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm">{device.name}</p>
                    <p className="text-xs text-black/50">{device.power}W</p>
                  </div>
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Bottom Fixed Buttons */}
      <div className="fixed bottom-0 left-0 right-0 px-5 pb-6 bg-gradient-to-t from-gray-100 via-gray-100 to-transparent pt-6 space-y-3">
        <motion.button
          onClick={() => setShowDeviceModal(true)}
          className="w-full py-3.5 bg-white/60 backdrop-blur-xl border border-white/60 text-black rounded-full text-sm tracking-wide hover:bg-white/70 transition-colors shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileTap={{ scale: 0.98 }}
        >
          {selectedDevices.length === 0 ? "Scan Available Devices" : `Scan More Devices (${selectedDevices.length} added)`}
        </motion.button>

        {selectedDevices.length > 0 && (
          <motion.button
            onClick={handleProceedToDashboard}
            disabled={!isFormValid}
            className="w-full py-3.5 bg-black text-white rounded-full text-sm tracking-wide hover:bg-black/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            whileTap={{ scale: isFormValid ? 0.98 : 1 }}
          >
            Proceed to Dashboard
          </motion.button>
        )}
      </div>

      <AddDeviceModal
        isOpen={showDeviceModal}
        onClose={() => setShowDeviceModal(false)}
        onAdd={handleAddDevices}
      />
    </div>
  );
}
