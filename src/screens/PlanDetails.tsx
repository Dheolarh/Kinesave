import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, TrendingDown, Sun, X, Cloud, CloudRain, CloudSnow, CloudDrizzle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Calendar } from "../components/ui/calendar";
import BottomNav from "../components/BottomNav";
import notificationService from "../services/notification.service";
import type { AIPlan } from "../types/ai-plan.types";
import { getDeviceIcon } from "../utils/device-types";
import { getUserData, getUserPlans, updateUserPlans } from "../utils/user-storage";

// Helper function to get weather icon based on condition
const getWeatherIcon = (condition: string) => {
    const cond = condition?.toLowerCase() || '';
    const iconClass = "w-4 h-4 text-black/60";
    const strokeWidth = 1.5;

    if (cond.includes('rain') || cond.includes('shower')) {
        return <CloudRain className={iconClass} strokeWidth={strokeWidth} />;
    } else if (cond.includes('snow') || cond.includes('sleet')) {
        return <CloudSnow className={iconClass} strokeWidth={strokeWidth} />;
    } else if (cond.includes('drizzle')) {
        return <CloudDrizzle className={iconClass} strokeWidth={strokeWidth} />;
    } else if (cond.includes('cloud') || cond.includes('overcast')) {
        return <Cloud className={iconClass} strokeWidth={strokeWidth} />;
    } else if (cond.includes('clear') || cond.includes('sunny')) {
        return <Sun className={iconClass} strokeWidth={strokeWidth} />;
    } else {
        return <Sun className={iconClass} strokeWidth={strokeWidth} />;
    }
};

