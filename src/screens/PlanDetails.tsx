import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, TrendingDown, Wind, Droplets, Bell, CloudRain, Sun, Cloud, X, Tv, Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Calendar } from "../components/ui/calendar";
import BottomNav from "../components/BottomNav";
import notificationService from "../services/notification.service";

const planData = {
    "1": {
        name: "Cost Saver",
        description: "Minimize energy bills with optimized schedules",
        savings: "$28.50",
        efficiency: "18%",
        devices: ["Living Room AC", "Bedroom Dehumidifier"],
        schedule: "Peak hours: AC off, Dehumidifier on low. Off-peak: Normal operation.",
        alerts: [
            "AC exceeds 6 hours daily usage",
            "Temperature drops below 72°F",
            "Dehumidifier runs more than 10 hours",
        ],
    },
    "2": {
        name: "Eco Mode",
        description: "Reduce environmental impact while staying comfortable",
        savings: "$22.30",
        efficiency: "24%",
        devices: ["Living Room AC", "Bedroom Dehumidifier"],
        schedule: "Eco-friendly settings prioritizing renewable energy hours.",
        alerts: [
            "High energy consumption detected",
            "Better weather conditions available",
            "Device running during peak carbon hours",
        ],
    },
    "3": {
        name: "Comfort Balance",
        description: "Perfect balance between cost and comfort",
        savings: "$18.00",
        efficiency: "12%",
        devices: ["Living Room AC"],
        schedule: "Optimized temperature settings based on occupancy patterns.",
        alerts: [
            "Room unoccupied for 2+ hours",
            "Temperature deviation detected",
            "Suggested schedule adjustment available",
        ],
    },
};

// Mock data for daily device usage
const generateDailyUsage = (date: Date, planId: string) => {
    const dayOfMonth = date.getDate();
    const weatherConditions = ['Sunny', 'Partly Cloudy', 'Rainy', 'Cloudy'];
    const weatherIcons = { 'Sunny': Sun, 'Partly Cloudy': Cloud, 'Rainy': CloudRain, 'Cloudy': Cloud };
    const weather = weatherConditions[dayOfMonth % 4];

    const devices = planId === "1"
        ? [
            { name: "Living Room AC", priority: "High", useTime: weather === 'Sunny' ? "8.5 hrs" : weather === 'Rainy' ? "2.0 hrs" : "5.5 hrs" },
            { name: "Bedroom Dehumidifier", priority: "Medium", useTime: weather === 'Rainy' ? "12.0 hrs" : weather === 'Sunny' ? "3.0 hrs" : "7.0 hrs" },
            { name: "Smart TV", priority: "Low", useTime: weather === 'Sunny' ? "4.0 hrs" : weather === 'Rainy' ? "6.5 hrs" : "5.0 hrs" },
            { name: "LED Lighting", priority: "Medium", useTime: weather === 'Sunny' ? "2.5 hrs" : weather === 'Rainy' ? "8.0 hrs" : "5.5 hrs" },
        ]
        : planId === "2"
            ? [
                { name: "Living Room AC", priority: "Medium", useTime: weather === 'Sunny' ? "6.0 hrs" : weather === 'Rainy' ? "1.5 hrs" : "4.0 hrs" },
                { name: "Bedroom Dehumidifier", priority: "High", useTime: weather === 'Rainy' ? "10.0 hrs" : weather === 'Sunny' ? "4.0 hrs" : "8.0 hrs" },
                { name: "Smart TV", priority: "Low", useTime: weather === 'Sunny' ? "3.5 hrs" : weather === 'Rainy' ? "7.0 hrs" : "4.5 hrs" },
                { name: "LED Lighting", priority: "Low", useTime: weather === 'Sunny' ? "2.0 hrs" : weather === 'Rainy' ? "7.5 hrs" : "5.0 hrs" },
            ]
            : [
                { name: "Living Room AC", priority: "High", useTime: weather === 'Sunny' ? "10.0 hrs" : weather === 'Rainy' ? "3.0 hrs" : "7.0 hrs" },
                { name: "Bedroom Dehumidifier", priority: "Medium", useTime: weather === 'Rainy' ? "11.0 hrs" : weather === 'Sunny' ? "3.5 hrs" : "7.5 hrs" },
                { name: "Smart TV", priority: "Medium", useTime: weather === 'Sunny' ? "4.5 hrs" : weather === 'Rainy' ? "6.0 hrs" : "5.0 hrs" },
                { name: "LED Lighting", priority: "High", useTime: weather === 'Sunny' ? "3.0 hrs" : weather === 'Rainy' ? "8.5 hrs" : "6.0 hrs" },
            ];

    const totalHours = devices.reduce((sum, d) => sum + parseFloat(d.useTime), 0);
    const estimatedCost = (totalHours * 0.15).toFixed(2);

    return {
        weather,
        weatherIcon: weatherIcons[weather as keyof typeof weatherIcons],
        devices,
        summary: {
            totalHours: totalHours.toFixed(1),
            estimatedCost: `$${estimatedCost}`,
            peakUsage: weather === 'Sunny' ? "2pm - 6pm" : weather === 'Rainy' ? "All day" : "12pm - 4pm",
        }
    };
};

