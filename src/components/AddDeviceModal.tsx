import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Wind, Droplets, Flame, Fan, Search, Check, Zap } from "lucide-react";
import { searchDevices, addDevice, submitSurvey, type EnergyStarDevice } from "../utils/api";

interface AddDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (device: any, deviceId?: string) => void;
}

const DEVICE_TYPES = [
  { value: "air_conditioner", label: "Air Conditioner", icon: Wind },
  { value: "refrigerator", label: "Refrigerator", icon: Droplets },
  { value: "tv", label: "TV", icon: Zap },
  { value: "washing_machine", label: "Washing Machine", icon: Fan },
  { value: "heater", label: "Heater", icon: Flame },
  { value: "led_bulb", label: "LED Bulb", icon: Zap },
];

export default function AddDeviceModal({ isOpen, onClose, onAdd }: AddDeviceModalProps) {
  const [stage, setStage] = useState<"form" | "results" | "adding" | "survey">("form");
  const [deviceType, setDeviceType] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<any | null>(null);
  const [addedDevice, setAddedDevice] = useState<any | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Survey State
  const [frequency, setFrequency] = useState("");
  const [hoursPerDay, setHoursPerDay] = useState("");
  const [usageTimes, setUsageTimes] = useState<string[]>([]);
  const [room, setRoom] = useState("");
  const [isSubmittingSurvey, setIsSubmittingSurvey] = useState(false);

  const resetModal = () => {
    setStage("form");
    setDeviceType("");
    setBrand("");
    setModel("");
    setSearchResults([]);
    setSelectedDevice(null);
    setAddedDevice(null);
    setError(null);

    // Reset Survey
    setFrequency("");
    setHoursPerDay("");
    setUsageTimes([]);
    setRoom("");
  };

  const handleSearch = async () => {
    if (!brand.trim()) {
      setError("Please enter a brand name");
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const result = await searchDevices({
        deviceType,
        brand: brand.trim(),
        model: model.trim() || undefined,
      });

      if (result.found && result.devices.length > 0) {
        setSearchResults(result.devices);
        setStage("results");
      } else {
        setError("No devices found. Try a different brand or model.");
      }
    } catch (err) {
      console.error("Search error:", err);
      setError("Failed to search devices. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectDevice = (device: EnergyStarDevice) => {
    setSelectedDevice(device);
  };

  const handleAddDevice = async () => {
    if (!selectedDevice) return;

    setIsAdding(true);
    setStage("adding");

    try {
      const response = await addDevice({
        brand: selectedDevice.brand,
        modelNumber: selectedDevice.modelNumber,
        productName: selectedDevice.productName,
        deviceType: deviceType || selectedDevice.category,
        room: "",
        energyStarSpecs: {
          annualEnergyUse: selectedDevice.annualEnergyUse,
          energyStarRating: selectedDevice.energyStarRating,
          ...selectedDevice.additionalSpecs,
        },
      });

      if (response.device) {
        setAddedDevice(response.device);
        // Instead of closing, move to survey
        setStage("survey");
      } else {
        setError("Failed to add device. Please try again.");
        setStage("results");
      }
    } catch (err) {
      console.error("Failed to add devices:", err);
      setError("Failed to add devices. Please try again.");
      setStage("results");
    } finally {
      setIsAdding(false);
    }
  };

  const toggleUsageTime = (time: string) => {
    setUsageTimes(prev =>
      prev.includes(time)
        ? prev.filter(t => t !== time)
        : [...prev, time]
    );
  };

  const handleCompleteSurvey = async () => {
    if (!addedDevice || !frequency || !hoursPerDay || usageTimes.length === 0 || !room) return;

    setIsSubmittingSurvey(true);
    try {
      await submitSurvey(addedDevice.id, {
        frequency,
        hoursPerDay: parseFloat(hoursPerDay),
        usageTimes,
        room,
      });

      // Now we finish the whole process
      onAdd(addedDevice, addedDevice.id);
      resetModal();
      onClose();
    } catch (error) {
      console.error("Error submitting survey:", error);
      setError("Failed to save usage data. Please try again.");
    } finally {
      setIsSubmittingSurvey(false);
    }
  };

  const frequencyOptions = [
    { value: "daily", label: "Daily" },
    { value: "few_times_per_week", label: "Few times/week" },
    { value: "rarely", label: "Rarely" },
    { value: "seasonal", label: "Seasonal" },
  ];

  const timeOptions = [
    { value: "morning", label: "Morning" },
    { value: "afternoon", label: "Afternoon" },
    { value: "evening", label: "Evening" },
    { value: "night", label: "Night" },
  ];

  const roomOptions = [
    { value: "living_room", label: "Living Room" },
    { value: "bedroom", label: "Bedroom" },
    { value: "kitchen", label: "Kitchen" },
    { value: "office", label: "Office" },
    { value: "other", label: "Other" },
  ];

  const isSurveyValid = frequency && hoursPerDay && usageTimes.length > 0 && room;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/20 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              resetModal();
              onClose();
            }}
          />
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 flex flex-col bg-white/80 backdrop-blur-2xl rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)]"
            style={{ maxHeight: '85vh' }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            {/* Header - Fixed */}
            <div className="px-6 pt-6 pb-4 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-xl tracking-tight">
                  {stage === "form" ? "Add Device" :
                    stage === "results" ? "Select Device" :
                      stage === "survey" ? "Device Usage" :
                        "Adding Devices"}
                </h2>
                <button
                  onClick={() => {
                    resetModal();
                    onClose();
                  }}
                  className="w-8 h-8 rounded-full border border-black/10 flex items-center justify-center hover:border-black/20 transition-colors"
                >
                  <X className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div
              className="px-6 flex-1 overflow-y-auto scrollbar-hide"
              style={{ minHeight: 0 }}
            >
              {/* Search Form */}
              {stage === "form" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4 pb-6"
                >
                  <div>
                    <label className="text-sm text-black/60 mb-2 block">Device Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      {DEVICE_TYPES.map((type) => {
                        const Icon = type.icon;
                        const isSelected = deviceType === type.value;
                        return (
                          <button
                            key={type.value}
                            onClick={() => setDeviceType(type.value)}
                            className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${isSelected
                              ? "border-black bg-black text-white"
                              : "border-white/60 bg-white/40 hover:bg-white/50"
                              }`}
                          >
                            <Icon className="w-5 h-5" strokeWidth={1.5} />
                            <span className="text-sm">{type.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-black/60 mb-2 block">
                      Brand <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      placeholder="e.g., Samsung, LG, Philips"
                      className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-white/60 rounded-2xl text-sm focus:outline-none focus:border-black/30 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-black/60 mb-2 block">Model (Optional)</label>
                    <input
                      type="text"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder="e.g., AR12C, RT38K"
                      className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-white/60 rounded-2xl text-sm focus:outline-none focus:border-black/30 transition-colors"
                    />
                  </div>

                  {error && (
                    <div className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-xl">
                      {error}
                    </div>
                  )}

                  <button
                    onClick={handleSearch}
                    disabled={isSearching || !brand.trim()}
                    className="w-full py-3.5 bg-black text-white rounded-full text-sm tracking-wide hover:bg-black/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSearching ? (
                      <>
                        <motion.div
                          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        Search Device
                      </>
                    )}
                  </button>
                </motion.div>
              )}
            </div>

            {/* Search Results - Outside scrollable content */}
            {stage === "results" && (
              <>
                <div className="px-6 py-1 flex-shrink-0">
                  <p className="text-sm text-black/60 mb-2">
                    Found {searchResults.length} device(s).
                  </p>
                </div>

                <div className="px-6 py-2 pb-6 flex-1 overflow-y-auto scrollbar-hide" style={{ minHeight: 0 }}>
                  <div className="space-y-2">
                    {searchResults.map((device, index) => {
                      const isSelected = selectedDevice?.modelNumber === device.modelNumber;
                      return (
                        <motion.button
                          key={index}
                          onClick={() => handleSelectDevice(device)}
                          className={`w-full text-left p-4 rounded-2xl shadow-lg hover:shadow-xl transition-all ${isSelected
                            ? "bg-white/80"
                            : "bg-white/40"
                            }`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-sm font-medium mb-1">{device.productName}</h3>
                              <p className="text-xs text-black/50 mb-2">
                                {device.brand} • {device.modelNumber}
                              </p>
                              <div className="flex gap-3 text-xs">
                                {device.annualEnergyUse && (
                                  <span className="text-black/60">
                                    {device.annualEnergyUse} kWh/year
                                  </span>
                                )}
                                {device.energyStarRating && (
                                  <span className="text-green-600 font-medium">
                                    {device.energyStarRating}
                                  </span>
                                )}
                              </div>
                            </div>
                            {isSelected && (
                              <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                                <Check className="w-4 h-4 text-white" strokeWidth={2.5} />
                              </div>
                            )}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                <div className="px-6 py-4 flex-shrink-0 flex gap-3">
                  <button
                    onClick={() => setStage("form")}
                    className="flex-1 py-3.5 bg-white/60 backdrop-blur-xl border border-white/60 text-black rounded-full text-sm tracking-wide hover:bg-white/70 transition-colors"
                  >
                    Back
                  </button>
                  <motion.button
                    onClick={handleAddDevice}
                    disabled={!selectedDevice || isAdding}
                    className="flex-1 bg-black text-white py-3.5 rounded-full text-sm tracking-wide hover:bg-black/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    whileTap={{ scale: 0.98 }}
                  >
                    {isAdding ? "Adding Device..." : "Add Device"}
                  </motion.button>
                </div>
              </>
            )}

            {/* Survey Stage */}
            {stage === "survey" && (
              <>
                <div className="px-6 flex-1 overflow-y-auto scrollbar-hide pb-6" style={{ minHeight: 0 }}>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    {/* Frequency */}
                    <div>
                      <label className="block text-xs text-black/60 pt-6 mb-2 tracking-wide">
                        How often do you use this device?
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {frequencyOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => setFrequency(option.value)}
                            className={`p-3 rounded-xl text-xs transition-all border ${frequency === option.value
                              ? "bg-black text-white border-black"
                              : "bg-white/40 border-white/60 hover:bg-white/50"
                              }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Hours */}
                    <div>
                      <label className="block text-xs text-black/60 mb-2 tracking-wide">
                        Hours per day (0-24)
                      </label>
                      <input
                        type="number"
                        value={hoursPerDay}
                        onChange={(e) => setHoursPerDay(e.target.value)}
                        placeholder="e.g., 8"
                        min="0"
                        max="24"
                        className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-white/60 rounded-xl text-sm focus:outline-none focus:border-black/30"
                      />
                    </div>

                    {/* Times */}
                    <div>
                      <label className="block text-xs text-black/60 mb-2 tracking-wide">
                        Typical usage time
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {timeOptions.map((option) => {
                          const isSelected = usageTimes.includes(option.value);
                          return (
                            <button
                              key={option.value}
                              onClick={() => toggleUsageTime(option.value)}
                              className={`p-3 rounded-xl text-xs flex items-center justify-between transition-all border ${isSelected
                                ? "bg-black text-white border-black"
                                : "bg-white/40 border-white/60 hover:bg-white/50"
                                }`}
                            >
                              <span>{option.label}</span>
                              {isSelected && <Check className="w-3 h-3" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Room */}
                    <div>
                      <label className="block text-xs text-black/60 mb-2 tracking-wide">
                        Location
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {roomOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => setRoom(option.value)}
                            className={`p-3 rounded-xl text-xs transition-all border ${room === option.value
                              ? "bg-black text-white border-black"
                              : "bg-white/40 border-white/60 hover:bg-white/50"
                              }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </div>

                <div className="px-6 py-4 flex-shrink-0">
                  <motion.button
                    onClick={handleCompleteSurvey}
                    disabled={!isSurveyValid || isSubmittingSurvey}
                    className="w-full bg-black text-white py-3.5 rounded-full text-sm tracking-wide hover:bg-black/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    whileTap={{ scale: 0.98 }}
                  >
                    {isSubmittingSurvey ? "Saving..." : "Complete & Add Device"}
                  </motion.button>
                </div>
              </>
            )}

            {/* Adding State */}
            {stage === "adding" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-12"
              >
                <motion.div
                  className="w-16 h-16 border-2 border-black/20 border-t-black rounded-full mb-4"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <p className="text-sm text-black/60">Adding device...</p>
              </motion.div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
