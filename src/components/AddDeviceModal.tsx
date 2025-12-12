import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Wind, Droplets, Flame, Fan, Search, Check, Zap, Tv, PlusCircle } from "lucide-react";
import energyStarService, { type DeviceSpec } from "../services/energy-star.service";

interface AddDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (device: any, deviceId?: string) => void;
}

const DEVICE_TYPES = [
  { value: "air_conditioner", label: "Air Conditioner", icon: Wind },
  { value: "refrigerator", label: "Refrigerator", icon: Droplets },
  { value: "tv", label: "TV", icon: Tv },
  { value: "hot_plate", label: "Hot Plate", icon: Flame },
  { value: "heater", label: "Heater", icon: Fan },
  { value: "led_bulb", label: "LED Bulb", icon: Zap },
];

export default function AddDeviceModal({ isOpen, onClose, onAdd }: AddDeviceModalProps) {
  const [stage, setStage] = useState<"form" | "results" | "manual" | "survey">("form");
  const [deviceType, setDeviceType] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<any | null>(null);
  const [addedDevice, setAddedDevice] = useState<any | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previousStage, setPreviousStage] = useState<"results" | "manual" | null>(null);

  // Manual Entry State
  const [manualDeviceName, setManualDeviceName] = useState("");
  const [manualWattage, setManualWattage] = useState("");
  const [manualBrand, setManualBrand] = useState("");
  const [manualModel, setManualModel] = useState("");

  // Survey State
  const [frequency, setFrequency] = useState("");
  const [hoursPerDay, setHoursPerDay] = useState("");
  const [usageTimes, setUsageTimes] = useState<string[]>([]);
  const [room, setRoom] = useState("");
  const [customName, setCustomName] = useState("");
  const [priority, setPriority] = useState(""); // NEW: Device priority
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
    setCustomName("");
    setPriority("");
  };

  const handleSearch = async () => {
    if (!brand.trim()) {
      setError("Please enter a brand name");
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      // Search local Energy Star database
      const results = await energyStarService.searchDevices({
        deviceType,
        brand: brand.trim(),
        model: model.trim() || undefined,
      });

      if (results && results.length > 0) {
        setSearchResults(results);
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

  const handleSelectDevice = (device: DeviceSpec) => {
    setSelectedDevice(device);
  };

  const handleAddDevice = async () => {
    if (!selectedDevice) return;
    // Track that we came from results, then move to survey
    setPreviousStage("results");
    setStage("survey");
  };

  const toggleUsageTime = (time: string) => {
    setUsageTimes(prev =>
      prev.includes(time)
        ? prev.filter(t => t !== time)
        : [...prev, time]
    );
  };

  const handleCompleteSurvey = () => {
    if (!selectedDevice || !frequency || !hoursPerDay || usageTimes.length === 0 || !customName.trim() || !priority) return;

    setIsSubmittingSurvey(true);
    try {
      // Create device object with survey data
      const deviceData = {
        id: `dev_${Date.now()}_${Math.random()}`,
        customName: customName.trim(),
        originalName: selectedDevice.productName,
        deviceType: deviceType || selectedDevice.category,
        brand: selectedDevice.brand,
        modelNumber: selectedDevice.modelNumber,
        wattage: selectedDevice.powerRating || selectedDevice.additionalSpecs?.powerRatingW || 0,
        priority: priority,
        survey: {
          frequency,
          hoursPerDay: parseFloat(hoursPerDay),
          usageTimes,
          room: room || "Unassigned",
        },
      };

      onAdd(deviceData, deviceData.id);
      resetModal();
      onClose();
    } catch (error) {
      console.error("Error adding device:", error);
      setError("Failed to save device. Please try again.");
    } finally {
      setIsSubmittingSurvey(false);
    }
  };

  const frequencyOptions = [
    { value: "daily", label: "Daily" },
    { value: "frequently", label: "Frequently" },
    { value: "weekends", label: "Weekends" },
    { value: "rarely", label: "Rarely" },
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

  const isSurveyValid = frequency && hoursPerDay && usageTimes.length > 0 && customName.trim() && priority;

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
            <div className="px-6 pt-6 pb-4 mb-2 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-xl tracking-tight">
                  {stage === "form" ? "Add Device" :
                    stage === "results" ? "Select Device" :
                      stage === "survey" ? "Device Usage" :
                        "Add Devices"}
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
                            className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 shadow-lg hover:shadow-xl transition-all ${isSelected
                              ? "border-black bg-black text-white"
                              : "border-white/60 bg-white/40 hover:bg-white/50"
                              }`}
                          >
                            <Icon className="w-5 h-5" strokeWidth={1.5} />
                            <span className="text-sm">{type.label}</span>
                          </button>
                        );
                      })}

                      {/* Others - Manual Entry */}
                      <button
                        onClick={() => setStage("manual")}
                        className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 shadow-lg hover:shadow-xl transition-all border-white/60 bg-white/40 hover:bg-white/50"
                      >
                        <PlusCircle className="w-5 h-5" strokeWidth={1.5} />
                        <span className="text-sm">Others</span>
                      </button>
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
                      className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-white/60 rounded-2xl text-sm shadow-lg focus:outline-none focus:border-black/30 transition-colors"
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

                  <button
                    onClick={() => setStage("manual")}
                    className="w-full py-3.5 bg-white/60 backdrop-blur-xl border border-white/60 text-black rounded-full text-sm tracking-wide hover:bg-white/70 transition-colors mt-3 shadow-lg"
                  >
                    Add Device Manually
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

                    {/* Hint text */}
                    <p className="text-xs text-black/50 text-center mt-6">
                      Couldn't find your device?<br />
                      Try adding manually
                    </p>
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
                    {isAdding ? "Adding Device..." : "Select Device"}
                  </motion.button>
                </div>
              </>
            )}

            {/* Manual Entry Stage */}
            {stage === "manual" && (
              <>
                <div className="px-6 flex-1 overflow-y-auto scrollbar-hide pb-6" style={{ minHeight: 0 }}>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    {/* Device Type Input */}
                    <div>
                      <label className="block text-xs text-black/60 mb-2 tracking-wide">
                        Device Type
                      </label>
                      <input
                        type="text"
                        value={deviceType.replace("_", " ")}
                        onChange={(e) => setDeviceType(e.target.value.replace(" ", "_"))}
                        placeholder="e.g., Air Conditioner"
                        className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-white/60 rounded-xl text-sm shadow-lg focus:outline-none focus:border-black/30"
                      />
                    </div>

                    {/* Wattage */}
                    <div>
                      <label className="block text-xs text-black/60 mb-2 tracking-wide">
                        Power Rating (Watts)
                      </label>
                      <input
                        type="number"
                        value={manualWattage}
                        onChange={(e) => setManualWattage(e.target.value)}
                        placeholder="e.g., 2000"
                        min="0"
                        className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-white/60 rounded-xl text-sm shadow-lg focus:outline-none focus:border-black/30"
                      />
                      <p className="text-xs text-black/40 pt-3">Check the device label or manual</p>
                    </div>

                    {/* Brand */}
                    <div>
                      <label className="block text-xs text-black/60 mb-2 tracking-wide">
                        Brand (Optional)
                      </label>
                      <input
                        type="text"
                        value={manualBrand}
                        onChange={(e) => setManualBrand(e.target.value)}
                        placeholder="e.g., Samsung"
                        className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-white/60 rounded-xl text-sm shadow-lg focus:outline-none focus:border-black/30"
                      />
                    </div>

                    {/* Model */}
                    <div>
                      <label className="block text-xs text-black/60 mb-2 tracking-wide">
                        Model Number (Optional)
                      </label>
                      <input
                        type="text"
                        value={manualModel}
                        onChange={(e) => setManualModel(e.target.value)}
                        placeholder="e.g., AR24TXHQABU"
                        className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-white/60 rounded-xl text-sm shadow-lg focus:outline-none focus:border-black/30"
                      />
                    </div>
                  </motion.div>
                </div>

                <div className="px-6 py-4 flex-shrink-0 flex gap-3">
                  <button
                    onClick={() => setStage("form")}
                    className="flex-1 py-3.5 bg-white/60 backdrop-blur-xl border border-white/60 text-black rounded-full text-sm tracking-wide hover:bg-white/70 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => {
                      // Create a manual device object
                      setSelectedDevice({
                        brand: manualBrand || "Unknown",
                        modelNumber: manualModel || "Manual Entry",
                        productName: deviceType.replace("_", " "), // Use device type as product name
                        category: deviceType,
                        additionalSpecs: {
                          powerRatingW: parseInt(manualWattage) || 0,
                        },
                      });
                      // Track that we came from manual entry
                      setPreviousStage("manual");
                      setStage("survey");
                    }}
                    disabled={!manualWattage}
                    className="flex-1 bg-black text-white py-3.5 rounded-full text-sm tracking-wide hover:bg-black/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Proceed
                  </button>
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
                    {/* Device Name */}
                    <div>
                      <label className="block text-xs text-black/60 pt-6 mb-2 tracking-wide">
                        Device Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        placeholder="e.g., Living Room TV, Master Bedroom AC"
                        className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-white/60 rounded-xl text-sm shadow-lg focus:outline-none focus:border-black/30"
                      />
                    </div>

                    {/* Frequency */}
                    <div>
                      <label className="block text-xs text-black/60 mb-2 tracking-wide">
                        How often do you use this device?
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {frequencyOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => setFrequency(option.value)}
                            className={`p-3 rounded-xl text-xs shadow-lg hover:shadow-xl transition-all border ${frequency === option.value
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
                        placeholder="e.g., 8(hours), 0.2(20 minutes)"
                        className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-white/60 rounded-xl text-sm shadow-lg focus:outline-none focus:border-black/30"
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
                              className={`p-3 rounded-xl text-xs flex items-center justify-between shadow-lg hover:shadow-xl transition-all border ${isSelected
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
                        Location (Optional)
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {roomOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => setRoom(option.value)}
                            className={`p-3 rounded-xl text-xs shadow-lg hover:shadow-xl transition-all border ${room === option.value
                              ? "bg-black text-white border-black"
                              : "bg-white/40 border-white/60 hover:bg-white/50"
                              }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Device Priority - Slider (0-5) */}
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
                          className="w-full h-2 rounded-full appearance-none cursor-pointer
                                     [&::-webkit-slider-runnable-track]:bg-black/10
                                     [&::-webkit-slider-runnable-track]:rounded-full
                                     [&::-webkit-slider-runnable-track]:h-2
                                     [&::-webkit-slider-thumb]:appearance-none
                                     [&::-webkit-slider-thumb]:w-5
                                     [&::-webkit-slider-thumb]:h-5
                                     [&::-webkit-slider-thumb]:rounded-full
                                     [&::-webkit-slider-thumb]:bg-black
                                     [&::-webkit-slider-thumb]:cursor-pointer
                                     [&::-webkit-slider-thumb]:shadow-lg
                                     [&::-webkit-slider-thumb]:-mt-1.5
                                     [&::-moz-range-track]:bg-black/10
                                     [&::-moz-range-track]:rounded-full
                                     [&::-moz-range-track]:h-2
                                     [&::-moz-range-track]:border-0
                                     [&::-moz-range-thumb]:w-5
                                     [&::-moz-range-thumb]:h-5
                                     [&::-moz-range-thumb]:rounded-full
                                     [&::-moz-range-thumb]:bg-black
                                     [&::-moz-range-thumb]:cursor-pointer
                                     [&::-moz-range-thumb]:border-0
                                     [&::-moz-range-thumb]:shadow-lg"
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
                      <p className="text-xs text-black/40 pt-3">
                        How well you use this device
                      </p>
                    </div>
                  </motion.div>
                </div>

                <div className="px-6 py-4 flex-shrink-0 flex gap-3">
                  <button
                    onClick={() => setStage(previousStage || "results")}
                    className="flex-1 py-3.5 bg-white/60 backdrop-blur-xl border border-white/60 text-black rounded-full text-sm tracking-wide hover:bg-white/70 transition-colors"
                  >
                    Back
                  </button>
                  <motion.button
                    onClick={handleCompleteSurvey}
                    disabled={!isSurveyValid || isSubmittingSurvey}
                    className="flex-1 bg-black text-white py-3.5 rounded-full text-sm tracking-wide hover:bg-black/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    whileTap={{ scale: 0.98 }}
                  >
                    {isSubmittingSurvey ? "Adding..." : "Add Device"}
                  </motion.button>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
