import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence, useMotionValue, useTransform } from "motion/react";
import { Trash2 } from "lucide-react";
import AddDeviceModal from "../components/AddDeviceModal";
import { getLocationFromStorage, type LocationData } from "../utils/location";

// Currency mapping based on country
const getCurrencyForCountry = (country: string): { symbol: string; code: string } => {
  const currencyMap: { [key: string]: { symbol: string; code: string } } = {
    // Africa
    "Nigeria": { symbol: "₦", code: "NGN" },
    "South Africa": { symbol: "R", code: "ZAR" },
    "Kenya": { symbol: "KSh", code: "KES" },
    "Ghana": { symbol: "₵", code: "GHS" },
    "Egypt": { symbol: "E£", code: "EGP" },
    "Morocco": { symbol: "MAD", code: "MAD" },
    "Ethiopia": { symbol: "Br", code: "ETB" },
    "Tanzania": { symbol: "TSh", code: "TZS" },
    "Uganda": { symbol: "USh", code: "UGX" },

    // Americas
    "United States": { symbol: "$", code: "USD" },
    "Canada": { symbol: "$", code: "CAD" },
    "Mexico": { symbol: "$", code: "MXN" },
    "Brazil": { symbol: "R$", code: "BRL" },
    "Argentina": { symbol: "$", code: "ARS" },
    "Chile": { symbol: "$", code: "CLP" },
    "Colombia": { symbol: "$", code: "COP" },

    // Europe
    "United Kingdom": { symbol: "£", code: "GBP" },
    "Germany": { symbol: "€", code: "EUR" },
    "France": { symbol: "€", code: "EUR" },
    "Spain": { symbol: "€", code: "EUR" },
    "Italy": { symbol: "€", code: "EUR" },
    "Netherlands": { symbol: "€", code: "EUR" },
    "Belgium": { symbol: "€", code: "EUR" },
    "Portugal": { symbol: "€", code: "EUR" },
    "Greece": { symbol: "€", code: "EUR" },
    "Ireland": { symbol: "€", code: "EUR" },
    "Austria": { symbol: "€", code: "EUR" },
    "Switzerland": { symbol: "CHF", code: "CHF" },
    "Sweden": { symbol: "kr", code: "SEK" },
    "Norway": { symbol: "kr", code: "NOK" },
    "Denmark": { symbol: "kr", code: "DKK" },
    "Poland": { symbol: "zł", code: "PLN" },
    "Russia": { symbol: "₽", code: "RUB" },

    // Asia
    "India": { symbol: "₹", code: "INR" },
    "China": { symbol: "¥", code: "CNY" },
    "Japan": { symbol: "¥", code: "JPY" },
    "South Korea": { symbol: "₩", code: "KRW" },
    "Indonesia": { symbol: "Rp", code: "IDR" },
    "Thailand": { symbol: "฿", code: "THB" },
    "Vietnam": { symbol: "₫", code: "VND" },
    "Philippines": { symbol: "₱", code: "PHP" },
    "Malaysia": { symbol: "RM", code: "MYR" },
    "Singapore": { symbol: "$", code: "SGD" },
    "Pakistan": { symbol: "₨", code: "PKR" },
    "Bangladesh": { symbol: "৳", code: "BDT" },
    "Saudi Arabia": { symbol: "﷼", code: "SAR" },
    "United Arab Emirates": { symbol: "د.إ", code: "AED" },
    "Turkey": { symbol: "₺", code: "TRY" },

    // Oceania
    "Australia": { symbol: "$", code: "AUD" },
    "New Zealand": { symbol: "$", code: "NZD" },
  };

  return currencyMap[country] || { symbol: "$", code: "USD" }; // Default to USD
};

