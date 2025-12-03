import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { motion } from "motion/react";
import { Check } from "lucide-react";
import { submitSurvey } from "../utils/api";

interface SurveyQuestion {
    question: string;
    type: string;
    options?: any[];
    min?: number;
    max?: number;
}

export default function UsageSurvey() {
    const navigate = useNavigate();
    const location = useLocation();
    const device = location.state?.device;

    const [frequency, setFrequency] = useState("");
    const [hoursPerDay, setHoursPerDay] = useState("");
    const [usageTimes, setUsageTimes] = useState<string[]>([]);
    const [room, setRoom] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!device) {
        // Redirect if no device data
        navigate("/dashboard");
        return null;
    }

    const frequencyOptions = [
        { value: "daily", label: "Daily" },
        { value: "few_times_per_week", label: "Few times per week" },
        { value: "rarely", label: "Rarely" },
        { value: "seasonal", label: "Seasonal" },
    ];

    const timeOptions = [
        { value: "morning", label: "Morning (6am - 12pm)" },
        { value: "afternoon", label: "Afternoon (12pm - 6pm)" },
        { value: "evening", label: "Evening (6pm - 12am)" },
        { value: "night", label: "Night (12am - 6am)" },
    ];

    const roomOptions = [
        { value: "living_room", label: "Living Room" },
        { value: "bedroom", label: "Bedroom" },
        { value: "kitchen", label: "Kitchen" },
        { value: "dining_room", label: "Dining Room" },
        { value: "bathroom", label: "Bathroom" },
        { value: "office", label: "Office" },
        { value: "garage", label: "Garage" },
        { value: "outdoor", label: "Outdoor" },
        { value: "other", label: "Other" },
    ];

    const toggleUsageTime = (time: string) => {
        setUsageTimes(prev =>
            prev.includes(time)
                ? prev.filter(t => t !== time)
                : [...prev, time]
        );
    };

    const handleSubmit = async () => {
        if (!frequency || !hoursPerDay || usageTimes.length === 0 || !room) {
            return;
        }

        setIsSubmitting(true);
        try {
            await submitSurvey(device.id, {
                frequency,
                hoursPerDay: parseFloat(hoursPerDay),
                usageTimes,
                room,
            });

            // Navigate to dashboard
            navigate("/dashboard");
        } catch (error) {
            console.error("Failed to submit survey:", error);
            setIsSubmitting(false);
        }
    };

    const isFormValid = frequency && hoursPerDay && usageTimes.length > 0 && room;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-32 overflow-y-auto scrollbar-hide">
            <div className="px-5 pt-8 pb-6">
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="text-2xl mb-2 tracking-tight font-semibold">Device Usage</h1>
                    <p className="text-sm text-black/60">
                        Help us understand how you use this device
                    </p>
                </motion.div>
            </div>

            <div className="px-5 space-y-6">
                {/* Device Info */}
                <motion.div
                    className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-3xl p-5 shadow-lg"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <p className="text-xs tracking-wide text-black/60 mb-1">DEVICE</p>
                    <p className="text-sm font-medium">{device.name}</p>
                    <p className="text-xs text-black/50 mt-1">{device.power}W</p>
                </motion.div>

                {/* Frequency Question */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                >
                    <label className="block text-xs text-black/60 mb-3 tracking-wide px-1">
                        HOW OFTEN DO YOU USE THIS DEVICE?
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {frequencyOptions.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => setFrequency(option.value)}
                                className={`p-4 rounded-2xl text-sm transition-all shadow-lg ${frequency === option.value
                                    ? "bg-black text-white"
                                    : "bg-white/40 hover:bg-white/50 text-black"
                                    }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Hours Per Day */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <label className="block text-xs text-black/60 mb-3 tracking-wide px-1">
                        AVERAGE HOURS PER DAY
                    </label>
                    <input
                        type="number"
                        value={hoursPerDay}
                        onChange={(e) => setHoursPerDay(e.target.value)}
                        placeholder="e.g., 8"
                        min="0"
                        max="24"
                        step="0.5"
                        className="w-full px-5 py-4 bg-white/50 backdrop-blur-sm border border-white/60 rounded-2xl text-sm focus:outline-none focus:border-black/30 transition-colors shadow-lg"
                    />
                    <p className="text-xs text-black/40 mt-2 px-1" style={{ marginTop: "5px" }}>Enter a number between 0 and 24</p>
                </motion.div>

                {/* Usage Times */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                >
                    <label className="block text-xs text-black/60 mb-3 tracking-wide px-1">
                        WHEN DO YOU TYPICALLY USE IT? (Select all that apply)
                    </label>
                    <div className="space-y-2">
                        {timeOptions.map((option) => {
                            const isSelected = usageTimes.includes(option.value);
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => toggleUsageTime(option.value)}
                                    className={`w-full p-4 rounded-2xl text-sm text-left flex items-center justify-between transition-all shadow-lg ${isSelected
                                        ? "bg-black text-white"
                                        : "bg-white/40 hover:bg-white/50 text-black"
                                        }`}
                                >
                                    <span>{option.label}</span>
                                    {isSelected && (
                                        <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center">
                                            <Check className="w-3 h-3 text-black" strokeWidth={3} />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Room Selection */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <label className="block text-xs text-black/60 mb-3 tracking-wide px-1">
                        WHICH ROOM IS THIS DEVICE IN?
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {roomOptions.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => setRoom(option.value)}
                                className={`p-4 rounded-2xl text-sm transition-all shadow-lg ${room === option.value
                                    ? "bg-black text-white"
                                    : "bg-white/40 hover:bg-white/50 text-black"
                                    }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </motion.div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 px-5 pb-6 bg-gradient-to-t from-gray-100 via-gray-100 to-transparent pt-6">
                <motion.button
                    onClick={handleSubmit}
                    disabled={!isFormValid || isSubmitting}
                    className="w-full py-3.5 bg-black text-white rounded-full text-sm tracking-wide hover:bg-black/90 transition-colors disabled:cursor-not-allowed"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: !isFormValid || isSubmitting ? 0.3 : 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    whileTap={{ scale: !isFormValid ? 1 : 0.98 }}
                >
                    {isSubmitting ? "Saving..." : "Complete Setup"}
                </motion.button>
            </div>
        </div>
    );
}
