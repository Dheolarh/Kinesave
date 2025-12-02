import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Check, Wind, Droplets, Flame, Fan, ArrowLeft } from "lucide-react";
import Orb from "../components/Orb";

const iconMap = {
  ac: Wind,
  dehumidifier: Droplets,
  heater: Flame,
  fan: Fan,
};

const analysisSteps = [
  "Scanning device usage patterns",
  "Checking weather & climate data",
  "Calculating optimal energy plans",
  "Generating recommendations",
];

export default function AIAnalysis() {
  const navigate = useNavigate();
  const [stage, setStage] = useState<"selection" | "analyzing" | "complete">("selection");
  const [availableDevices, setAvailableDevices] = useState<any[]>([]);
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);

  // Load user devices from localStorage
  useEffect(() => {
    const savedDevices = localStorage.getItem("userDevices");
    if (savedDevices) {
      const parsedDevices = JSON.parse(savedDevices);
      const devicesWithIds = parsedDevices.map((device: any, index: number) => ({
        ...device,
        id: String(index + 1),
      }));
      setAvailableDevices(devicesWithIds);
      // Pre-select all devices by default
      setSelectedDevices(devicesWithIds.map((d: any) => d.id));
    }
  }, []);

  const toggleDevice = (id: string) => {
    if (selectedDevices.includes(id)) {
      setSelectedDevices(selectedDevices.filter((deviceId) => deviceId !== id));
    } else {
      setSelectedDevices([...selectedDevices, id]);
    }
  };

  const startAnalysis = () => {
    if (selectedDevices.length > 0) {
      setStage("analyzing");
      setCurrentStep(0);
    }
  };

  useEffect(() => {
    if (stage === "analyzing" && currentStep < analysisSteps.length) {
      const timer = setTimeout(() => {
        setCurrentStep(currentStep + 1);
      }, 800);
      return () => clearTimeout(timer);
    } else if (stage === "analyzing" && currentStep >= analysisSteps.length) {
      const completeTimer = setTimeout(() => {
        setStage("complete");
      }, 500);
      return () => clearTimeout(completeTimer);
    }
  }, [stage, currentStep]);

  useEffect(() => {
    if (stage === "complete") {
      const navTimer = setTimeout(() => {
        navigate("/plans");
      }, 1500);
      return () => clearTimeout(navTimer);
    }
  }, [stage, navigate]);

  if (stage === "selection") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-32 overflow-y-auto scrollbar-hide">
        <div className="px-5 pt-8 pb-6">
          <button
            onClick={() => navigate("/dashboard")}
            className="w-10 h-10 rounded-full border border-black/10 flex items-center justify-center mb-6 hover:border-black/20 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
          </button>
          
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-2xl mb-2 tracking-tight font-semibold">Select Devices</h1>
            <p className="text-sm text-black/60">
              Choose which devices to include in analysis
            </p>
          </motion.div>
        </div>

        <div className="px-5 space-y-3">
          {availableDevices.map((device, index) => {
            const Icon = iconMap[device.type as keyof typeof iconMap];
            const isSelected = selectedDevices.includes(device.id);
            
            return (
              <motion.button
                key={device.id}
                onClick={() => toggleDevice(device.id)}
                className="w-full bg-white/40 backdrop-blur-xl border border-white/60 rounded-3xl p-5 flex items-center gap-4 hover:bg-white/50 transition-all shadow-lg text-left"
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="w-14 h-14 bg-white/50 backdrop-blur-sm border border-white/60 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Icon className="w-6 h-6" strokeWidth={1.5} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm tracking-wide mb-1">{device.name}</h3>
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

        <div className="fixed bottom-20 left-0 right-0 px-5 pb-6 bg-gradient-to-t from-gray-100 via-gray-100 to-transparent pt-6">
          <motion.button
            onClick={startAnalysis}
            disabled={selectedDevices.length === 0}
            className="w-full py-3.5 bg-black text-white rounded-full text-sm tracking-wide hover:bg-black/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileTap={{ scale: selectedDevices.length > 0 ? 0.98 : 1 }}
          >
            Analyze {selectedDevices.length > 0 && `(${selectedDevices.length} devices)`}
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center px-6 overflow-y-auto scrollbar-hide">
      <motion.div
        className="text-center max-w-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="w-32 h-32 mx-auto mb-8 relative"
          animate={{
            scale: stage === "complete" ? [1, 1.1, 1] : 1,
          }}
          transition={{
            duration: 0.5,
          }}
        >
          <AnimatePresence mode="wait">
            {stage === "complete" ? (
              <motion.div
                key="check"
                className="w-full h-full bg-white rounded-3xl flex items-center justify-center shadow-lg"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <Check className="w-16 h-16" strokeWidth={2} />
              </motion.div>
            ) : (
              <motion.div
                key="orb"
                className="w-full h-full bg-white rounded-3xl flex items-center justify-center shadow-lg p-6"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <Orb
                  hoverIntensity={0.3}
                  rotateOnHover={false}
                  hue={0}
                  forceHoverState={true}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <h2 className="text-2xl mb-3 tracking-tight">
          {stage === "complete" ? "Analysis Complete" : "Analyzing Your Devices..."}
        </h2>
        
        <p className="text-sm text-black/60 mb-8">
          {stage === "complete"
            ? "We've found the best plans for you"
            : "This will only take a moment"}
        </p>

        <div className="space-y-3 text-left">
          {analysisSteps.map((step, index) => (
            <motion.div
              key={index}
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -10 }}
              animate={{
                opacity: index <= currentStep ? 1 : 0.3,
                x: 0,
              }}
              transition={{ delay: index * 0.1 }}
            >
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${
                  index < currentStep
                    ? "border-black bg-black"
                    : index === currentStep
                    ? "border-black"
                    : "border-black/20"
                }`}
              >
                {index < currentStep && (
                  <Check className="w-3 h-3 text-white" strokeWidth={2.5} />
                )}
              </div>
              <span className={`text-sm ${index <= currentStep ? "" : "text-black/40"}`}>
                {step}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}