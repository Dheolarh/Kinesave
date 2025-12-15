import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Trash2, BellOff, CheckCircle, Sun, Lightbulb, Zap, CloudSun, Bell } from 'lucide-react';
import notificationService from '../services/notification.service';
import type { Notification } from '../types/notification.types';

interface NotificationCenterProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (isOpen) {
            loadNotifications();
        }
    }, [isOpen]);

    const loadNotifications = () => {
        const allNotifications = notificationService.getAll();
        setNotifications(allNotifications);
        setUnreadCount(notificationService.getUnreadCount());
    };

    const handleMarkAsRead = (id: string) => {
        notificationService.markAsRead(id);
        loadNotifications();
    };

    const handleMarkAllAsRead = () => {
        notificationService.markAllAsRead();
        loadNotifications();
    };

    const handleDelete = (id: string) => {
        notificationService.delete(id);
        loadNotifications();
    };

    const handleClearAll = () => {
        notificationService.clearAll();
        loadNotifications();
    };

    const getNotificationIcon = (type: string) => {
        const iconClass = "w-5 h-5";
        switch (type) {
            case 'plan_selected':
                return <CheckCircle className={iconClass} strokeWidth={1.5} />;
            case 'daily_reminder':
                return <Sun className={iconClass} strokeWidth={1.5} />;
            case 'device_tip':
                return <Lightbulb className={iconClass} strokeWidth={1.5} />;
            case 'usage_alert':
                return <Zap className={iconClass} strokeWidth={1.5} />;
            case 'weather_advisory':
                return <CloudSun className={iconClass} strokeWidth={1.5} />;
            default:
                return <Bell className={iconClass} strokeWidth={1.5} />;
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 bg-black/20 z-40"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Modal Panel */}
                    <motion.div
                        className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-2xl rounded-t-3xl z-50 border-t border-white/60 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] flex flex-col"
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        style={{ maxHeight: "75vh" }}
                    >
                        {/* Header */}
                        <div className="px-6 pt-6 mb-2 flex-shrink-0 flex items-center justify-between">
                            <h2 className="text-xl tracking-tight">Notifications</h2>
                            <button
                                onClick={onClose}
                                className="w-8 h-8 rounded-full border border-black/10 flex items-center justify-center hover:border-black/20 transition-colors"
                            >
                                <X className="w-4 h-4" strokeWidth={1.5} />
                            </button>
                        </div>

                        {/* Action Buttons - Fixed, not scrollable */}
                        {notifications.length > 0 && (
                            <div className="px-6 mb-2 flex-shrink-0">
                                <div className="flex items-center justify-between">
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={handleMarkAllAsRead}
                                            className="px-3 py-1.5 bg-black/5 hover:bg-black/10 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5"
                                        >
                                            <Check className="w-3 h-3" />
                                            Mark all read
                                        </button>
                                    )}
                                    <button
                                        onClick={handleClearAll}
                                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 ml-auto"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                        Clear all
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Scrollable Content */}
                        <div className="px-4 pb-6 flex-1 overflow-y-auto scrollbar-hide">
                            <div className="space-y-3 pt-4">

                                {/* Notifications List */}
                                {notifications.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-center">
                                        <div className="w-20 h-20 bg-black/5 rounded-full flex items-center justify-center mb-4">
                                            <BellOff className="w-10 h-10 text-black/30" strokeWidth={1.5} />
                                        </div>
                                        <h3 className="text-lg font-medium mb-1">No notifications</h3>
                                        <p className="text-sm text-black/50">You're all caught up!</p>
                                    </div>
                                ) : (
                                    notifications.map((notification) => (
                                        <motion.div
                                            key={notification.id}
                                            layout
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, x: -100 }}
                                            className={`flex gap-3 p-4 rounded-2xl border shadow-lg transition-all ${notification.read
                                                    ? 'bg-white/60 border-white/40'
                                                    : 'bg-white/80 border-white/60'
                                                }`}
                                        >
                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2 mb-1">
                                                    <h4 className="text-sm font-medium leading-tight">{notification.title.replace(/✅|✓|☑️|✔️|🎉|💡|⚡|🔔/g, '').trim()}</h4>
                                                    {!notification.read && (
                                                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                                                    )}
                                                </div>
                                                <p className="text-xs text-black/60 leading-relaxed mb-2">
                                                    {notification.message}
                                                </p>
                                                <div className="flex items-center justify-between">
                                                    <p className="text-xs text-black/40">
                                                        {new Date(notification.timestamp).toLocaleString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            hour: 'numeric',
                                                            minute: '2-digit',
                                                        })}
                                                    </p>
                                                    <div className="flex gap-2">
                                                        {!notification.read && (
                                                            <button
                                                                onClick={() => handleMarkAsRead(notification.id)}
                                                                className="text-xs text-black/50 hover:text-black underline"
                                                            >
                                                                Mark read
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleDelete(notification.id)}
                                                            className="text-xs text-red-500 hover:text-red-700 underline"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Icon on the right */}
                                            <div className="flex-shrink-0">
                                                {getNotificationIcon(notification.type)}
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
