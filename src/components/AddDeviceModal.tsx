import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Wind, Droplets, Flame, Fan, Check, AlertCircle } from "lucide-react";
import { scanDevices, type MatterDevice } from "../utils/api";

interface AddDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (device: any) => void;
}

const iconMap: Record<string, any> = {
  ac: Wind,
  dehumidifier: Droplets,
  heater: Flame,
  fan: Fan,
  pump: Droplets, // For Google MVD virtual pump
};

export default function AddDeviceModal({ isOpen, onClose, onAdd }: AddDeviceModalProps) {
  const [stage, setStage] = useState<"scanning" | "selection" | "error">("scanning");
  const [detectedDevices, setDetectedDevices] = useState<MatterDevice[]>([]);
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Reset state when modal opens
      setStage("scanning");
      setDetectedDevices([]);
      setSelectedDevices([]);
      setError(null);

      // Scan for devices using backend API
      const scanForDevices = async () => {
        try {
          console.log('🔍 Scanning for Matter devices...');
          const result = await scanDevices();
          console.log('✅ Devices found:', result.devices);

          setDetectedDevices(result.devices);
          setStage("selection");
        } catch (err) {
          console.error('❌ Device scan failed:', err);
          setError('Failed to scan for devices. Make sure the backend server is running.');
          setStage("error");
        }
      };

      scanForDevices();
    }
  }, [isOpen]);

  const toggleDevice = (id: string) => {
    if (selectedDevices.includes(id)) {
      setSelectedDevices(selectedDevices.filter((deviceId) => deviceId !== id));
    } else {
      setSelectedDevices([...selectedDevices, id]);
    }
  };

  const handleAddDevices = () => {
    selectedDevices.forEach((deviceId) => {
      const device = detectedDevices.find((d) => d.id === deviceId);
      if (device) {
        // Convert MatterDevice to the format expected by the app
        onAdd({
          id: device.id,
          name: device.name,
          type: device.type,
          power: device.power || 0,
        });
      }
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/20 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-2xl rounded-t-3xl z-50 px-6 py-6 max-h-[80vh] overflow-y-auto scrollbar-hide border-t border-white/60 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl tracking-tight">
                {stage === "scanning" ? "Scanning for Devices" : "Select Devices"}
              </h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full border border-black/10 flex items-center justify-center hover:border-black/20 transition-colors"
              >
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>

            {stage === "scanning" && (
              <div className="space-y-3">
                <div className="flex items-center justify-center py-8">
                  <div className="relative">
                    <motion.div
                      className="w-16 h-16 border-2 border-black/20 rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                    <motion.div
                      className="absolute top-0 left-0 w-16 h-16 border-2 border-black border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                  </div>
                </div>
                <p className="text-center text-sm text-black/60 mb-4">
                  Looking for Matter devices on your network...
                </p>
              </div>
            )}

            {stage === "error" && (
              <div className="space-y-4">
                <div className="flex items-center justify-center py-8">
                  <AlertCircle className="w-16 h-16 text-red-500" strokeWidth={1.5} />
                </div>
                <p className="text-center text-sm text-black/60">
                  {error}
                </p>
                <button
                  onClick={onClose}
                  className="w-full py-3.5 bg-black text-white rounded-full text-sm tracking-wide hover:bg-black/90 transition-colors"
                >
                  Close
                </button>
              </div>
            )}

            {stage === "selection" && (
              <div className="space-y-3">
                <p className="text-sm text-black/60 mb-4">
                  Found {detectedDevices.length} device(s). Select the ones you want to add.
                </p>
                <div className="space-y-2 mb-6">
                  {detectedDevices.map((device, index) => {
                    const Icon = iconMap[device.type] || Wind;
                    const isSelected = selectedDevices.includes(device.id);
                    return (
                      <motion.button
                        key={device.id}
                        onClick={() => toggleDevice(device.id)}
                        className="w-full flex items-center gap-3 bg-white/40 backdrop-blur-sm border border-white/60 rounded-2xl p-4 hover:bg-white/50 transition-all text-left"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="w-10 h-10 bg-white/50 backdrop-blur-sm border border-white/60 rounded-xl flex items-center justify-center">
                          <Icon className="w-5 h-5" strokeWidth={1.5} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">{device.name}</p>
                          <p className="text-xs text-black/50">{device.power}W</p>
                        </div>
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${isSelected
                              ? "border-black bg-black"
                              : "border-black/20"
                            }`}
                        >
                          {isSelected && <Check className="w-4 h-4 text-white" strokeWidth={2.5} />}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                <button
                  onClick={handleAddDevices}
                  disabled={selectedDevices.length === 0}
                  className="w-full py-3.5 bg-black text-white rounded-full text-sm tracking-wide hover:bg-black/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Add {selectedDevices.length > 0 && `(${selectedDevices.length})`} Device{selectedDevices.length !== 1 ? "s" : ""}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
