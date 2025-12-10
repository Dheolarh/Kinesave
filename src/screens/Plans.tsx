import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { TrendingDown, Leaf, Gauge } from "lucide-react";
import BottomNav from "../components/BottomNav";

const plans = [
  {
    id: "1",
    name: "Cost Saver",
    description: "Minimize energy bills with optimized schedules",
    savings: "$28.50",
    efficiency: "18%",
    icon: TrendingDown,
  },
  {
    id: "2",
    name: "Eco Mode",
    description: "Reduce environmental impact while staying comfortable",
    savings: "$22.30",
    efficiency: "24%",
    icon: Leaf,
  },
  {
    id: "3",
    name: "Comfort Balance",
    description: "Perfect balance between cost and comfort",
    savings: "$18.00",
    efficiency: "12%",
    icon: Gauge,
  },
];

export default function Plans() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-20 overflow-y-auto scrollbar-hide">
      <div className="px-5 pt-8 pb-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl mb-2 tracking-tight">Recommended Plans</h1>
          <p className="text-sm text-black/60">
            Based on your devices + local climate
          </p>
        </motion.div>
      </div>

      <div className="px-5 space-y-4">
        {plans.map((plan, index) => (
          <motion.button
            key={plan.id}
            onClick={() => navigate(`/plan/${plan.id}`)}
            className="w-full bg-white/40 backdrop-blur-xl border border-white/60 rounded-3xl p-6 text-left hover:bg-white/50 transition-all shadow-lg"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-white/50 backdrop-blur-sm border border-white/60 rounded-2xl flex items-center justify-center flex-shrink-0">
                <plan.icon className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg mb-1 tracking-tight">{plan.name}</h3>
                <p className="text-xs text-black/60 leading-relaxed">
                  {plan.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6 pt-4 border-t border-white/40">
              <div>
                <div className="text-xs text-black/50 mb-1">Monthly Savings</div>
                <div className="text-sm">{plan.savings}</div>
              </div>
              <div>
                <div className="text-xs text-black/50 mb-1">Efficiency Gain</div>
                <div className="text-sm">+{plan.efficiency}</div>
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      <BottomNav active="plans" />
    </div>
  );
}