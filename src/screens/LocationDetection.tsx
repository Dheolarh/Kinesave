import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { MapPin } from "lucide-react";

export default function LocationDetection() {
  const navigate = useNavigate();
  const [detected, setDetected] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDetected(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center px-6">
      <motion.div
        className="text-center max-w-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="mb-8">
          <motion.div
            className="w-16 h-16 mx-auto mb-6 bg-white/40 backdrop-blur-xl border border-white/60 rounded-full flex items-center justify-center shadow-lg"
            animate={{ rotate: detected ? 0 : 360 }}
            transition={{ duration: 2, repeat: detected ? 0 : Infinity, ease: "linear" }}
          >
            <MapPin className="w-7 h-7" strokeWidth={1.5} />
          </motion.div>
        </div>

        <h2 className="text-2xl mb-3 tracking-tight">
          {detected ? "Location Detected" : "Detecting Your Location..."}
        </h2>
        
        <p className="text-sm text-black/60 leading-relaxed">
          We tailor your energy optimization to your climate.
        </p>

        {detected && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-8"
          >
            <p className="text-sm mb-6 text-black/70">San Francisco, CA • 68°F</p>
            <button
              onClick={() => navigate("/setup")}
              className="px-8 py-3 bg-black text-white rounded-full text-sm tracking-wide hover:bg-black/90 transition-colors"
            >
              Continue
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}