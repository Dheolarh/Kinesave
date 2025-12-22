import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { getUserData, updateUserEnergyCosts } from "../utils/user-storage";

interface EnergyCostEditModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function EnergyCostEditModal({ isOpen, onClose }: EnergyCostEditModalProps) {
    const [monthlyCost, setMonthlyCost] = useState("");
    const [preferredBudget, setPreferredBudget] = useState("");
    const [pricePerKwh, setPricePerKwh] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [currencySymbol, setCurrencySymbol] = useState("$");

    // Load existing values when modal opens
    useEffect(() => {
        if (isOpen) {
            const userData = getUserData();
            if (userData?.energyCosts) {
                setMonthlyCost(userData.energyCosts.monthlyCost.toString());
                setPreferredBudget(userData.energyCosts.preferredBudget?.toString() || "");
                setPricePerKwh(userData.energyCosts.pricePerKwh.toString());
                setCurrencySymbol(userData.energyCosts.currencySymbol || "$");
            }
        }
    }, [isOpen]);

    const handleUpdate = async () => {
        setIsSaving(true);

        try {
            const userData = getUserData();
            if (!userData?.energyCosts) {
                setIsSaving(false);
                return;
            }

            // Update energy costs with new values
            const updatedEnergyCosts = {
                ...userData.energyCosts,
                monthlyCost: parseFloat(monthlyCost) || 0,
                preferredBudget: parseFloat(preferredBudget) || null,
                pricePerKwh: parseFloat(pricePerKwh) || 0,
            };

            updateUserEnergyCosts(updatedEnergyCosts);

            // Close modal
            onClose();
        } catch (error) {
            console.error("Failed to update energy costs:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const isValid = monthlyCost && preferredBudget && pricePerKwh;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        className="fixed inset-0 bg-black/20 z-40"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />
                    <motion.div
                        className="fixed bottom-0 left-0 right-0 z-50 flex flex-col bg-white/80 backdrop-blur-2xl rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)]"
                        style={{ maxHeight: '85vh' }}
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                    >
                        {/* Header */}
                        <div className="px-6 pt-6 pb-4 mb-2 flex-shrink-0">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl tracking-tight">Update Energy Costs</h2>
                                <button
                                    onClick={onClose}
                                    className="w-8 h-8 rounded-full border border-black/10 flex items-center justify-center hover:border-black/20 transition-colors"
                                >
                                    <X className="w-4 h-4" strokeWidth={1.5} />
                                </button>
                            </div>
                        </div>

                        {/* Scrollable Content */}
                        <div
                            className="px-6 flex-1 overflow-y-auto scrollbar-hide pb-6"
                            style={{ minHeight: 0 }}
                        >
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-6"
                            >
                                {/* Average Monthly Electricity Bill */}
                                <div>
                                    <label className="block text-xs text-black/60 mb-2 tracking-wide">
                                        Average Monthly Electricity Bill
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40">
                                            {currencySymbol}
                                        </span>
                                        <input
                                            type="number"
                                            value={monthlyCost}
                                            onChange={(e) => setMonthlyCost(e.target.value)}
                                            placeholder="e.g., 100"
                                            min="0"
                                            style={{ paddingLeft: '1.5rem' }}
                                            className="w-full py-3 bg-white/50 backdrop-blur-sm border border-white/60 rounded-xl text-sm shadow-lg focus:outline-none focus:border-black/30"
                                        />
                                    </div>
                                </div>

                                {/* Preferred Budget */}
                                <div>
                                    <label className="block text-xs text-black/60 mb-2 tracking-wide">
                                        Preferred Budget
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40">
                                            {currencySymbol}
                                        </span>
                                        <input
                                            type="number"
                                            value={preferredBudget}
                                            onChange={(e) => setPreferredBudget(e.target.value)}
                                            placeholder="e.g., 50"
                                            min="0"
                                            style={{ paddingLeft: '1.5rem' }}
                                            className="w-full py-3 bg-white/50 backdrop-blur-sm border border-white/60 rounded-xl text-sm shadow-lg focus:outline-none focus:border-black/30"
                                        />
                                    </div>
                                </div>

                                {/* Cost per Kilowatt Hour */}
                                <div>
                                    <label className="block text-xs text-black/60 mb-2 tracking-wide">
                                        Cost per Kilowatt Hour (kWh)
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40">
                                            {currencySymbol}
                                        </span>
                                        <input
                                            type="number"
                                            value={pricePerKwh}
                                            onChange={(e) => setPricePerKwh(e.target.value)}
                                            placeholder="e.g., 2"
                                            min="0"
                                            step="0.01"
                                            style={{ paddingLeft: '1.5rem' }}
                                            className="w-full py-3 bg-white/50 backdrop-blur-sm border border-white/60 rounded-xl text-sm shadow-lg focus:outline-none focus:border-black/30"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Footer Buttons */}
                        <div className="px-6 py-4 flex-shrink-0 flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 py-3.5 bg-white/60 backdrop-blur-xl border border-white/60 text-black rounded-full text-sm tracking-wide hover:bg-white/70 transition-colors"
                            >
                                Cancel
                            </button>
                            <motion.button
                                onClick={handleUpdate}
                                disabled={!isValid || isSaving}
                                className="flex-1 bg-black text-white py-3.5 rounded-full text-sm tracking-wide hover:bg-black/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                whileTap={{ scale: 0.98 }}
                            >
                                {isSaving ? "Updating..." : "Update"}
                            </motion.button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