export default function PlanDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [selected, setSelected] = useState(false);
    const [showNotification, setShowNotification] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [showModal, setShowModal] = useState(false);
    const [plan, setPlan] = useState<AIPlan | null>(null);
    const [loading, setLoading] = useState(true);
    const [deviceNames, setDeviceNames] = useState<Record<string, any>>({});
    const [currencySymbol, setCurrencySymbol] = useState('$');
    const [isActivePlan, setIsActivePlan] = useState(false);


    // Load AI plan and device names from new storage
    useEffect(() => {
        const loadPlan = () => {
            try {
                const plansData = getUserPlans();
                if (!plansData) {
                    navigate('/ai-analysis');
                    return;
                }

                let selectedPlan: AIPlan | null = null;
                let planType = '';

                // Map ID to plan type
                if (id === '1') {
                    selectedPlan = plansData.costSaver;
                    planType = 'cost';
                } else if (id === '2') {
                    selectedPlan = plansData.ecoMode;
                    planType = 'eco';
                } else if (id === '3') {
                    selectedPlan = plansData.comfortBalance;
                    planType = 'balance';
                }

                if (!selectedPlan) {
                    navigate('/plans');
                    return;
                }

                setPlan(selectedPlan);

                // Check if this is the active plan
                setIsActivePlan(plansData.activePlan === planType);

                // Load device names from new storage
                const userData = getUserData();
                if (userData?.devices) {
                    const devicesMap: Record<string, any> = {};
                    userData.devices.forEach((device: any) => {
                        devicesMap[device.id] = {
                            name: device.customName || device.originalName || device.name,
                            type: device.deviceType || device.type,
                            wattage: device.wattage,
                            hoursPerDay: device.survey?.hoursPerDay
                        };
                    });
                    setDeviceNames(devicesMap);
                    console.log('Loaded devices:', devicesMap);
                }

                // Load currency symbol
                if (userData?.energyCosts) {
                    setCurrencySymbol(userData.energyCosts.currencySymbol || '$');
                }
            } catch (error) {
                console.error('Failed to load plan:', error);
                navigate('/plans');
            } finally {
                setLoading(false);
            }
        };

        loadPlan();
    }, [id, navigate]);

    // Get metrics display based on plan type
    const getMetricsDisplay = () => {
        if (!plan) return { label1: "", value1: `${currencySymbol}0`, label2: "", value2: "0%" };

        const metrics = plan.metrics as any;
        const userData = getUserData(); // Added to access data.budget.averageMonthlyCost

        if (plan?.type === 'cost') {
            return {
                label1: "Initial Monthly Cost",
                value1: `${currencySymbol}${Math.trunc(userData?.energyCosts?.monthlyCost || 0)} `,
                label2: "Cost Saved",
                value2: `${currencySymbol}${Math.trunc(metrics.monthlySaving || 0)} `
            };
        } else if (plan.type === 'eco') {
            return {
                label1: "Eco Gain",
                value1: `${Math.trunc(metrics.ecoImprovementPercentage || 0)}% `,
                label2: "Monthly Cost",
                value2: `${currencySymbol}${Math.trunc(metrics.monthlyCostCap || 0)} `
            };
        } else {
            return {
                label1: "Actual Cost",
                value1: `${currencySymbol}${Math.trunc(metrics.actualMonthlyCost || 0)} `,
                label2: "Optimized Budget",
                value2: `${currencySymbol}${Math.trunc(metrics.optimizedBudget || 0)} `
            };
        }
    };

    // Find daily schedule for selected date
    const getDailySchedule = () => {
        if (!selectedDate || !plan?.dailySchedules) return null;

        const dateStr = selectedDate.toISOString().split('T')[0];
        return plan.dailySchedules.find((s: any) => s.date?.startsWith(dateStr));
    };

    const dailySchedule = getDailySchedule();

    // Lock body scroll when modal is open - MUST be before any conditional returns
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

    if (loading || !plan) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block w-8 h-8 border-2 border-black/20 border-t-black rounded-full animate-spin mb-4" />
                    <p className="text-sm text-black/60">Loading plan...</p>
                </div>
            </div>
        );
    }

    const metricsDisplay = getMetricsDisplay();

    const handleSelect = async () => {
        setSelected(true);
        setShowNotification(true);

        // Calculate savings from metrics
        let savings = 0;
        const metrics = plan.metrics as any;
        if (plan.type === 'cost') {
            savings = metrics.monthlySaving || 0;
        } else if (plan.type === 'eco') {
            savings = metrics.ecoImprovementPercentage || 0;
        } else {
            savings = metrics.budgetReductionPercentage || 0;
        }

        // Save active plan to new storage
        const activePlanType = plan.type === 'cost' ? 'cost' : plan.type === 'eco' ? 'eco' : 'balance';
        updateUserPlans({ activePlan: activePlanType });

        // Send plan activation notification
        await notificationService.sendPlanSelectedNotification(
            plan.name,
            plan.type,
            savings
        );

        setTimeout(() => {
            setShowNotification(false);
            setTimeout(() => {
                navigate("/dashboard");
            }, 500);
        }, 3000);
    };

    // Handle date selection
    const handleDateSelect = (date: Date | undefined) => {
        // If date is undefined (clicking already-selected date), reopen modal with current selection
        if (!date && selectedDate) {
            setShowModal(true);
            return;
        }

        if (!date) return;

        // Set the date and show modal
        setSelectedDate(date);
        setShowModal(true);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-32 overflow-y-auto scrollbar-hide">
            <AnimatePresence>
                {showNotification && (
                    <motion.div
                        className="fixed top-6 left-5 right-5 bg-black/90 backdrop-blur-xl text-white px-5 py-4 rounded-2xl z-50 flex items-center gap-3 shadow-2xl border border-white/10"
                        initial={{ y: -100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -100, opacity: 0 }}
                        transition={{ type: "spring", damping: 20 }}
                    >
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
                            {plan.type === 'cost'
                                ? 'Minimize energy bills with optimized schedules'
                                : plan.type === 'eco'
                                    ? 'Reduce environmental impact while staying comfortable'
                                    : 'Perfect balance between cost and comfort'}
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
                        <div className="text-2xl mb-1">{metricsDisplay.value1}</div>
                        <div className="text-xs text-black/50">{metricsDisplay.label1}</div>
                    </motion.div>

                    <motion.div
                        className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-2xl p-4 shadow-lg"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                    >
                        <div className="text-2xl mb-1">{metricsDisplay.value2}</div>
                        <div className="text-xs text-black/50">{metricsDisplay.label2}</div>
                    </motion.div>
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
                    <h2 className="text-xs tracking-wide text-black/60 mb-3">DEVICES INCLUDED</h2>
                    <div className="space-y-2">
                        {plan.devices && plan.devices.length > 0 ? (
                            plan.devices.map((deviceId: string) => (
                                <motion.div
                                    key={deviceId}
                                    whileTap={{ scale: 0.97 }}
                                    className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-white/50 border border-white/60 shadow-lg"
                                >
                                    {(() => {
                                        // Helper to find matching device key (simplified for clean IDs)
                                        const findDeviceMatch = (id: string) => {
                                            const cleanId = id.trim();

                                            // Try exact match
                                            if (deviceNames[cleanId]) return cleanId;

                                            // Try trimmed keys match (for backward compatibility with old IDs)
                                            const trimmedMatch = Object.keys(deviceNames).find(key => key.trim() === cleanId);
                                            if (trimmedMatch) return trimmedMatch;

                                            // Fallback: return cleanId even if not found
                                            console.warn('Device not found:', cleanId);
                                            return cleanId;
                                        };

                                        const matchedKey = findDeviceMatch(deviceId);
                                        const device = deviceNames[matchedKey];
                                        const deviceType = device?.type || '';
                                        const DeviceIcon = getDeviceIcon(deviceType);

                                        return (
                                            <>
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <div className="w-10 h-10 bg-white/50 backdrop-blur-sm border border-white/60 rounded-xl flex items-center justify-center flex-shrink-0">
                                                        <DeviceIcon className="w-5 h-5" strokeWidth={1.5} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-medium truncate">
                                                            {device?.name || matchedKey}
                                                        </div>
                                                        {device?.wattage && (
                                                            <div className="text-xs text-black/50">{device.wattage}W</div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-xs text-black/60">
                                                    <span className="inline-block px-2.5 py-1 rounded-full bg-black/5">
                                                        {device?.hoursPerDay || 0}h/day
                                                    </span>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </motion.div>
                            ))
                        ) : (
                            <p className="text-sm text-black/50">No devices assigned yet</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Fixed Select Plan Button */}
            <div className="fixed bottom-24 left-0 right-0 px-5 pb-2 bg-gradient-to-t from-gray-100 via-gray-100 to-transparent pt-6 z-30">
                <button
                    onClick={handleSelect}
                    disabled={selected || isActivePlan}
                    className="w-full py-3.5 bg-black text-white rounded-full text-sm tracking-wide hover:bg-black/90 transition-colors shadow-lg"
                    style={isActivePlan ? { opacity: 0.3 } : {}}
                >
                    {isActivePlan ? "Already in Use" : selected ? "Plan Selected" : "Select This Plan"}
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
                            className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-2xl rounded-t-3xl z-50 border-t border-white/60 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] flex flex-col"
                            style={{ maxHeight: '80vh' }}
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
                                {dailySchedule?.weather && typeof dailySchedule.weather === 'object' && (
                                    <div className="flex items-center gap-3 bg-white/60 backdrop-blur-xl border border-white/60 rounded-2xl p-4 shadow-lg">
                                        <div className="w-10 h-10 bg-white/50 backdrop-blur-sm border border-white/60 rounded-xl flex items-center justify-center">
                                            {getWeatherIcon(dailySchedule.weather.condition)}
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm font-medium">{dailySchedule.weather.condition}</div>
                                            <div className="text-xs text-black/50">
                                                {dailySchedule.weather.temperature}°C • {dailySchedule.weather.humidity}% humidity
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Summary Stats */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-2xl p-4 shadow-lg">
                                        <div className="text-xl mb-1">
                                            {(() => {
                                                const deviceKeys = Object.keys(dailySchedule || {}).filter(k => !['dayNumber', 'date', 'day', 'weather'].includes(k));
                                                let totalHours = 0;
                                                deviceKeys.forEach(deviceId => {
                                                    const usage = (dailySchedule as any)[deviceId];
                                                    if (usage && typeof usage === 'object' && usage.usage) {
                                                        totalHours += usage.usage;
                                                    }
                                                });
                                                return `${totalHours.toFixed(1)} hrs`;
                                            })()}
                                        </div>
                                        <div className="text-xs text-black/50">Total Usage</div>
                                    </div>
                                    <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-2xl p-4 shadow-lg">
                                        <div className="text-xl mb-1">
                                            {(() => {
                                                const userData = getUserData();
                                                const pricePerKwh = userData?.energyCosts?.pricePerKwh || 36;
                                                const currSym = currencySymbol;

                                                const deviceKeys = Object.keys(dailySchedule || {}).filter(k => !['dayNumber', 'date', 'day', 'weather'].includes(k));
                                                let totalCost = 0;
                                                deviceKeys.forEach(deviceId => {
                                                    const usage = (dailySchedule as any)[deviceId];
                                                    if (usage && usage.usage && deviceNames[deviceId]) {
                                                        const deviceWattage = deviceNames[deviceId].wattage || 150;
                                                        const kwhUsed = (deviceWattage * usage.usage) / 1000;
                                                        totalCost += kwhUsed * pricePerKwh;
                                                    }
                                                });

                                                return `${currSym}${totalCost.toFixed(2)}`;
                                            })()}
                                        </div>
                                        <div className="text-xs text-black/50">Estimated Daily Cost</div>
                                    </div>
                                </div>

                                {/* Devices Section Header */}
                                <h3 className="text-xs tracking-wide text-black/60">DEVICES & USAGE</h3>
                            </div>

                            {/* Scrollable Devices List */}
                            <div className="px-6 pb-6 overflow-y-auto scrollbar-hide" style={{ flex: 1, minHeight: 0 }}>
                                {dailySchedule ? (
                                    <div className="space-y-2">
                                        {Object.keys(dailySchedule || {}).filter(key => !['dayNumber', 'date', 'day', 'weather'].includes(key)).map((deviceId) => {
                                            const usage = (dailySchedule as any)[deviceId];
                                            if (!usage || typeof usage !== 'object') return null;


                                            const device = deviceNames[deviceId];
                                            const deviceType = device?.type || '';

                                            // Get device name
                                            let deviceName = deviceId;
                                            if (device?.name) {
                                                deviceName = device.name;
                                            } else {
                                                const fuzzyMatch = Object.keys(deviceNames).find(key =>
                                                    deviceId.includes(key) || key.includes(deviceId.split('_')[0])
                                                );
                                                if (fuzzyMatch && deviceNames[fuzzyMatch]?.name) {
                                                    deviceName = deviceNames[fuzzyMatch].name;
                                                }
                                            }

                                            // Get priority from actual user device data
                                            const userData = getUserData();
                                            const userDevice = userData?.devices?.find((d: any) => d.id === deviceId);
                                            const priorityNumber = userDevice?.priority || 3;

                                            const DeviceIcon = getDeviceIcon(deviceType);

                                            return (
                                                <div
                                                    key={deviceId}
                                                    className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-2xl p-4 shadow-lg"
                                                >
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className="w-10 h-10 bg-white/50 backdrop-blur-sm border border-white/60 rounded-xl flex items-center justify-center flex-shrink-0">
                                                            <DeviceIcon className="w-5 h-5" strokeWidth={1.5} />
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="text-sm mb-0.5">{deviceName}</div>
                                                            <div className="text-xs text-black/50">
                                                                Priority Level: <span className={priorityNumber >= 4 ? 'text-black font-medium' : ''}>{priorityNumber}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-between items-center pt-2">
                                                        <span className="text-xs text-black/50">Use Time</span>
                                                        <span className="text-sm">{usage.usage ? `${usage.usage} hrs` : 'Off'}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-sm text-black/60 text-center py-8">No schedule data available for this day.</p>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}