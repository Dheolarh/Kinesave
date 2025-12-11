import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft } from "lucide-react";
import { getUserDevices, saveCompleteUserData } from "../utils/api";
import { getLocationFromStorage } from "../utils/location";

export default function AboutUser() {
    const navigate = useNavigate();
    const [householdSize, setHouseholdSize] = useState("");
    const [occupationType, setOccupationType] = useState("");
    const [homeType, setHomeType] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const handleContinue = async () => {
        setIsSaving(true);

        try {
            // Gather all data from different sources
            const location = getLocationFromStorage();
            const energyData = JSON.parse(localStorage.getItem("energyData") || "{}");
            const devices = await getUserDevices();

            // Create consolidated user data structure
            const completeUserData = {
                location: {
                    city: location?.city || "",
                    region: location?.region || "",
                    country: location?.country || "",
                    latitude: (location as any)?.latitude || 0,
                    longitude: (location as any)?.longitude || 0,
                    temperature: location?.temperature || 0,
                    weatherDescription: location?.weatherDescription || "",
                },
                energyCosts: {
                    monthlyCost: energyData.monthlyCost || 0,
                    pricePerKwh: energyData.pricePerKwh || 0,
                    powerHoursPerDay: energyData.powerHoursPerDay || 8,
                    availableKwhPerMonth: energyData.availableKwhPerMonth || 0,
                    currency: energyData.currency || "NGN",
                    currencySymbol: energyData.currencySymbol || "₦",
                },
                devices: devices.devices.map((device: any) => ({
                    customName: device.customName,
                    originalName: device.productName,
                    deviceType: device.deviceType,
                    brand: device.brand,
                    modelNumber: device.modelNumber,
                    wattage: device.energyStarSpecs?.powerRatingW || device.power || 0,
                    priority: device.priority || "important",
                    survey: {
                        frequency: device.survey?.frequency || "daily",
                        hoursPerDay: device.survey?.hoursPerDay || 0,
                        usageTimes: device.survey?.usageTimes || [],
                        room: device.room || "Unassigned",
                    },
                    energyStarRating: device.energyStarSpecs?.energyStarRating || "",
                    annualEnergyUse: device.energyStarSpecs?.annualEnergyUse || 0,
                })),
                aboutUser: {
                    householdSize: parseInt(householdSize),
                    occupationType,
                    homeType,
                },
                savedAt: new Date().toISOString(),
            };

            // Save to backend
            await saveCompleteUserData(completeUserData);

            // Also save to localStorage as backup
            localStorage.setItem("userData", JSON.stringify({
                householdSize: parseInt(householdSize),
                occupationType,
                homeType,
            }));

            // Navigate to dashboard
            navigate("/dashboard");
        } catch (error) {
            console.error("Error saving user data:", error);
            alert("Failed to save user data. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const isFormValid = householdSize && occupationType && homeType;

    const occupationTypes = [
        { value: "employed", label: "Employed" },
        { value: "student", label: "Student" },
        { value: "self_employed", label: "Self-employed" },
        { value: "stay_at_home", label: "Stay at home" },
        { value: "retired", label: "Retired" },
    ];

    const homeTypes = [
        { value: "apartment", label: "Apartment" },
        { value: "house", label: "House" },
        { value: "duplex", label: "Duplex" },
        { value: "bungalow", label: "Bungalow" },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-32 overflow-y-auto scrollbar-hide">
            <div className="px-5 pt-8 pb-6">
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <button
                        onClick={() => navigate("/setup")}
                        className="w-10 h-10 rounded-full border border-black/10 flex items-center justify-center mb-6 hover:border-black/20 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
                    </button>
                    <h1 className="text-2xl mb-2 tracking-tight font-semibold">About You</h1>
                    <p className="text-sm text-black/60 pt-3">
                        Help us personalize your energy recommendations
                    </p>
                </motion.div>
            </div>

            <div className="px-5 space-y-6">
                {/* Household Size */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <label className="block text-xs text-black/60 mb-3 tracking-wide px-1">
                        HOUSEHOLD SIZE
                    </label>
                    <input
                        type="number"
                        min="1"
                        value={householdSize}
                        onChange={(e) => setHouseholdSize(e.target.value)}
                        onBlur={() => {
                            if (parseInt(householdSize) < 1) setHouseholdSize("1");
                        }}
                        placeholder="e.g., 4"
                        required
                        className="w-full px-4 py-4 bg-white/50 backdrop-blur-sm border border-white/60 rounded-2xl text-sm focus:outline-none focus:border-black/30 transition-colors shadow-lg"
                    />
                    <p className="text-xs text-black/40 mt-2 px-1 pt-3">
                        How many people live in your household?
                    </p>
                </motion.div>

                {/* Occupation Type */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                >
                    <label className="block text-xs text-black/60 mb-3 tracking-wide px-1">
                        PRIMARY OCCUPATION
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {occupationTypes.map((type) => (
                            <button
                                key={type.value}
                                onClick={() => setOccupationType(type.value)}
                                className={`p-3 rounded-xl text-xs shadow-lg hover:shadow-xl transition-all border ${occupationType === type.value
                                    ? "bg-black text-white border-black"
                                    : "bg-white/40 border-white/60 hover:bg-white/50"
                                    }`}
                            >
                                {type.label}
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-black/40 mt-2 px-1 pt-3">
                        This helps us understand your daily schedule
                    </p>
                </motion.div>

                {/* Home Type */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <label className="block text-xs text-black/60 mb-3 tracking-wide px-1">
                        HOME TYPE
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {homeTypes.map((type) => (
                            <button
                                key={type.value}
                                onClick={() => setHomeType(type.value)}
                                className={`p-3 rounded-xl text-xs shadow-lg hover:shadow-xl transition-all border ${homeType === type.value
                                    ? "bg-black text-white border-black"
                                    : "bg-white/40 border-white/60 hover:bg-white/50"
                                    }`}
                            >
                                {type.label}
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-black/40 mt-2 px-1 pt-3">
                        Type of residence you live in
                    </p>
                </motion.div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-white/60 p-5">
                <button
                    onClick={handleContinue}
                    disabled={!isFormValid || isSaving}
                    className="w-full py-3.5 bg-black text-white rounded-full text-sm tracking-wide hover:bg-black/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSaving ? "Saving..." : "Continue to Dashboard"}
                </button>
            </div>
        </div>
    );
}
