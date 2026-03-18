import { useState } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import {
    LayoutDashboard, Calendar, Clock, FileBarChart,
    Settings, CircleUser, Bell, FileText, CheckCheck, X
} from "lucide-react";
import useAuth from "../hooks/useAuth";
import { useLanguage } from "../context/LanguageContext";
import ProfilePopup from "../components/ui/ProfilePopup";
import { useEmployeeNotifications } from "../hooks/useEmployeeNotifications";

// ── Route labels ──────────────────────────────────────────────────────────────
const ROUTE_LABELS = {
    "/employee/dashboard":             "Dashboard",
    "/employee/leave-request":         "Leave Request",
    "/employee/attendance-correction": "Attendance Correction",
    "/employee/reports":               "Reports",
    "/employee/settings":              "Settings",
};

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

// ── Status colour helper ──────────────────────────────────────────────────────
const STATUS_STYLES = {
    Approved:  { dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    Rejected:  { dot: 'bg-red-500',     badge: 'bg-red-50 text-red-700 border-red-200'             },
    Cancelled: { dot: 'bg-gray-400',    badge: 'bg-gray-50 text-gray-600 border-gray-200'          },
};

// ── TYPE styles ───────────────────────────────────────────────────────────────
const TYPE_STYLES = {
    leave:      { bg: 'bg-blue-100',   text: 'text-blue-700',   label: 'Leave',      Icon: FileText },
    attendance: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Attendance', Icon: Clock    },
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
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-14 text-slate-400">
                        <CheckCheck className="h-8 w-8 mb-2 opacity-30" />
                        <p className="text-sm font-medium">All caught up!</p>
                        <p className="text-xs mt-1 text-center px-4">
                            Approved &amp; rejected requests will appear here.
                        </p>
                    </div>
                ) : (
                    notifications.map(notif => {
                        const typeStyle   = TYPE_STYLES[notif.type]     || TYPE_STYLES.leave;
                        const statusStyle = STATUS_STYLES[notif.status] || STATUS_STYLES.Approved;
                        const { Icon }    = typeStyle;

                        return (
                            <div
                                key={notif.id}
                                onClick={() => onNavigate(notif)}
                                className={`
                                    relative flex items-start gap-3 px-5 py-4 cursor-pointer
                                    transition-colors hover:bg-slate-50
                                    ${!notif.read ? 'bg-blue-50/40' : ''}
                                `}
                            >
                                {/* Unread left border */}
                                {!notif.read && (
                                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500 rounded-r" />
                                )}

                                {/* Icon */}
                                <div className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${typeStyle.bg}`}>
                                    <Icon className={`h-3.5 w-3.5 ${typeStyle.text}`} />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        {/* Type badge */}
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${typeStyle.bg} ${typeStyle.text}`}>
                                            {typeStyle.label}
                                        </span>
                                        {/* Status badge */}
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${statusStyle.badge}`}>
                                            <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${statusStyle.dot}`} />
                                            {notif.status}
                                        </span>
                                        <span className="text-[11px] text-slate-400 ml-auto shrink-0">
                                            {timeAgo(notif.time)}
                                        </span>
                                    </div>
                                    <p className={`text-sm font-semibold leading-snug ${notif.read ? 'text-slate-500' : 'text-slate-800'}`}>
                                        {notif.title}
                                    </p>
                                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed line-clamp-2">
                                        {notif.message}
                                    </p>
                                    <p className="text-[11px] text-blue-500 font-semibold mt-1.5">
                                        View in My Requests →
                                    </p>
                                </div>

                                {/* Dismiss */}
                                <button
                                    onClick={e => { e.stopPropagation(); onDismiss(notif.id); }}
                                    className="shrink-0 mt-0.5 p-1 text-slate-300 hover:text-slate-500 transition-colors rounded"
                                    title="Dismiss"
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
                <div className="px-5 py-3 border-t border-slate-100 text-center">
                    <p className="text-xs text-slate-400">
                        {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
                    </p>
                </div>
            )}
        </div>
    );
};

