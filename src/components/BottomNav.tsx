import { Home, Layers } from "lucide-react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";

interface BottomNavProps {
  active: "home" | "plans";
}

export default function BottomNav({ active }: BottomNavProps) {
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/60 backdrop-blur-2xl border-t border-white/60 px-8 py-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-around max-w-md mx-auto">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex flex-col items-center gap-1.5 relative"
        >
          <Home
            className="w-5 h-5"
            strokeWidth={active === "home" ? 2 : 1.5}
          />
          <span className={`text-xs ${active === "home" ? "" : "text-black/50"}`}>
            Home
          </span>
          {active === "home" && (
            <motion.div
              className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-1 h-1 bg-black rounded-full"
              layoutId="nav-indicator"
            />
          )}
        </button>

        <button
          onClick={() => navigate("/plans")}
          className="flex flex-col items-center gap-1.5 relative"
        >
          <Layers
            className="w-5 h-5"
            strokeWidth={active === "plans" ? 2 : 1.5}
          />
          <span className={`text-xs ${active === "plans" ? "" : "text-black/50"}`}>
            Plans
          </span>
          {active === "plans" && (
            <motion.div
              className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-1 h-1 bg-black rounded-full"
              layoutId="nav-indicator"
            />
          )}
        </button>
      </div>
    </div>
  );
}