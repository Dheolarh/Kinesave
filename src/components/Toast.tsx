import { AnimatePresence, motion } from 'motion/react';
import { Bell } from 'lucide-react';
import { useState, useEffect } from 'react';

interface ToastMessage {
    id: string;
    title: string;
    message: string;
}

export function ToastContainer() {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    useEffect(() => {
        const handleToastEvent = (event: CustomEvent) => {
            const id = `toast_${Date.now()}`;
            const newToast: ToastMessage = {
                id,
                title: event.detail.title,
                message: event.detail.message
            };

            setToasts(prev => [newToast, ...prev]);

            // Auto-dismiss after 3 seconds
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, 3000);
        };

        window.addEventListener('show-toast', handleToastEvent as EventListener);
        return () => {
            window.removeEventListener('show-toast', handleToastEvent as EventListener);
        };
    }, []);

    return (
        <AnimatePresence>
            {toasts.map((toast) => (
                <motion.div
                    key={toast.id}
                    className="fixed top-6 left-5 right-5 bg-black/90 backdrop-blur-xl text-white px-5 py-4 rounded-2xl z-50 flex items-center gap-3 shadow-2xl border border-white/10"
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -100, opacity: 0 }}
                    transition={{ type: "spring", damping: 20 }}
                >
                    <Bell className="w-5 h-5" strokeWidth={1.5} />
                    <div className="flex-1">
                        <div className="text-sm mb-0.5">{toast.title}</div>
                        <div className="text-xs text-white/70">
                            {toast.message}
                        </div>
                    </div>
                </motion.div>
            ))}
        </AnimatePresence>
    );
}