// ── Layout ────────────────────────────────────────────────────────────────────
const EmployeeLayout = () => {
    const { user }     = useAuth();
    const { t }        = useLanguage();
    const location     = useLocation();
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const pageTitle = ROUTE_LABELS[location.pathname] || "Employee Portal";

    const {
        notifications, loading, open, setOpen,
        unreadCount, panelRef,
        markRead, markAllRead, dismiss, handleNavigate,
    } = useEmployeeNotifications();

    const navItems = [
        { path: "/employee/dashboard",             label: t.dashboard            || "Dashboard",             icon: <LayoutDashboard className="h-5 w-5" /> },
        { path: "/employee/leave-request",         label: t.leaveRequest         || "Leave Request",         icon: <Calendar className="h-5 w-5" /> },
        { path: "/employee/attendance-correction", label: t.attendanceCorrection || "Attendance Correction", icon: <Clock className="h-5 w-5" /> },
        { path: "/employee/reports",               label: t.reports              || "Reports",               icon: <FileBarChart className="h-5 w-5" /> },
    ];

    const navClass = ({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 rounded-xl group ${
            isActive
                ? "bg-accent-600 text-white shadow-md shadow-accent-100 translate-x-1"
                : "text-slate-500 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-800 hover:text-slate-900 dark:hover:text-gray-100"
        }`;

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-gray-900">

            {/* ── Sidebar ── */}
            <aside className="w-64 bg-white dark:bg-gray-900 border-r border-slate-200/50 dark:border-gray-700 flex flex-col h-full shrink-0 z-30">
                <nav className="flex-1 py-4 flex flex-col gap-1 px-4 overflow-y-auto">
                    {navItems.map((item) => (
                        <NavLink key={item.path} to={item.path} className={navClass}>
                            <div className="transition-transform group-hover:scale-110">{item.icon}</div>
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-200/50 dark:border-gray-700">
                    <NavLink to="/employee/settings" className={navClass}>
                        <div className="transition-transform group-hover:scale-110">
                            <Settings className="h-5 w-5" />
                        </div>
                        <span>{t.settings || "Settings"}</span>
                    </NavLink>
                </div>
            </aside>

            {/* ── Main ── */}
            <div className="flex-1 flex flex-col overflow-hidden">

                {/* ── Topbar ── */}
                <header className="h-16 bg-white dark:bg-gray-900 border-b border-slate-200/50 dark:border-gray-700 flex items-center justify-between px-8 z-20 sticky top-0">
                    <h1 className="text-lg font-bold text-slate-800 dark:text-gray-100 tracking-tight">
                        Employee Portal
                    </h1>

                    <div className="flex items-center gap-3">

                        {/* ── Notification Bell ── */}
                        <div className="relative" ref={panelRef}>
                            <button
                                onClick={() => setOpen(prev => !prev)}
                                className={`
                                    relative flex items-center justify-center w-10 h-10 rounded-xl border transition-all duration-200
                                    ${open
                                        ? 'bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-200'
                                        : 'bg-slate-50 dark:bg-gray-800 text-slate-600 dark:text-gray-300 border-slate-200 dark:border-gray-700 hover:border-blue-300 hover:text-blue-600'
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

                            {/* ── Dropdown Panel ── */}
                            {open && (
                                <div className="
                                    absolute right-0 top-[calc(100%+10px)] z-50
                                    w-96 bg-white rounded-2xl shadow-xl shadow-slate-200/60
                                    border border-slate-100 overflow-hidden
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
                        <div className="flex items-center gap-3 px-3 py-1.5 bg-slate-50 dark:bg-gray-800 rounded-full border border-slate-100 dark:border-gray-700">
                            <div className="text-right hidden sm:block">
                                <p className="text-xs font-bold text-slate-900 dark:text-gray-100 leading-none">
                                    {user?.name || "Employee"}
                                </p>
                                <p className="text-[10px] text-slate-500 dark:text-gray-400 mt-0.5">
                                    {user?.email || "employee@example.com"}
                                </p>
                            </div>
                            <div className="relative">
                                <button
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                    className="w-9 h-9 flex items-center justify-center bg-white dark:bg-gray-700 rounded-full text-slate-600 dark:text-gray-200 hover:text-blue-600 shadow-sm border border-slate-200 dark:border-gray-600 transition-all hover:scale-105"
                                >
                                    <CircleUser className="h-5 w-5" />
                                </button>
                                <ProfilePopup
                                    isOpen={isProfileOpen}
                                    onClose={() => setIsProfileOpen(false)}
                                    settingsPath="/employee/settings"
                                />
                            </div>
                        </div>

                    </div>
                </header>

                {/* ── Page content ── */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 dark:bg-gray-900 p-10">
                    <div className="max-w-[1400px] mx-auto animate-fade-in">
                        <div className="flex items-center gap-2 text-slate-400 dark:text-gray-500 text-sm mb-6">
                            <Calendar className="h-4 w-4" />
                            <span className="font-medium text-slate-600 dark:text-gray-300">{pageTitle}</span>
                        </div>
                        <Outlet />
                    </div>
                </main>

            </div>
        </div>
    );
};

export default EmployeeLayout;