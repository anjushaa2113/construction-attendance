import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const ADMIN_API = import.meta.env.VITE_ADMIN_API_URL || 'https://localhost:7008';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
};

function formatShortDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── Web Audio pop sound (no external deps) ────────────────────────────────────
function playPopSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = ctx.createOscillator();
        const gainNode   = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type      = 'sine';
        oscillator.frequency.setValueAtTime(880, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.3);
    } catch (e) {
        // AudioContext not available — silently ignore
    }
}

export function useNotifications() {
    const navigate               = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading]             = useState(true);
    const [open, setOpen]                   = useState(false);
    const prevCountRef                      = useRef(null); // track count across polls
    const panelRef                          = useRef(null);

    const fetchNotifications = useCallback(async () => {
        try {
            const headers = getAuthHeaders();

            const [leaveRes, corrRes] = await Promise.all([
                fetch(`${ADMIN_API}/api/admin/leaves/pending`, { headers }),
                fetch(`${ADMIN_API}/api/admin/attendance-corrections?status=0`, { headers }),
            ]);

            const leaveList = leaveRes.ok ? await leaveRes.json() : [];
            const corrList  = corrRes.ok  ? await corrRes.json()  : [];

            const leaveNotifs = leaveList.map(leave => ({
                id:       `leave-${leave.leaveId}`,
                type:     'leave',
                recordId: leave.leaveId,
                title:    `${leave.employeeName ?? 'Employee'} – ${leave.leaveTypeName || 'Leave'} Request`,
                message:  `${formatShortDate(leave.startDate)} → ${formatShortDate(leave.endDate)}${leave.reason ? ` · "${leave.reason}"` : ''}`,
                time:     leave.requestedAt ?? leave.startDate,
                read:     false,
            }));

            const corrNotifs = corrList.map(corr => ({
                id:       `corr-${corr.id}`,
                type:     'attendance',
                recordId: corr.id,
                title:    `${corr.employeeName ?? 'Employee'} – Attendance Correction`,
                message:  `Correction for ${formatShortDate(corr.correctionDate)} · "${corr.reason}"`,
                time:     corr.correctionDate,
                read:     false,
            }));

            const all = [...leaveNotifs, ...corrNotifs].sort(
                (a, b) => new Date(b.time) - new Date(a.time)
            );

            setNotifications(prev => {
                // Preserve read state across re-fetches
                const readIds = new Set(prev.filter(n => n.read).map(n => n.id));
                const merged  = all.map(n => ({ ...n, read: readIds.has(n.id) }));

                // Play sound if new notifications appeared
                const newCount = merged.filter(n => !n.read).length;
                if (prevCountRef.current !== null && newCount > prevCountRef.current) {
                    playPopSound();
                }
                prevCountRef.current = newCount;

                return merged;
            });
        } catch (err) {
            console.error('Notifications fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial fetch + poll every 60 seconds
    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60_000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    // Close panel on outside click
    useEffect(() => {
        const handler = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const markRead    = (id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    const markAllRead = ()   => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    const dismiss     = (id) => setNotifications(prev => prev.filter(n => n.id !== id));

    const handleNavigate = (notif) => {
        setOpen(false);
        markRead(notif.id);
        if (notif.type === 'leave') {
            navigate(`/admin/leaves?leaveId=${notif.recordId}`);
        } else {
            navigate(`/admin/attendance?correctionId=${notif.recordId}`);
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return {
        notifications, loading, open, setOpen,
        unreadCount, panelRef,
        markRead, markAllRead, dismiss, handleNavigate,
    };
}