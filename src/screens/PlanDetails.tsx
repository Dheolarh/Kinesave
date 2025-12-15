import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, TrendingDown, Wind, Droplets, Bell, Sun, X, Tv, Lightbulb, Zap, Cloud, CloudRain, CloudSnow, CloudDrizzle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Calendar } from "../components/ui/calendar";
import BottomNav from "../components/BottomNav";
import notificationService from "../services/notification.service";
import type { AIPlan } from "../types/ai-plan.types";

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

    // Load AI plan and device names from localStorage
    useEffect(() => {
        const loadPlan = () => {
            try {
                const savedPlans = localStorage.getItem('aiGeneratedPlans');
                if (!savedPlans) {
                    navigate('/ai-analysis');
                    return;
                }

                const plansData = JSON.parse(savedPlans);
                let selectedPlan: AIPlan | null = null;

                // Map ID to plan type
                if (id === '1') selectedPlan = plansData.costSaver;
                else if (id === '2') selectedPlan = plansData.ecoMode;
                else if (id === '3') selectedPlan = plansData.comfortBalance;

                if (!selectedPlan) {
                    navigate('/plans');
                    return;
                }

                setPlan(selectedPlan);

                // Load device names from users object
                const usersStr = localStorage.getItem('users');
                const userId = localStorage.getItem('currentUserId');

                if (usersStr && userId) {
                    const users = JSON.parse(usersStr);
                    const userDevices = users[userId]?.devices || users[userId.trim()]?.devices; // Handle trailing space

                    const devicesMap: Record<string, any> = {};
                    userDevices?.forEach((device: any) => {
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
                const energyData = localStorage.getItem('energyData');
                if (energyData) {
                    const data = JSON.parse(energyData);
                    setCurrencySymbol(data.currencySymbol || '$');
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

        if (plan.type === 'cost') {
            return {
                label1: "Monthly Savings",
                value1: `${currencySymbol}${metrics.monthlySaving || 0} `,
                label2: "Efficiency Gain",
                value2: `${Math.round((metrics.monthlySaving / (metrics.initialBudget || 1)) * 100)}% `
            };
        } else if (plan.type === 'eco') {
            return {
                label1: "Eco Friendly",
                value1: `+ ${metrics.ecoImprovementPercentage || 0}% `,
                label2: "Monthly Cost Cap",
                value2: `${currencySymbol}${metrics.monthlyCostCap || 0} `
            };
        } else {
            return {
                label1: "Budget Reduction",
                value1: `${metrics.budgetReductionPercentage || 0}% `,
                label2: "Eco Gain",
                value2: `+ ${metrics.ecoFriendlyGainPercentage || 0}% `
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

        // Save active plan to localStorage
        const activePlan = {
            id,
            name: plan.name,
            savings: `${currencySymbol}${savings.toFixed(2)} `,
            status: "active",
            type: plan.type,
        };
        localStorage.setItem("activePlan", JSON.stringify(activePlan));

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

    const handleDateSelect = (date: Date | undefined) => {
        if (date) {
            setSelectedDate(date);
            setShowModal(true);
        }
    };

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
                    <h2 className="text-xs tracking-wide text-black/60 mb-3">DEVICES INCLUDED</h2>
                    <div className="space-y-2">
                        {plan.devices && plan.devices.length > 0 ? (
                            plan.devices.map((deviceId: string) => (
                                <motion.div
                                    key={deviceId}
                                    whileTap={{ scale: 0.97 }}
                                    className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-white/50 border border-white/60 shadow-lg"
                                >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="w-10 h-10 bg-white/50 backdrop-blur-sm border border-white/60 rounded-xl flex items-center justify-center flex-shrink-0">
                                            {(() => {
                                                const deviceType = deviceNames[deviceId]?.type?.toLowerCase() || '';
                                                if (deviceType.includes('tv') || deviceType.includes('television')) {
                                                    return <Tv className="w-5 h-5" strokeWidth={1.5} />;
                                                } else if (deviceType.includes('light') || deviceType.includes('bulb')) {
                                                    return <Lightbulb className="w-5 h-5" strokeWidth={1.5} />;
                                                } else if (deviceType.includes('pump') || deviceType.includes('water')) {
                                                    return <Droplets className="w-5 h-5" strokeWidth={1.5} />;
                                                } else if (deviceType.includes('refrigerator') || deviceType.includes('freezer') || deviceType.includes('fridge')) {
                                                    return <Wind className="w-5 h-5" strokeWidth={1.5} />;
                                                } else {
                                                    return <Zap className="w-5 h-5" strokeWidth={1.5} />;
                                                }
                                            })()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium truncate">
                                                {(() => {
                                                    console.log('Looking for deviceId:', deviceId);
                                                    console.log('Available devices:', Object.keys(deviceNames));

                                                    // Try exact match first
                                                    if (deviceNames[deviceId]?.name) {
                                                        return deviceNames[deviceId].name;
                                                    }

                                                    // Try fuzzy match (AI might have modified the ID)
                                                    const fuzzyMatch = Object.keys(deviceNames).find(key =>
                                                        deviceId.includes(key) || key.includes(deviceId.split('_')[0])
                                                    );

                                                    if (fuzzyMatch && deviceNames[fuzzyMatch]?.name) {
                                                        console.log('Fuzzy matched:', fuzzyMatch, '->', deviceNames[fuzzyMatch].name);
                                                        return deviceNames[fuzzyMatch].name;
                                                    }

                                                    console.warn('No match found for:', deviceId);
                                                    return deviceId;
                                                })()}
                                            </div>
                                            {deviceNames[deviceId]?.wattage && (
                                                <div className="text-xs text-black/50">{deviceNames[deviceId].wattage}W</div>
                                            )}
                                        </div>
                                    </div>

                                </motion.div>
                            ))
                        ) : (
                            <p className="text-sm text-black/50">No devices assigned yet</p>
                        )}
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
                        {plan.smartAlerts && plan.smartAlerts.length > 0 ? (
                            plan.smartAlerts.slice(0, 3).map((alert: any, index: number) => (
                                <motion.div
                                    key={index}
                                    className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-2xl p-4 flex items-start gap-3 shadow-lg"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.35 + index * 0.05 }}
                                >
                                    <Bell className="w-4 h-4 mt-0.5 flex-shrink-0 text-black/60" strokeWidth={1.5} />
                                    <span className="text-sm leading-relaxed">
                                        {typeof alert === 'string' ? alert : alert.message || alert.text || JSON.stringify(alert)}
                                    </span>
                                </motion.div>
                            ))
                        ) : (
                            <p className="text-sm text-black/50">No alerts configured yet</p>
                        )}
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
                            className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-2xl rounded-t-3xl z-50 border-t border-white/60 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] p-6 max-h-[75vh] overflow-y-auto"
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-medium">
                                        {selectedDate?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        {dailySchedule?.weather && typeof dailySchedule.weather === 'object' && (
                                            <>
                                                <span className="text-sm text-black/60">{dailySchedule.weather.condition}</span>
                                                {getWeatherIcon(dailySchedule.weather.condition)}
                                            </>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="w-8 h-8 rounded-full border border-black/10 flex items-center justify-center hover:border-black/20 transition-colors"
                                >
                                    <X className="w-4 h-4" strokeWidth={1.5} />
                                </button>
                            </div>

                            {dailySchedule ? (
                                <div className="space-y-3">
                                    {Object.keys(dailySchedule || {}).filter(key => !['dayNumber', 'date', 'day', 'weather'].includes(key)).map((deviceId) => {
                                        const usage = (dailySchedule as any)[deviceId];
                                        if (!usage || typeof usage !== 'object') return null;

                                        const device = deviceNames[deviceId];
                                        const deviceType = device?.type?.toLowerCase() || '';

                                        return (
                                            <div
                                                key={deviceId}
                                                className="flex items-center justify-between p-3 bg-white/40 backdrop-blur-xl border border-white/60 rounded-xl shadow-lg"
                                            >
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <div className="w-8 h-8 bg-white/50 backdrop-blur-sm border border-white/60 rounded-lg flex items-center justify-center flex-shrink-0">
                                                        {deviceType.includes('tv') || deviceType.includes('television') ? (
                                                            <Tv className="w-4 h-4" strokeWidth={1.5} />
                                                        ) : deviceType.includes('light') || deviceType.includes('bulb') ? (
                                                            <Lightbulb className="w-4 h-4" strokeWidth={1.5} />
                                                        ) : deviceType.includes('pump') || deviceType.includes('water') ? (
                                                            <Droplets className="w-4 h-4" strokeWidth={1.5} />
                                                        ) : deviceType.includes('refrigerator') || deviceType.includes('freezer') || deviceType.includes('fridge') ? (
                                                            <Wind className="w-4 h-4" strokeWidth={1.5} />
                                                        ) : (
                                                            <Zap className="w-4 h-4" strokeWidth={1.5} />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-medium truncate">
                                                            {(() => {
                                                                // Try exact match first
                                                                if (device?.name) return device.name;

                                                                // Try fuzzy match
                                                                const fuzzyMatch = Object.keys(deviceNames).find(key =>
                                                                    deviceId.includes(key) || key.includes(deviceId.split('_')[0])
                                                                );

                                                                if (fuzzyMatch && deviceNames[fuzzyMatch]?.name) {
                                                                    return deviceNames[fuzzyMatch].name;
                                                                }

                                                                return deviceId;
                                                            })()}
                                                        </div>
                                                        {usage.window && (
                                                            <div className="text-xs text-black/50">{usage.window}</div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-sm font-medium text-black/60 flex-shrink-0 ml-2">
                                                    {usage.usage ? `${usage.usage} hrs` : 'Off'}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {(!dailySchedule || Object.keys(dailySchedule).filter(key => !['dayNumber', 'date', 'day', 'weather'].includes(key)).length === 0) && (
                                        <p className="text-sm text-black/50 text-center py-4">No devices scheduled for this day</p>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-sm text-black/50">No schedule data for this date</p>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}