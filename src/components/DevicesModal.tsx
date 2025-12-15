import { motion, AnimatePresence } from "motion/react";
import { X, Zap } from "lucide-react";
import { DEVICE_CATEGORIES, getDevicesByCategory, type DeviceType } from "../utils/device-types";

interface DevicesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (deviceType: DeviceType) => void;
    selectedValue?: string;
}

export default function DevicesModal({ isOpen, onClose, onSelect, selectedValue }: DevicesModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 bg-black/20 z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-2xl rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] max-h-[80vh] flex flex-col"
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                    >
                        {/* Header */}
                        <div className="px-6 pt-6 pb-4 mb-4 flex-shrink-0">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl tracking-tight">Select Device Type</h2>
                                <button
                                    onClick={onClose}
                                    className="w-8 h-8 rounded-full border border-black/10 flex items-center justify-center hover:border-black/20 transition-colors"
                                >
                                    <X className="w-4 h-4" strokeWidth={1.5} />
                                </button>
                            </div>
                        </div>

                        {/* Scrollable Content */}
                        <div className="px-6 pb-6 overflow-y-auto scrollbar-hide flex-1" style={{ minHeight: 0 }}>
                            <div className="space-y-6">
                                {DEVICE_CATEGORIES.map(category => {
                                    const devicesInCategory = getDevicesByCategory(category);
                                    if (devicesInCategory.length === 0) return null;

                                    return (
                                        <div key={category}>
                                            <h3 className="text-xs tracking-wide text-black/60 mb-3 uppercase">{category}</h3>
                                            <div className="grid grid-cols-2 gap-2">
                                                {devicesInCategory.map(deviceType => {
                                                    const Icon = deviceType.icon;
                                                    const isSelected = selectedValue === deviceType.value;

                                                    return (
                                                        <motion.button
                                                            key={deviceType.value}
                                                            onClick={() => {
                                                                onSelect(deviceType);
                                                                onClose();
                                                            }}
                                                            className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 shadow-lg hover:shadow-xl transition-all ${isSelected
                                                                ? "border-black bg-black text-white"
                                                                : "border-white/60 bg-white/40 hover:bg-white/50"
                                                                }`}
                                                            whileTap={{ scale: 0.98 }}
                                                        >
                                                            <Icon className="w-5 h-5 flex-shrink-0" strokeWidth={1.5} />
                                                            <span
                                                                className="text-sm text-left whitespace-nowrap overflow-hidden text-ellipsis"
                                                                style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                                            >
                                                                {deviceType.label}
                                                            </span>
                                                        </motion.button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
