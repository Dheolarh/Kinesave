import { motion } from "motion/react";
import Orb from "./Orb";

interface FloatingAIRingProps {
  onClick: () => void;
}

export default function FloatingAIRing({ onClick }: FloatingAIRingProps) {
  return (
    <motion.button
      onClick={onClick}
      className="fixed bottom-24 right-5 w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-lg overflow-hidden p-3"
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.05 }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
    >
      <div className="w-full h-full">
        <Orb
          hoverIntensity={0.3}
          rotateOnHover={false}
          hue={0}
          forceHoverState={true}
        />
      </div>
    </motion.button>
  );
}