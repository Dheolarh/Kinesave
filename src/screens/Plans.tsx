import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { TrendingDown, Leaf, Gauge } from "lucide-react";
import BottomNav from "../components/BottomNav";
import type { AIPlan } from "../types/ai-plan.types";

const iconMap = {
  cost: TrendingDown,
  eco: Leaf,
  balance: Gauge,
};

export default function Plans() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<AIPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load AI-generated plans from localStorage
  useEffect(() => {
    const loadPlans = () => {
      try {
        const savedPlans = localStorage.getItem('aiGeneratedPlans');
        if (savedPlans) {
          const plansData = JSON.parse(savedPlans);
          setPlans([
            plansData.costSaver,
            plansData.ecoMode,
            plansData.comfortBalance,
          ]);
        } else {
          setError('No plans generated yet. Please run analysis from the dashboard.');
        }
      } catch (err) {
        console.error('Failed to load plans:', err);
        setError('Failed to load plans. Please try running analysis again.');
      } finally {
        setLoading(false);
      }
    };
    loadPlans();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-black/20 border-t-black rounded-full animate-spin mb-4" />
          <p className="text-sm text-black/60">Loading plans...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-20 flex items-center justify-center">
        <h1 className="text-2xl text-black/60">No Plans Yet</h1>
        <BottomNav active="plans" />
      </div>
    );
  }

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
        {plans.map((plan, index) => {
          const Icon = iconMap[plan.type as keyof typeof iconMap] || TrendingDown;

          return (
            <motion.button
              key={plan.id}
              onClick={() => navigate(`/plan/${index + 1}`)}
              className="w-full bg-white/40 backdrop-blur-xl border border-white/60 rounded-3xl p-6 text-left hover:bg-white/50 transition-all shadow-lg"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-white/50 backdrop-blur-sm border border-white/60 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Icon className="w-6 h-6" strokeWidth={1.5} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg tracking-wide mb-1">{plan.name}</h3>
                  <p className="text-xs text-black/60 leading-relaxed">
                    {plan.description}
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                {/* Cost Saver Metrics */}
                {plan.type === 'cost' && (
                  <>
                    <div>
                      <p className="text-xs text-black/50 mb-1">Initial Budget</p>
                      <p className="text-lg tracking-tight">${plan.metrics.initialBudget || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-black/50 mb-1">Optimized Budget</p>
                      <p className="text-lg tracking-tight text-green-600">
                        ${plan.metrics.optimizedBudget || 0}
                      </p>
                    </div>
                  </>
                )}

                {/* Eco Mode Metrics */}
                {plan.type === 'eco' && (
                  <>
                    <div>
                      <p className="text-xs text-black/50 mb-1">Initial Eco Score</p>
                      <p className="text-lg tracking-tight">{plan.metrics.initialEcoScore || 0}/100</p>
                    </div>
                    <div>
                      <p className="text-xs text-black/50 mb-1">Optimized Eco Score</p>
                      <p className="text-lg tracking-tight text-green-600">
                        {plan.metrics.optimizedEcoScore || 0}/100
                      </p>
                    </div>
                  </>
                )}

                {/* Comfort Balance Metrics */}
                {plan.type === 'balance' && (
                  <>
                    <div>
                      <p className="text-xs text-black/50 mb-1">Optimized Budget</p>
                      <p className="text-lg tracking-tight">${plan.metrics.optimizedBudget || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-black/50 mb-1">Eco Friendly Gain</p>
                      <p className="text-lg tracking-tight text-green-600">
                        +{plan.metrics.ecoFriendlyGainPercentage || 0}%
                      </p>
                    </div>
                  </>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      <BottomNav active="plans" />
    </div>
  );
}