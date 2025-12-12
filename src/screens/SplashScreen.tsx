import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { createUserProfile, setCurrentUserId } from "../utils/dataBrain";

export default function SplashScreen() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Clear sessionStorage when splash screen loads
  useEffect(() => {
    sessionStorage.clear();
  }, []);

  // Generate 15 random digits
  const generate15Digits = () => {
    let digits = '';
    for (let i = 0; i < 15; i++) {
      digits += Math.floor(Math.random() * 10).toString();
    }
    return digits;
  };

  const handleProceed = async () => {
    if (name.trim() && name.trim().length >= 3 && !isCreating) {
      setIsCreating(true);

      try {
        const sanitizedName = name.trim().toLowerCase().replace(/\s+/g, '_');
        const randomDigits = generate15Digits();
        const userId = `${sanitizedName}_${randomDigits}`;

        // Create user profile in backend (creates JSON file)
        await createUserProfile(name.trim(), userId);

        // Store userId in sessionStorage for this session
        setCurrentUserId(userId);

        // Navigate to location detection
        navigate("/location");
      } catch (error) {
        console.error("Failed to create user profile:", error);
        alert("Failed to create profile. Please try again.");
        setIsCreating(false);
      }
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
            disabled={!name.trim() || name.trim().length < 3 || isCreating}
            className="w-full py-3.5 bg-black text-white rounded-full text-sm tracking-wide hover:bg-black/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shadow-lg"
          >
            {isCreating ? "Creating Profile..." : "Proceed"}
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}