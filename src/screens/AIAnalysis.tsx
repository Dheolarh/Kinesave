import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Check, ArrowLeft, Edit2 } from "lucide-react";
import Orb from "../components/Orb";
import { getUserData, getUserPlans, updateUserPlans } from "../utils/user-storage";
import { getDeviceIcon } from "../utils/device-types";
import EnergyCostEditModal from "../components/EnergyCostEditModal";

const analysisSteps = [
  "Scanning device usage patterns",
  "Checking weather & climate data",
  "Calculating optimal energy plans",
  "Generating recommendations",
];

export default function AIAnalysis() {
  const navigate = useNavigate();
  const [stage, setStage] = useState<"selection" | "analyzing" | "complete">("selection");
  const [availableDevices, setAvailableDevices] = useState<any[]>([]);
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [showEnergyCostModal, setShowEnergyCostModal] = useState(false);

  // Load user devices from localStorage
  useEffect(() => {
    const loadDevices = () => {
      try {
        const userData = getUserData();
        if (userData?.devices && userData.devices.length > 0) {
          setAvailableDevices(userData.devices);
          // Pre-select all devices by default
          setSelectedDevices(userData.devices.map((d: any) => d.id));
        }
      } catch (error) {
        console.error("Failed to load devices:", error);
      }
    };
    loadDevices();
  }, []);

  const toggleDevice = (id: string) => {
    if (selectedDevices.includes(id)) {
      setSelectedDevices(selectedDevices.filter((deviceId) => deviceId !== id));
    } else {
      setSelectedDevices([...selectedDevices, id]);
    }
  };

  const startAnalysis = async () => {
    if (selectedDevices.length > 0) {
      // Check if analysis has already been done (limit to 1 for testing, unless in test mode)
      const isTestMode = localStorage.getItem('testModeActive') === 'true';
      const existingPlans = getUserPlans();

      if (!isTestMode && existingPlans && (existingPlans.costSaver || existingPlans.ecoMode || existingPlans.comfortBalance)) {
        // Import notification service
        const { default: notificationService } = await import('../services/notification.service');

        // Send notification about analysis limit
        await notificationService.send({
          id: `analysis_limit_${Date.now()}`,
          type: 'usage_alert',
          title: 'Analysis Limit Reached',
          message: 'App is still in development, analysis is limited to 1 trial',
          timestamp: new Date().toISOString(),
          read: false,
          actionUrl: '/plans',
        });
        return;
      }


      setStage("analyzing");
      setCurrentStep(0);

      try {
        const userData = getUserData();
        if (!userData) throw new Error('User data not found');

        // Get required data
        const devices = availableDevices.filter(d => selectedDevices.includes(d.id));
        let weatherForecast = userData.weather?.forecast || [];

        // Fetch 30-day weather forecast if not available or insufficient
        if (weatherForecast.length < 30 && userData.location) {
          const { default: weatherService } = await import('../services/weather.service');
          const { updateUserWeather } = await import('../utils/user-storage');

          weatherForecast = await weatherService.getMonthlyForecast(
            userData.location.latitude,
            userData.location.longitude,
            30,  // Get 30 days
            false // Use hybrid (free) mode
          );

          // Save to storage for future use
          updateUserWeather(weatherForecast);
        }

        const preferredBudget = userData.energyCosts?.preferredBudget || 4000;
        const avgMonthlyCost = userData.energyCosts?.monthlyCost || 6000;
        const pricePerKwh = userData.energyCosts?.pricePerKwh || 36;

        // Step 1: AI Weather Analysis
        const { analyzeWeatherExclusions } = await import('../services/AI-weather-analysis');
        const weatherDevices = devices.map(d => ({
          id: d.id,
          name: d.customName || d.name,
          type: d.deviceType || d.type
        }));
        const weatherData = weatherForecast.slice(0, 30).map((w: any, i: number) => ({
          dayNumber: i + 1,
          temp: w.avgTemp,
          condition: w.condition
        }));
        const weatherExclusions = await analyzeWeatherExclusions(weatherDevices, weatherData);

        // Step 2: AI Emission Analysis
        const { analyzeEmissions } = await import('../services/AI-emission-analysis');
        const emissionDevices = devices.map(d => ({
          id: d.id,
          name: d.customName || d.name,
          type: d.deviceType || d.type,
          watts: d.wattage || 0
        }));
        const emissionLevels = await analyzeEmissions(emissionDevices);

        // Prepare device inputs
        const deviceInputs = devices.map(d => ({
          id: d.id,
          name: d.customName || d.name,
          watts: d.wattage || 0,
          hoursPerDay: d.survey?.hoursPerDay || 0,
          priority: d.survey?.priority || 3,
          frequency: (d.survey?.frequency || 'daily') as 'daily' | 'weekends' | 'frequently' | 'rarely'
        }));

        // Calculate initial total hours for eco gain
        const initialTotalHours = deviceInputs.reduce((sum, d) => sum + (d.hoursPerDay * 30), 0);

        // Step 3: Generate Cost Plan
        const { generateCostPlan } = await import('../services/cost-plan-logic');
        const costPlan = generateCostPlan(deviceInputs, preferredBudget, pricePerKwh, weatherExclusions);

        // Step 4: Generate Eco Plan
        const { generateEcoPlan } = await import('../services/eco-plan-logic');
        const ecoPlan = generateEcoPlan(deviceInputs, avgMonthlyCost, pricePerKwh, weatherExclusions, emissionLevels);
        const ecoPlanTotalHours = ecoPlan.schedule.reduce((sum, day) =>
          sum + day.devices.reduce((daySum, d) => daySum + d.hours, 0), 0
        );

        // Step 5: Generate Comfort Plan
        const { generateComfortPlan } = await import('../services/comfort-plan-logic');
        const comfortPlan = generateComfortPlan(costPlan, ecoPlan, avgMonthlyCost, preferredBudget, pricePerKwh);

        // Step 6: Transform to AIPlan format
        const { transformCostPlanToAIPlan, transformEcoPlanToAIPlan, transformComfortPlanToAIPlan } =
          await import('../services/plan-transformer');

        const deviceNames = devices.reduce((acc, d) => {
          acc[d.id] = d.customName || d.name;
          return acc;
        }, {} as Record<string, string>);

        const costAIPlan = transformCostPlanToAIPlan({
          costPlan,
          weatherData: weatherForecast.slice(0, 30),
          preferredBudget,
          deviceNames
        });

        const ecoAIPlan = transformEcoPlanToAIPlan({
          ecoPlan,
          weatherData: weatherForecast.slice(0, 30),
          avgMonthlyCost,
          initialTotalHours,
          deviceNames
        });

        const comfortAIPlan = transformComfortPlanToAIPlan({
          comfortPlan,
          weatherData: weatherForecast.slice(0, 30),
          avgMonthlyCost,
          ecoPlanTotalHours,
          deviceNames
        });

        // Step 7: Save plans (no plan activated by default)
        updateUserPlans({
          costSaver: costAIPlan,
          ecoMode: ecoAIPlan,
          comfortBalance: comfortAIPlan
        });

        setStage("complete");
      } catch (err: any) {
        console.error('AI analysis failed:', err);

        // Import notification service
        const { default: notificationService } = await import('../services/notification.service');

        // Send error notification instead of showing in UI
        await notificationService.send({
          id: `analysis_error_${Date.now()}`,
          type: 'usage_alert',
          title: 'Analysis Error',
          message: 'Sorry we ran into an error, we will fix this soon',
          timestamp: new Date().toISOString(),
          read: false,
          actionUrl: '/dashboard',
        });

        setStage("selection");
      }
    }
  };

  useEffect(() => {
    if (stage === "analyzing" && currentStep < analysisSteps.length) {
      const timer = setTimeout(() => {
        setCurrentStep(currentStep + 1);
      }, 2000); // 2 seconds per progress step
      return () => clearTimeout(timer);
    }
  }, [stage, currentStep]);

  useEffect(() => {
    if (stage === "complete") {
      const navTimer = setTimeout(() => {
        navigate("/plans");
      }, 1500);
      return () => clearTimeout(navTimer);
    }
  }, [stage, navigate]);



  if (stage === "selection") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-32 overflow-y-auto scrollbar-hide">
        <div className="px-5 pt-8 pb-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate("/dashboard")}
              className="w-10 h-10 rounded-full border border-black/10 flex items-center justify-center hover:border-black/20 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
            </button>

            <button
              onClick={() => setShowEnergyCostModal(true)}
              className="w-10 h-10 flex items-center justify-center hover:border-black/20 transition-colors"
            >
              <Edit2 className="w-5 h-5" strokeWidth={1.5} />
            </button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-2xl mb-2 tracking-tight font-semibold">Select Devices</h1>
            <p className="text-sm text-black/60">
              Choose which devices to include in analysis
            </p>
          </motion.div>

        </div>

        <div className="px-5 space-y-3">
          {availableDevices.map((device, index) => {
            const Icon = getDeviceIcon(device.deviceType);
            const isSelected = selectedDevices.includes(device.id);

            return (
              <motion.button
                key={device.id}
                onClick={() => toggleDevice(device.id)}
                className="w-full bg-white/40 backdrop-blur-xl border border-white/60 rounded-3xl p-5 flex items-center gap-4 hover:bg-white/50 transition-all shadow-lg text-left"
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="w-14 h-14 bg-white/50 backdrop-blur-sm border border-white/60 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Icon className="w-6 h-6" strokeWidth={1.5} />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-sm tracking-wide mb-1">{device.customName || device.name}</h3>
                  {(device.power || device.energyStarSpecs?.powerRatingW) > 0 && (
                    <p className="text-xs text-black/50">{device.power || device.energyStarSpecs?.powerRatingW}W</p>
                  )}
                </div>

                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${isSelected
                    ? "border-black bg-black"
                    : "border-black/20"
                    }`}
                >
                  {isSelected && <Check className="w-4 h-4 text-white" strokeWidth={2.5} />}
                </div>
              </motion.button>
            );
          })}
        </div>

        <div className="fixed bottom-0 left-0 right-0 px-5 pb-6 bg-gradient-to-t from-gray-100 via-gray-100 to-transparent pt-6">
          <motion.button
            onClick={startAnalysis}
            disabled={selectedDevices.length === 0}
            className="w-full py-3.5 bg-black text-white rounded-full text-sm tracking-wide hover:bg-black/90 transition-colors disabled:cursor-not-allowed shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: selectedDevices.length === 0 ? 0.3 : 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileTap={{ scale: selectedDevices.length > 0 ? 0.98 : 1 }}
          >
            Analyze {selectedDevices.length > 0 && `(${selectedDevices.length} devices)`}
          </motion.button>
        </div>

        {/* Energy Cost Edit Modal */}
        <EnergyCostEditModal
          isOpen={showEnergyCostModal}
          onClose={() => setShowEnergyCostModal(false)}
        />
      </div>
    );
  }

  // Analyzing or Complete Stage - Show Orb with progress messages
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-8">
      <div className="w-full max-w-lg aspect-square relative">
        <Orb
          hue={0}
          hoverIntensity={0.3}
          rotateOnHover={true}
          forceHoverState={true}
        />

        {/* Progress message overlay in center of Orb */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center px-6"
          >
            <p className="text-sm text-black/70 font-medium tracking-wide">
              {stage === "complete"
                ? "Analysis Complete!"
                : analysisSteps[currentStep] || "Preparing analysis..."}
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}