export default function EnergyCostSetup() {
  const navigate = useNavigate();
  const [monthlyCost, setMonthlyCost] = useState("");
  const [pricePerKwh, setPricePerKwh] = useState("");
  const [preferredBudget, setPreferredBudget] = useState("");
  const [powerHoursPerDay, setPowerHoursPerDay] = useState(24); // Default 8 hours
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [selectedDevices, setSelectedDevices] = useState<any[]>([]);
  const [locationData, setLocationData] = useState<LocationData | null>(null);

  // Load location data and set currency
  useEffect(() => {
    const location = getLocationFromStorage();
    if (location) {
      setLocationData(location);
    } else {
      // If no location, redirect back to location detection
      navigate("/location");
    }
  }, [navigate]);

  // Get currency based on detected country
  const currency = locationData
    ? getCurrencyForCountry(locationData.country)
    : { symbol: "$", code: "USD" };

  const locationDisplay = locationData
    ? `${locationData.city}${locationData.region ? `, ${locationData.region}` : ""}`
    : "Unknown Location";

  // Load saved data on mount
  useEffect(() => {
    const savedEnergyData = localStorage.getItem("energyData");
    const savedDevices = localStorage.getItem("userDevices");

    if (savedEnergyData) {
      const { monthlyCost, pricePerKwh, preferredBudget } = JSON.parse(savedEnergyData);
      setMonthlyCost(monthlyCost || "");
      setPricePerKwh(pricePerKwh || "");
      setPreferredBudget(preferredBudget || "");
    }

    if (savedDevices) {
      setSelectedDevices(JSON.parse(savedDevices));
    }
  }, []);

  const handleRemoveDevice = (indexToRemove: number) => {
    const updatedDevices = selectedDevices.filter((_, index) => index !== indexToRemove);
    setSelectedDevices(updatedDevices);
    localStorage.setItem("userDevices", JSON.stringify(updatedDevices));
  };

  const handleAddDevices = (device: any, deviceId?: string) => {
    // Check if device already exists to avoid duplicates
    if (selectedDevices.find(d => d.name === device.name)) {
      return;
    }

    // Map backend device to local format if needed
    // The backend device likely has productName, brand, etc.
    // EnergyCostSetup expects { name, power, ... }
    const newDevice = {
      ...device,
      name: device.productName || device.name, // Handle both formats
      customName: device.customName,
      power: device.additionalSpecs?.powerRatingW || device.power || 0,
      deviceId
    };

    const updatedDevices = [...selectedDevices, newDevice];
    setSelectedDevices(updatedDevices);

    // Save state to localStorage before navigating
    localStorage.setItem("userDevices", JSON.stringify(updatedDevices));
    localStorage.setItem("energyData", JSON.stringify({
      monthlyCost,
      pricePerKwh,
      preferredBudget,
      currency: currency.code,
      currencySymbol: currency.symbol,
      location: locationDisplay,
    }));
  };

  const handleProceed = async () => {
    // Calculate
    const monthlyPurchase = parseFloat(monthlyCost);
    const price = parseFloat(pricePerKwh);
    const availableKwhPerMonth = monthlyPurchase / price;

    // Prepare energy cost data
    const energyData = {
      monthlyCost: parseFloat(monthlyCost),
      pricePerKwh: parseFloat(pricePerKwh),
      preferredBudget: preferredBudget ? parseFloat(preferredBudget) : null,
      powerHoursPerDay: powerHoursPerDay,
      availableKwhPerMonth: availableKwhPerMonth,
      currency: currency.code,
      currencySymbol: currency.symbol,
    };

    // Prepare devices data
    const devicesData = selectedDevices.map(device => ({
      id: device.id || `dev_${Date.now()}_${Math.random()}`,
      customName: device.customName || device.productName,
      originalName: device.productName,
      deviceType: device.deviceType,
      brand: device.brand || "Unknown",
      modelNumber: device.modelNumber || "N/A",
      wattage: device.energyStarSpecs?.powerRatingW || device.power || 0,
      priority: device.priority || 0,
      survey: device.survey || {
        frequency: "daily",
        hoursPerDay: 0,
        usageTimes: [],
        room: device.room || "Unassigned",
      },
    }));

    try {
      // Save to backend JSON
      const { updateUserProfile } = await import("../utils/dataBrain");
      await updateUserProfile({
        energyCosts: energyData,
        devices: devicesData,
      });

      // Navigate to about user page
      navigate("/about-user");
    } catch (error) {
      console.error("Failed to save energy data:", error);
      alert("Failed to save data. Please try again.");
    }
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
          <p className="text-sm">{locationDisplay}</p>
          {locationData && (
            <p className="text-xs text-black/50 mt-1">
              {locationData.temperature}°C • {locationData.weatherDescription}
            </p>
          )}
        </motion.div>

        {/* Monthly Cost Input */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <label className="block text-xs text-black/60 mb-3 tracking-wide px-1">
            AVERAGE MONTHLY ELECTRICITY COST ({currency.symbol})
          </label>
          <div className="relative">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-black/40">
              {currency.symbol}
            </div>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={monthlyCost}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9.]/g, '');
                setMonthlyCost(value);
              }}
              onBlur={() => {
                if (monthlyCost && parseFloat(monthlyCost) < 0) setMonthlyCost("0");
              }}
              placeholder=""
              required
              className="w-full pl-10 pr-4 py-4 bg-white/50 backdrop-blur-sm border border-white/60 rounded-2xl text-sm focus:outline-none focus:border-black/30 transition-colors shadow-lg"
            />
          </div>
          {selectedDevices.length > 0 && !monthlyCost ? (
            <p className="text-xs mt-2 px-1" style={{ color: "red", marginTop: "5px" }}>This field cannot be empty</p>
          ) : (
            <p className="text-xs text-black/40 mt-2 px-1" style={{ marginTop: "5px" }}>Check your recent electricity bill</p>
          )}
        </motion.div>

        {/* Preferred Monthly Budget Input */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.175 }}
        >
          <label className="block text-xs text-black/60 mb-3 tracking-wide px-1">
            PREFERRED MONTHLY BUDGET ({currency.symbol})
          </label>
          <div className="relative">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-black/40">
              {currency.symbol}
            </div>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={preferredBudget}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9.]/g, '');
                setPreferredBudget(value);
              }}
              onBlur={() => {
                if (preferredBudget && parseFloat(preferredBudget) < 0) setPreferredBudget("0");
              }}
              placeholder=""
              className="w-full pl-10 pr-4 py-4 bg-white/50 backdrop-blur-sm border border-white/60 rounded-2xl text-sm focus:outline-none focus:border-black/30 transition-colors shadow-lg"
            />
          </div>
          <p className="text-xs text-black/40 mt-2 px-1" style={{ marginTop: "5px" }}>Maximum you want to spend monthly on electricity</p>
        </motion.div>

        {/* Price per kWh Input */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <label className="block text-xs text-black/60 mb-3 tracking-wide px-1">
            PRICE PER KILOWATT-HOUR ({currency.symbol}/kWh)
          </label>
          <div className="relative">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-black/40">
              {currency.symbol}
            </div>
            <input
              type="text"
              inputMode="decimal"
              pattern="[0-9.]*"
              value={pricePerKwh}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9.]/g, '');
                setPricePerKwh(value);
              }}
              onBlur={() => {
                if (pricePerKwh && parseFloat(pricePerKwh) < 0) setPricePerKwh("0");
              }}
              placeholder=""
              required
              className="w-full pl-10 pr-4 py-4 bg-white/50 backdrop-blur-sm border border-white/60 rounded-2xl text-sm focus:outline-none focus:border-black/30 transition-colors shadow-lg"
            />
          </div>
          {selectedDevices.length > 0 && !pricePerKwh ? (
            <p className="text-xs mt-2 px-1" style={{ color: "red", marginTop: "5px" }}>This field cannot be empty</p>
          ) : (
            <p className="text-xs text-black/40 mt-2 px-1" style={{ marginTop: "5px" }}>Found on your electricity bill (per kWh rate)</p>
          )}
        </motion.div>

        {/* Power Availability Input */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.225 }}
        >
          <label className="block text-xs text-black/60 mb-3 tracking-wide px-1">
            AVERAGE POWER HOURS PER DAY
          </label>
          <input
            type="number"
            min="0"
            max="24"
            step="1"
            value={powerHoursPerDay}
            onChange={(e) => setPowerHoursPerDay(parseInt(e.target.value) || 0)}
            onBlur={() => {
              if (powerHoursPerDay < 0) setPowerHoursPerDay(0);
              if (powerHoursPerDay > 24) setPowerHoursPerDay(24);
            }}
            placeholder=""
            required
            className="w-full px-4 py-4 bg-white/50 backdrop-blur-sm border border-white/60 rounded-2xl text-sm focus:outline-none focus:border-black/30 transition-colors shadow-lg"
          />
          <p className="text-xs text-black/40 mt-2 px-1" style={{ marginTop: "5px" }}>
            How many hours per day do you have electricity?
          </p>
        </motion.div>

        {/* Devices Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <label className="block text-xs text-black/60 mb-1 tracking-wide px-1">
            YOUR DEVICES
          </label>
          <p className="text-xs text-black/40 mb-3 px-1">
            Swipe a device right to remove it
          </p>

          {selectedDevices.length === 0 ? (
            <div className="bg-white/30 backdrop-blur-sm border border-white/60 rounded-2xl p-6 text-center">
              <p className="text-sm text-black/50">No devices added yet</p>
              <p className="text-xs text-black/40 mt-1">Scan to add your devices</p>
            </div>
          ) : (
            <div className="space-y-2 overflow-hidden">
              <AnimatePresence mode="popLayout">
                {selectedDevices.map((device, index) => (
                  <SwipeableDeviceItem
                    key={device.deviceId || device.name} // Use stable ID
                    device={device}
                    onRemove={() => handleRemoveDevice(index)}
                  />
                ))}
              </AnimatePresence>
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
            onClick={handleProceed}
            disabled={!isFormValid}
            className="w-full py-3.5 bg-black text-white rounded-full text-sm tracking-wide hover:bg-black/90 transition-colors disabled:cursor-not-allowed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: !isFormValid ? 0.3 : 1, y: 0 }}
            transition={{ delay: 0.35 }}
            whileTap={{ scale: !isFormValid ? 1 : 0.98 }}
          >
            Proceed
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

function SwipeableDeviceItem({ device, onRemove }: { device: any, onRemove: () => void }) {
  const x = useMotionValue(0);
  const opacity = useTransform(x, [0, 100], [1, 0]);
  const backgroundOpacity = useTransform(x, [0, 100], [0, 1]);

  return (
    <motion.div
      style={{ x, opacity }}
      drag="x"
      dragConstraints={{ left: 0, right: 1000 }} // Allow dragging right freely
      dragElastic={0.1} // Add some resistance
      onDragEnd={(_, info) => {
        if (info.offset.x > 100) {
          onRemove();
        }
      }}
      layout // Enable layout animations for siblings
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0, x: 0 }} // Reset x position
      exit={{ opacity: 0, x: 300, transition: { duration: 0.2 } }} // Smooth exit to right
      className="relative touch-pan-y"
    >
      {/* Background for swipe action */}
      <motion.div
        className="absolute inset-0 bg-red-500 rounded-2xl flex items-center justify-start pl-4"
        style={{ opacity: backgroundOpacity, zIndex: -1 }}
      >
        <Trash2 className="w-5 h-5 text-white" />
      </motion.div>

      <div className="bg-white/50 backdrop-blur-sm border border-white/60 rounded-2xl p-4 flex items-center justify-between relative z-10">
        <div>
          <p className="text-sm">{device.customName || device.name}</p>
          <p className="text-xs text-black/50">{device.customName ? device.name : `${device.power}W`}</p>
        </div>
        <div className="w-2 h-2 bg-green-500 rounded-full" />
      </div>
    </motion.div>
  );
}
