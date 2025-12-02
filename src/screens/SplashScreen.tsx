import { useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";

export default function SplashScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/location");
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      <motion.div
        className="text-center"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <motion.h1
          className="text-4xl tracking-tight mb-4 font-semibold"
          style={{ color: "#000" }}
          initial={{ letterSpacing: "-0.05em" }}
          animate={{ letterSpacing: "0em" }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
        >
          KineSave
        </motion.h1>
        
        <motion.p
          className="text-sm text-black/60 tracking-wide"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          Smart Energy Management
        </motion.p>
      </motion.div>

      <motion.div
        className="absolute bottom-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.5 }}
      >
        <div className="w-1 h-1 bg-black/30 rounded-full animate-pulse" />
      </motion.div>
    </div>
  );
}