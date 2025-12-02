import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Wind, Droplets, Flame, Fan, Check } from "lucide-react";

interface AddDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (device: any) => void;
}

const iconMap = {
  ac: Wind,
  dehumidifier: Droplets,
  heater: Flame,
  fan: Fan,
};

// Mock nearby devices that will be "detected"
const nearbyDevices = [
  { id: "nearby-1", name: "LG Smart AC", type: "ac", power: 1500 },
  { id: "nearby-2", name: "Frigidaire Dehumidifier", type: "dehumidifier", power: 350 },
  { id: "nearby-3", name: "Dyson Space Heater", type: "heater", power: 1200 },
  { id: "nearby-4", name: "Honeywell Tower Fan", type: "fan", power: 75 },
  { id: "nearby-5", name: "GE Window AC", type: "ac", power: 1800 },
];

export default function AddDeviceModal({ isOpen, onClose, onAdd }: AddDeviceModalProps) {
  const [stage, setStage] = useState<"scanning" | "selection">("scanning");
  const [detectedDevices, setDetectedDevices] = useState<typeof nearbyDevices>([]);
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      // Reset state when modal opens
      setStage("scanning");
      setDetectedDevices([]);
      setSelectedDevices([]);

      // Simulate device detection
      const deviceDetectionTimers: NodeJS.Timeout[] = [];
      nearbyDevices.forEach((device, index) => {
        const timer = setTimeout(() => {
          setDetectedDevices((prev) => [...prev, device]);
        }, 300 * (index + 1));
        deviceDetectionTimers.push(timer);
      });

      // Move to selection stage after all devices are detected
      const finalTimer = setTimeout(() => {
        setStage("selection");
      }, 300 * (nearbyDevices.length + 1));
      deviceDetectionTimers.push(finalTimer);

      return () => {
        deviceDetectionTimers.forEach(clearTimeout);
      };
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
      const device = nearbyDevices.find((d) => d.id === deviceId);
      if (device) {
        onAdd(device);
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
                  Looking for nearby smart devices...
                </p>
                <div className="space-y-2">
                  {detectedDevices.map((device, index) => {
                    const Icon = iconMap[device.type as keyof typeof iconMap];
                    return (
                      <motion.div
                        key={device.id}
                        className="flex items-center gap-3 bg-white/40 backdrop-blur-sm border border-white/60 rounded-2xl p-4"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        <div className="w-10 h-10 bg-white/50 backdrop-blur-sm border border-white/60 rounded-xl flex items-center justify-center">
                          <Icon className="w-5 h-5" strokeWidth={1.5} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">{device.name}</p>
                          <p className="text-xs text-black/50">{device.power}W</p>
                        </div>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {stage === "selection" && (
              <div className="space-y-3">
                <p className="text-sm text-black/60 mb-4">
                  Found {nearbyDevices.length} devices. Select the ones you want to add.
                </p>
                <div className="space-y-2 mb-6">
                  {nearbyDevices.map((device, index) => {
                    const Icon = iconMap[device.type as keyof typeof iconMap];
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
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                            isSelected
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
