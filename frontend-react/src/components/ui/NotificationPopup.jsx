import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Clock, User, Bell, CheckCheck } from 'lucide-react';

const ADMIN_API = import.meta.env.VITE_ADMIN_API_URL || 'https://localhost:7008';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

function timeAgo(dateStr) {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days  = Math.floor(hours / 24);
    if (days > 0)  return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (mins > 0)  return `${mins}m ago`;
    return 'Just now';
}

const NotificationPopup = ({ isOpen, onClose }) => {
    const popupRef  = useRef(null);
    const navigate  = useNavigate();

    const [leaves,      setLeaves]      = useState([]);
    const [corrections, setCorrections] = useState([]);
    const [loading,     setLoading]     = useState(false);

    const fetchNotifications = useCallback(async () => {
        if (!isOpen) return;
        setLoading(true);
        try {
            const [leaveRes, correctionRes] = await Promise.all([
                fetch(`${ADMIN_API}/api/admin/leaves/pending`,                    { headers: getAuthHeaders() }),
                fetch(`${ADMIN_API}/api/admin/attendance-corrections?status=0`,   { headers: getAuthHeaders() }),
            ]);
            const leaveData      = leaveRes.ok      ? await leaveRes.json()      : [];
            const correctionData = correctionRes.ok ? await correctionRes.json() : [];
            setLeaves(Array.isArray(leaveData)      ? leaveData      : leaveData.leaves ?? []);
            setCorrections(Array.isArray(correctionData) ? correctionData : correctionData.data ?? []);
        } catch {
            // silently fail — notification panel is non-critical
        } finally {
            setLoading(false);
        }
    }, [isOpen]);

    useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (popupRef.current && !popupRef.current.contains(e.target)) onClose();
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return ()  => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    // Build unified notification list
    const notifications = [
        ...leaves.map(l => ({
            id:      l.leaveId ?? l.id,
            type:    'LEAVE',
            user:    l.employeeName ?? l.empName ?? 'Employee',
            message: `${l.leaveTypeName ?? 'Leave'} · ${l.startDate ? new Date(l.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : ''} → ${l.endDate ? new Date(l.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : ''} · "${l.reason ?? ''}"`,
            time:    timeAgo(l.requestedAt ?? l.appliedAt),
            onClick: () => {
                // ✅ FIX: Use the correct admin route with leaveId param
                const leaveId = l.leaveId ?? l.id;
                navigate(`/admin/leave-approval?leaveId=${leaveId}`);
                onClose();
            },
        })),
        ...corrections.map(c => ({
            id:      c.id ?? c.correctionId,
            type:    'ATTENDANCE',
            user:    c.employee?.name ?? c.employeeName ?? 'Employee',
            message: `Attendance correction · ${c.correctionDate ? new Date(c.correctionDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : ''}`,
            time:    timeAgo(c.requestedAt ?? c.correctionDate),
            onClick: () => {
                // ✅ FIX: Use the correct admin route with correctionId param
                const correctionId = c.id ?? c.correctionId;
                navigate(`/admin/attendance-approval?correctionId=${correctionId}`);
                onClose();
            },
        })),
    ];

    const total = notifications.length;

    return (
        <div
            ref={popupRef}
            className="fixed inset-x-4 top-20 sm:absolute sm:inset-auto sm:right-0 sm:top-14 sm:w-80 md:w-96 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden"
        >
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
                <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-slate-600" />
                    <h3 className="font-bold text-slate-800">Notifications</h3>
                    {total > 0 && (
                        <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            {total}
                        </span>
                    )}
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                    <X className="h-4 w-4" />
                </button>
            </div>

            {/* Body */}
            <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-50">
                {loading ? (
                    <div className="flex items-center justify-center py-10 gap-2 text-slate-400">
                        <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm">Loading...</span>
                    </div>
                ) : total === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-400">
                        <CheckCheck className="h-8 w-8 text-emerald-400" />
                        <p className="text-sm font-medium">All caught up!</p>
                        <p className="text-xs">No pending requests.</p>
                    </div>
                ) : (
                    notifications.map((n) => (
                        <button
                            key={`${n.type}-${n.id}`}
                            onClick={n.onClick}
                            className="w-full text-left px-5 py-4 hover:bg-slate-50 transition-colors flex items-start gap-3"
                        >
                            <div className={`p-2 rounded-full flex-shrink-0 mt-0.5 ${
                                n.type === 'LEAVE'
                                    ? 'bg-blue-100 text-blue-600'
                                    : 'bg-orange-100 text-orange-600'
                            }`}>
                                {n.type === 'LEAVE'
                                    ? <User className="h-3.5 w-3.5" />
                                    : <Clock className="h-3.5 w-3.5" />
                                }
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-0.5">
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                        n.type === 'LEAVE'
                                            ? 'bg-blue-50 text-blue-600'
                                            : 'bg-orange-50 text-orange-600'
                                    }`}>
                                        {n.type === 'LEAVE' ? 'Leave' : 'Attendance'}
                                    </span>
                                    <span className="text-xs text-slate-400 flex-shrink-0">{n.time}</span>
                                </div>
                                <p className="text-sm font-semibold text-slate-800 truncate">{n.user}</p>
                                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">{n.message}</p>
                                <span className="text-xs text-blue-500 font-semibold mt-1 inline-block">
                                    View & approve →
                                </span>
                            </div>
                        </button>
                    ))
                )}
            </div>

            {/* Footer */}
            {total > 0 && (
                <div className="px-5 py-3 border-t border-gray-100 bg-slate-50 flex justify-between items-center">
                    <span className="text-xs text-slate-400">{total} pending request{total !== 1 ? 's' : ''}</span>
                    <button
                        onClick={() => { navigate('/admin/leave-approval'); onClose(); }}
                        className="text-xs text-blue-600 hover:text-blue-800 font-semibold transition-colors"
                    >
                        View all →
                    </button>
                </div>
            )}
        </div>
    );
};

export default NotificationPopup;