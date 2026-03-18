import React from 'react';
import { CircleUser, Bell, FileText, Clock, CheckCheck, X } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import ProfilePopup from '../ui/ProfilePopup';
import { useState } from 'react';
import { useNotifications } from '../../hooks/useNotifications';

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(dateStr) {
    if (!dateStr) return '—';
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (isNaN(diff) || diff < 0) return '—';
    if (diff < 60)    return 'Just now';
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

const TYPE_STYLES = {
    leave:      { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Leave'      },
    attendance: { bg: 'bg-blue-100',   text: 'text-blue-700',   label: 'Attendance' },
};

// ── Notification Panel ────────────────────────────────────────────────────────

const NotificationPanel = ({ notifications, loading, onMarkRead, onMarkAllRead, onDismiss, onNavigate }) => {
    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                    <Bell className="h-4 w-4 text-slate-600" />
                    <h3 className="font-bold text-slate-800 text-sm">Notifications</h3>
                    {unreadCount > 0 && (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-bold">
                            {unreadCount}
                        </span>
                    )}
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={onMarkAllRead}
                        className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 font-semibold transition-colors"
                    >
                        <CheckCheck className="h-3.5 w-3.5" />
                        Mark all read
                    </button>
                )}
            </div>

            {/* List */}
            <div className="overflow-y-auto divide-y divide-slate-50 max-h-[420px]">
                {loading ? (
                    <div className="space-y-3 p-4">
                        {[1,2,3].map(i => (
                            <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-14 text-slate-400">
                        <Bell className="h-8 w-8 mb-2 opacity-30" />
                        <p className="text-sm font-medium">All caught up!</p>
                        <p className="text-xs mt-1">No pending requests</p>
                    </div>
                ) : (
                    notifications.map(notif => {
                        const style = TYPE_STYLES[notif.type] || TYPE_STYLES.leave;
                        const Icon  = notif.type === 'leave' ? FileText : Clock;
                        return (
                            <div
                                key={notif.id}
                                onClick={() => { onMarkRead(notif.id); onNavigate(notif); }}
                                className={`
                                    relative flex items-start gap-3 px-5 py-4 cursor-pointer
                                    transition-colors hover:bg-slate-50
                                    ${!notif.read ? 'bg-blue-50/40' : ''}
                                `}
                            >
                                {!notif.read && (
                                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500 rounded-r" />
                                )}
                                <div className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${style.bg}`}>
                                    <Icon className={`h-3.5 w-3.5 ${style.text}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${style.bg} ${style.text}`}>
                                            {style.label}
                                        </span>
                                        <span className="text-[11px] text-slate-400 ml-auto shrink-0">{timeAgo(notif.time)}</span>
                                    </div>
                                    <p className={`text-sm font-semibold leading-snug ${notif.read ? 'text-slate-500' : 'text-slate-800'}`}>
                                        {notif.title}
                                    </p>
                                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed line-clamp-2">
                                        {notif.message}
                                    </p>
                                    <p className="text-[11px] text-blue-500 font-semibold mt-1.5">
                                        View &amp; approve →
                                    </p>
                                </div>
                                <button
                                    onClick={e => { e.stopPropagation(); onDismiss(notif.id); }}
                                    className="shrink-0 mt-0.5 p-1 text-slate-300 hover:text-slate-500 transition-colors rounded"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Footer */}
            {!loading && notifications.length > 0 && (
                <div className="px-5 py-3 border-t border-slate-100">
                    <p className="text-xs text-slate-400 text-center">
                        {notifications.length} pending request{notifications.length !== 1 ? 's' : ''}
                    </p>
                </div>
            )}
        </div>
    );
};

// ── Topbar ────────────────────────────────────────────────────────────────────

const Topbar = () => {
    const { user } = useAuth();
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const {
        notifications, loading, open, setOpen,
        unreadCount, panelRef,
        markRead, markAllRead, dismiss, handleNavigate,
    } = useNotifications();

    return (
        <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-8 z-20 sticky top-0 transition-all duration-200">
            <div className="flex items-center gap-4">
                <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100 tracking-tight">Admin Portal</h1>
            </div>

            <div className="flex items-center gap-3">

                {/* ── Notification Bell ── */}
                <div className="relative" ref={panelRef}>
                    <button
                        onClick={() => setOpen(prev => !prev)}
                        className={`
                            relative flex items-center justify-center w-10 h-10 rounded-xl border transition-all duration-200
                            ${open
                                ? 'bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-200'
                                : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:text-blue-600'
                            }
                        `}
                        title="Notifications"
                    >
                        <Bell className="h-4 w-4" />
                        {unreadCount > 0 && (
                            <span className={`
                                absolute -top-1.5 -right-1.5
                                inline-flex items-center justify-center min-w-[18px] h-[18px] px-1
                                rounded-full text-[10px] font-bold
                                ${open ? 'bg-white text-blue-500' : 'bg-blue-500 text-white'}
                                animate-bounce
                            `}>
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {/* Dropdown panel */}
                    {open && (
                        <div className="
                            absolute right-0 top-[calc(100%+10px)] z-50
                            w-96 bg-white rounded-2xl shadow-xl shadow-slate-200/60
                            border border-slate-100 overflow-hidden
                            animate-in fade-in slide-in-from-top-2 duration-150
                        ">
                            <NotificationPanel
                                notifications={notifications}
                                loading={loading}
                                onMarkRead={markRead}
                                onMarkAllRead={markAllRead}
                                onDismiss={dismiss}
                                onNavigate={handleNavigate}
                            />
                        </div>
                    )}
                </div>

                {/* ── Profile ── */}
                <div className="flex items-center gap-3 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-full border border-gray-100 dark:border-gray-700">
                    <div className="text-right hidden sm:block">
                        <p className="text-xs font-bold text-gray-900 dark:text-gray-100 leading-none">{user?.name || 'Admin'}</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{user?.email || 'admin@example.com'}</p>
                    </div>
                    <div className="relative">
                        <button
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className="w-9 h-9 flex items-center justify-center bg-white dark:bg-gray-700 rounded-full text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 shadow-sm border border-gray-200 dark:border-gray-600 transition-all hover:scale-105"
                        >
                            <CircleUser className="h-5 w-5" />
                        </button>
                        <ProfilePopup
                            isOpen={isProfileOpen}
                            onClose={() => setIsProfileOpen(false)}
                        />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Topbar;