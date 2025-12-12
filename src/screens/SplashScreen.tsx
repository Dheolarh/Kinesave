import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";

export default function SplashScreen() {
  const navigate = useNavigate();
  const [name, setName] = useState("");

  // Clear all localStorage when splash screen loads (fresh start for new user)
  useEffect(() => {
    localStorage.clear();
  }, []);

  // Generate 15 random digits
  const generate15Digits = () => {
    let digits = '';
    for (let i = 0; i < 15; i++) {
      digits += Math.floor(Math.random() * 10).toString();
    }
    return digits;
  };

  const handleProceed = () => {
    if (name.trim() && name.trim().length >= 3) {
      const sanitizedName = name.trim().toLowerCase().replace(/\s+/g, '_');
      const randomDigits = generate15Digits();
      const userId = `${sanitizedName}_${randomDigits}`;

      // Save the new username and userId to localStorage
      localStorage.setItem("userName", name.trim());
      localStorage.setItem("userId", userId);
      navigate("/location");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center px-6">
      <motion.div
        className="text-center w-full max-w-md"
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

        {/* Name Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="space-y-4"
        >
          <div className="text-left">
            <label className="block text-sm text-black/70 mb-2">
              Hi,
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleProceed()}
              placeholder="What's your name?"
              className="w-full px-4 py-4 bg-white/50 backdrop-blur-sm border border-white/60 rounded-2xl text-sm focus:outline-none focus:border-black/30 transition-colors shadow-lg"
              autoFocus
            />
          </div>

          <button
            onClick={handleProceed}
            disabled={!name.trim() || name.trim().length < 3}
            className="w-full py-3.5 bg-black text-white rounded-full text-sm tracking-wide hover:bg-black/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shadow-lg"
          >
            Proceed
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}