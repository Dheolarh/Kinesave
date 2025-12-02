import { motion } from "motion/react";
import { LucideIcon } from "lucide-react";

interface DeviceCardProps {
  device: {
    id: string;
    name: string;
    type: string;
    power: number;
    status: string;
  };
  icon: LucideIcon;
  onClick: () => void;
}

export default function DeviceCard({ device, icon: Icon, onClick }: DeviceCardProps) {
  return (
    <motion.button
      onClick={onClick}
      className="w-full bg-white/40 backdrop-blur-xl border border-white/60 rounded-3xl p-5 flex items-center gap-4 hover:bg-white/50 transition-all shadow-lg text-left"
      whileTap={{ scale: 0.98 }}
    >
      <div className="w-14 h-14 bg-white/50 backdrop-blur-sm border border-white/60 rounded-2xl flex items-center justify-center flex-shrink-0">
        <Icon className="w-6 h-6" strokeWidth={1.5} />
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className="text-sm tracking-wide mb-1">{device.name}</h3>
        <p className="text-xs text-black/50">{device.power}W</p>
      </div>

      <div
        className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
          device.status === "active" ? "bg-green-500" : "bg-black/20"
        }`}
      />
    </motion.button>
  );
}