export default function PlanDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [selected, setSelected] = useState(false);
    const [showNotification, setShowNotification] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [showModal, setShowModal] = useState(false);

    const plan = planData[id as keyof typeof planData];

    if (!plan) {
        return null;
    }

    const handleSelect = async () => {
        setSelected(true);
        setShowNotification(true);

        // Save active plan to localStorage
        const activePlan = {
            id,
            name: plan.name,
            savings: plan.savings,
            status: "active",
            type: id === "1" ? "cost" : id === "2" ? "eco" : "balance",
        };
        localStorage.setItem("activePlan", JSON.stringify(activePlan));

        // Send plan activation notification
        const savingsAmount = parseFloat(plan.savings.replace('$', ''));
        await notificationService.sendPlanSelectedNotification(
            plan.name,
            activePlan.type as 'cost' | 'eco' | 'balance',
            savingsAmount
        );

        setTimeout(() => {
            setShowNotification(false);
            // Navigate back to dashboard after activation
            setTimeout(() => {
                navigate("/dashboard");
            }, 500);
        }, 3000);
    };

    const handleDateSelect = (date: Date | undefined) => {
        if (date) {
            setSelectedDate(date);
            setShowModal(true);
        }
    };

    const dailyUsage = selectedDate ? generateDailyUsage(selectedDate, id || "1") : null;
    const WeatherIcon = dailyUsage?.weatherIcon || Sun;

    // Lock body scroll when modal is open
    useEffect(() => {
        if (showModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [showModal]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-20 overflow-y-auto scrollbar-hide">
            <AnimatePresence>
                {showNotification && (
                    <motion.div
                        className="fixed top-6 left-5 right-5 bg-black/90 backdrop-blur-xl text-white px-5 py-4 rounded-2xl z-50 flex items-center gap-3 shadow-2xl border border-white/10"
                        initial={{ y: -100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -100, opacity: 0 }}
                        transition={{ type: "spring", damping: 20 }}
                    >
                        <Bell className="w-5 h-5" strokeWidth={1.5} />
                        <div className="flex-1">
                            <div className="text-sm mb-0.5">Plan Activated</div>
                            <div className="text-xs text-white/70">
                                {plan.name} is now managing your devices
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="px-5 pt-6 pb-6 bg-white/40 backdrop-blur-xl border-b border-white/60">
                <button
                    onClick={() => navigate("/plans")}
                    className="w-10 h-10 rounded-full border border-black/10 flex items-center justify-center mb-6 hover:border-black/20 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
                </button>

                <div className="flex items-start gap-4">
                    <div className="w-16 h-16 border border-black/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <TrendingDown className="w-7 h-7" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1">
                        <h1 className="text-2xl mb-2 tracking-tight">{plan.name}</h1>
                        <p className="text-sm text-black/60 leading-relaxed">
                            {plan.description}
                        </p>
                    </div>
                </div>
            </div>

            <div className="px-5 py-6 space-y-6">
                <div className="grid grid-cols-2 gap-3">
                    <motion.div
                        className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-2xl p-4 shadow-lg"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <div className="text-2xl mb-1">{plan.savings}</div>
                        <div className="text-xs text-black/50">Monthly Savings</div>
                    </motion.div>

                    <motion.div
                        className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-2xl p-4 shadow-lg"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                    >
                        <div className="text-2xl mb-1">+{plan.efficiency}</div>
                        <div className="text-xs text-black/50">Efficiency Gain</div>
                    </motion.div>
                </div>

                <div>
                    <h2 className="text-xs tracking-wide text-black/60 mb-3">DEVICES INCLUDED</h2>
                    <div className="space-y-2">
                        {plan.devices.map((device, index) => (
                            <motion.div
                                key={index}
                                className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-2xl p-4 flex items-center gap-3 shadow-lg"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 + index * 0.05 }}
                            >
                                <div className="w-10 h-10 bg-white/50 backdrop-blur-sm border border-white/60 rounded-xl flex items-center justify-center flex-shrink-0">
                                    {index === 0 ? (
                                        <Wind className="w-5 h-5" strokeWidth={1.5} />
                                    ) : (
                                        <Droplets className="w-5 h-5" strokeWidth={1.5} />
                                    )}
                                </div>
                                <span className="text-sm">{device}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>

                <div>
                    <h2 className="text-xs tracking-wide text-black/60 mb-3">DAILY USAGE PATTERN</h2>
                    <motion.div
                        className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-2xl p-5 shadow-lg"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={handleDateSelect}
                            className="w-full"
                            classNames={{
                                months: "flex flex-col w-full",
                                month: "w-full",
                                caption: "flex justify-center pt-1 relative items-center w-full mb-4",
                                caption_label: "text-sm",
                                nav: "flex items-center gap-1",
                                table: "w-full border-collapse",
                                head_row: "flex w-full",
                                head_cell: "text-black/50 rounded-md w-full text-xs",
                                row: "flex w-full mt-2",
                                cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 flex-1",
                                day: "h-9 w-full p-0 hover:bg-black/5 rounded-lg transition-colors",
                                day_selected: "bg-black/10 text-black hover:bg-black/10 hover:text-black",
                                day_today: "bg-black text-white border border-black",
                                day_outside: "text-black/30",
                            }}
                        />
                        <p className="text-xs text-black/50 text-center mt-4">
                            Tap a date to view usage plan
                        </p>
                    </motion.div>
                </div>

                <div>
                    <h2 className="text-xs tracking-wide text-black/60 mb-3">SMART ALERTS</h2>
                    <div className="space-y-2">
                        {plan.alerts.map((alert, index) => (
                            <motion.div
                                key={index}
                                className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-2xl p-4 flex items-start gap-3 shadow-lg"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.35 + index * 0.05 }}
                            >
                                <Bell className="w-4 h-4 mt-0.5 flex-shrink-0 text-black/60" strokeWidth={1.5} />
                                <span className="text-sm leading-relaxed">{alert}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="px-5 pb-6">
                <button
                    onClick={handleSelect}
                    disabled={selected}
                    className="w-full py-3.5 bg-black text-white rounded-full text-sm tracking-wide hover:bg-black/90 transition-colors disabled:opacity-50"
                >
                    {selected ? "Plan Selected ✓" : "Select This Plan"}
                </button>
            </div>

            <BottomNav active="plans" />

            {/* Daily Usage Modal */}
            <AnimatePresence>
                {showModal && (
                    <>
                        <motion.div
                            className="fixed inset-0 bg-black/20 z-40"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowModal(false)}
                        />
                        <motion.div
                            className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-2xl rounded-t-3xl z-50 border-t border-white/60 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] flex flex-col max-h-[80vh]"
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        >
                            <div className="flex items-center justify-between px-6 pt-6 pb-6 flex-shrink-0">
                                <h2 className="text-xl tracking-tight">
                                    {selectedDate?.toLocaleDateString('en-US', {
                                        weekday: 'long',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </h2>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="w-8 h-8 rounded-full border border-black/10 flex items-center justify-center hover:border-black/20 transition-colors"
                                >
                                    <X className="w-4 h-4" strokeWidth={1.5} />
                                </button>
                            </div>

                            <div className="px-6 pb-6 space-y-4 flex-shrink-0">
                                {/* Weather Info */}
                                <div className="flex items-center gap-3 bg-white/60 backdrop-blur-xl border border-white/60 rounded-2xl p-4 shadow-lg">
                                    <div className="w-10 h-10 bg-white/50 backdrop-blur-sm border border-white/60 rounded-xl flex items-center justify-center">
                                        <WeatherIcon className="w-5 h-5" strokeWidth={1.5} />
                                    </div>
                                    <div>
                                        <div className="text-sm">{dailyUsage?.weather}</div>
                                        <div className="text-xs text-black/50">Estimated Weather</div>
                                    </div>
                                </div>

                                {/* Summary Stats */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-2xl p-4 shadow-lg">
                                        <div className="text-xl mb-1">{dailyUsage?.summary.totalHours} hrs</div>
                                        <div className="text-xs text-black/50">Total Usage</div>
                                    </div>
                                    <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-2xl p-4 shadow-lg">
                                        <div className="text-xl mb-1">{dailyUsage?.summary.estimatedCost}</div>
                                        <div className="text-xs text-black/50">Estimated Cost</div>
                                    </div>
                                </div>

                                {/* Peak Usage */}
                                <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-2xl p-4 shadow-lg">
                                    <div className="text-xs text-black/50 mb-1">Peak Usage Period</div>
                                    <div className="text-sm">{dailyUsage?.summary.peakUsage}</div>
                                </div>

                                {/* Devices Section Header */}
                                <h3 className="text-xs tracking-wide text-black/60">DEVICES & USAGE</h3>
                            </div>

                            {/* Scrollable Devices List */}
                            <div className="px-6 pb-6 flex-1 overflow-y-auto scrollbar-hide">
                                <div className="space-y-2">
                                    {dailyUsage?.devices.map((device, index) => {
                                        const getDeviceIcon = () => {
                                            if (device.name.includes('AC')) return <Wind className="w-5 h-5" strokeWidth={1.5} />;
                                            if (device.name.includes('Dehumidifier')) return <Droplets className="w-5 h-5" strokeWidth={1.5} />;
                                            if (device.name.includes('TV')) return <Tv className="w-5 h-5" strokeWidth={1.5} />;
                                            if (device.name.includes('Lighting')) return <Lightbulb className="w-5 h-5" strokeWidth={1.5} />;
                                            return <Wind className="w-5 h-5" strokeWidth={1.5} />;
                                        };

                                        return (
                                            <div
                                                key={index}
                                                className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-2xl p-4 shadow-lg"
                                            >
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="w-10 h-10 bg-white/50 backdrop-blur-sm border border-white/60 rounded-xl flex items-center justify-center flex-shrink-0">
                                                        {getDeviceIcon()}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="text-sm mb-0.5">{device.name}</div>
                                                        <div className="text-xs text-black/50">
                                                            Priority: <span className={device.priority === 'High' ? 'text-black' : ''}>{device.priority}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center pt-2">
                                                    <span className="text-xs text-black/50">Calculated Use Time</span>
                                                    <span className="text-sm">{device.useTime}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}