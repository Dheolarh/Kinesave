import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, TrendingDown, Wind, Droplets, Bell } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import BottomNav from "../components/BottomNav";

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

export default function PlanDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  const plan = planData[id as keyof typeof planData];

  if (!plan) {
    return null;
  }

  const handleSelect = () => {
    setSelected(true);
    setShowNotification(true);
    
    // Save active plan to localStorage
    const activePlan = {
      id,
      name: plan.name,
      savings: plan.savings,
      status: "active",
    };
    localStorage.setItem("activePlan", JSON.stringify(activePlan));
    
    setTimeout(() => {
      setShowNotification(false);
      // Navigate back to dashboard after activation
      setTimeout(() => {
        navigate("/dashboard");
      }, 500);
    }, 3000);
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
            <p className="text-sm leading-relaxed">{plan.schedule}</p>
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
    </div>
  );
}