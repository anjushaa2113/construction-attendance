import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';

const STORAGE_KEY = 'employee_notifications_dismissed';
const READ_KEY    = 'employee_notifications_read';

const loadSet = (key) => {
    try { return new Set(JSON.parse(localStorage.getItem(key) || '[]')); }
    catch { return new Set(); }
};
const saveSet = (key, set) => {
    localStorage.setItem(key, JSON.stringify([...set]));
};

const makeId = (type, recordId, status) => `${type}-${recordId}-${status}`;

const resolveStatus = (raw) => {
    if (typeof raw === 'number') {
        return { 0: 'Pending', 1: 'Approved', 2: 'Rejected', 3: 'Cancelled' }[raw] ?? 'Unknown';
    }
    return String(raw);
};

const isTerminal = (status) => {
    const s = resolveStatus(status).toLowerCase();
    return s === 'approved' || s === 'rejected' || s === 'cancelled';
};

export function useEmployeeNotifications() {
    const navigate = useNavigate();
    const panelRef = useRef(null);

    const [open,          setOpen]          = useState(false);
    const [loading,       setLoading]       = useState(false);
    const [notifications, setNotifications] = useState([]);

    const dismissedRef = useRef(loadSet(STORAGE_KEY));
    const readRef      = useRef(loadSet(READ_KEY));

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const [leaveRes, correctionRes] = await Promise.allSettled([
                apiClient.get('/Leave/my'),
                apiClient.get('/AttendanceCorrections'),
            ]);

            const leaves = leaveRes.status === 'fulfilled'
                ? (Array.isArray(leaveRes.value.data) ? leaveRes.value.data : leaveRes.value.data?.data ?? [])
                : [];
            const corrections = correctionRes.status === 'fulfilled'
                ? (Array.isArray(correctionRes.value.data) ? correctionRes.value.data : correctionRes.value.data?.data ?? [])
                : [];

            const built = [];

            // ── Leave notifications ──
            for (const l of leaves) {
                const status   = resolveStatus(l.status ?? l.Status ?? 0);
                if (!isTerminal(status)) continue;

                const recordId = String(l.leaveId ?? l.id ?? '');
                const id       = makeId('leave', recordId, status);
                if (dismissedRef.current.has(id)) continue;

                const ltName   = l.leaveTypeName ?? l.leaveType?.name ?? 'Leave';
                const fromDate = l.startDate ?? l.fromDate;
                const toDate   = l.endDate   ?? l.toDate;
                const dateStr  = fromDate
                    ? `${new Date(fromDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}${toDate && toDate !== fromDate ? ` → ${new Date(toDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}` : ''}`
                    : '';

                built.push({
                    id,
                    recordId,
                    type:     'leave',
                    status,
                    title:    `Leave Request ${status}`,
                    message:  `${ltName}${dateStr ? ` · ${dateStr}` : ''}`,
                    time:     l.updatedAt ?? l.approvedAt ?? l.requestedAt ?? l.appliedAt,
                    read:     readRef.current.has(id),
                    path:     '/employee/leave-request',
                    tab:      'history',
                    paramKey: 'leaveId',       // → ?leaveId=<recordId>
                });
            }

            // ── Attendance correction notifications ──
            for (const c of corrections) {
                const status   = resolveStatus(c.status ?? c.Status ?? 0);
                if (!isTerminal(status)) continue;

                const recordId = String(c.correctionId ?? c.id ?? '');
                const id       = makeId('attendance', recordId, status);
                if (dismissedRef.current.has(id)) continue;

                const dateStr  = c.correctionDate ?? c.attendance?.attendanceDate ?? c.requestedAt;

                built.push({
                    id,
                    recordId,
                    type:     'attendance',
                    status,
                    title:    `Attendance Correction ${status}`,
                    message:  dateStr
                        ? `For ${new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`
                        : 'Attendance correction request',
                    time:     c.approvedAt ?? c.updatedAt ?? c.requestedAt,
                    read:     readRef.current.has(id),
                    path:     '/employee/attendance-correction',
                    tab:      'history',
                    paramKey: 'correctionId',  // → ?correctionId=<recordId>
                });
            }

            built.sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));
            setNotifications(built);
        } catch {
            // silently fail — notifications are non-critical
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchNotifications(); }, [fetchNotifications]);
    useEffect(() => { if (open) fetchNotifications(); }, [open, fetchNotifications]);

    // Close on outside click
    useEffect(() => {
        const handler = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
        };
        if (open) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const markRead = useCallback((id) => {
        readRef.current.add(id);
        saveSet(READ_KEY, readRef.current);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    }, []);

    const markAllRead = useCallback(() => {
        setNotifications(prev => {
            prev.forEach(n => readRef.current.add(n.id));
            saveSet(READ_KEY, readRef.current);
            return prev.map(n => ({ ...n, read: true }));
        });
    }, []);

    const dismiss = useCallback((id) => {
        dismissedRef.current.add(id);
        saveSet(STORAGE_KEY, dismissedRef.current);
        readRef.current.add(id);
        saveSet(READ_KEY, readRef.current);
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    // Navigate to the exact record: e.g. /employee/leave-request?tab=history&leaveId=abc-123
    const handleNavigate = useCallback((notif) => {
        markRead(notif.id);
        setOpen(false);
        navigate(`${notif.path}?tab=${notif.tab}&${notif.paramKey}=${notif.recordId}`);
    }, [navigate, markRead]);

    const unreadCount = notifications.filter(n => !n.read).length;

    return {
        notifications, loading, open, setOpen,
        unreadCount, panelRef,
        markRead, markAllRead, dismiss, handleNavigate,
        refresh: fetchNotifications,
    };
}