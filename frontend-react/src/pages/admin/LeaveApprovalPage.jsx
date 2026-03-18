import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import Breadcrumb from '../../components/layout/Breadcrumb';
import { Bell, Check, ChevronLeft, ChevronRight, Loader2, AlertCircle, Calendar, User, Briefcase, FileText, X } from 'lucide-react';

const ADMIN_API = import.meta.env.VITE_ADMIN_API_URL || 'https://localhost:7008';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

function formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
    });
}

function daysBetween(from, to) {
    if (!from || !to) return 0;
    const diff = new Date(to) - new Date(from);
    return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)) + 1);
}

// ── compact read-only field ────────────────────────────────────────────────────
function ReadField({ label, value, icon: Icon }) {
    return (
        <div className="space-y-1">
            <label className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                {Icon && <Icon className="h-3 w-3" />}
                {label}
            </label>
            <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium min-h-[30px] flex items-center">
                {value || '—'}
            </div>
        </div>
    );
}

// ── confirm popup ──────────────────────────────────────────────────────────────
function ConfirmPopup({ action, employeeName, days, onConfirm, onCancel, loading }) {
    const isApprove = action === 'approve';
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
                <div className="px-6 pt-8 pb-4 flex flex-col items-center text-center">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 ${isApprove ? 'bg-emerald-100' : 'bg-red-100'}`}>
                        {isApprove
                            ? <Check className="h-7 w-7 text-emerald-500" />
                            : <X    className="h-7 w-7 text-red-500" />}
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                        {isApprove ? 'Approve Leave?' : 'Reject Leave?'}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                        You are about to{' '}
                        <span className={`font-semibold ${isApprove ? 'text-emerald-600' : 'text-red-500'}`}>
                            {isApprove ? 'approve' : 'reject'}
                        </span>{' '}
                        the leave request for{' '}
                        <span className="font-semibold text-slate-700">{employeeName}</span>
                        {days > 0 && <> — <span className="font-semibold text-slate-700">{days} day{days !== 1 ? 's' : ''}</span></>}.
                    </p>
                </div>
                <div className="border-t border-slate-100 mx-6" />
                <div className="px-6 py-4 flex gap-3">
                    <button onClick={onCancel} disabled={loading}
                        className="flex-1 h-10 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50">
                        Cancel
                    </button>
                    <button onClick={onConfirm} disabled={loading}
                        className={`flex-1 h-10 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${isApprove ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : isApprove ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                        {isApprove ? 'Yes, Approve' : 'Yes, Reject'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── toast ──────────────────────────────────────────────────────────────────────
function Toast({ toast }) {
    if (!toast) return null;
    const isSuccess = toast.type === 'success';
    return (
        <div className={`fixed top-6 right-6 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-semibold border ${isSuccess ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-red-500 text-white border-red-400'}`}
            style={{ minWidth: 260 }}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${isSuccess ? 'bg-emerald-400' : 'bg-red-400'}`}>
                {isSuccess ? <Check className="h-3.5 w-3.5 text-white" /> : <AlertCircle className="h-3.5 w-3.5 text-white" />}
            </div>
            {toast.message}
        </div>
    );
}

// ── main page ──────────────────────────────────────────────────────────────────
const LeaveApprovalPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    const [requests, setRequests]           = useState([]);
    const [loading, setLoading]             = useState(true);
    const [error, setError]                 = useState(null);
    const [currentIndex, setCurrentIndex]   = useState(0);
    const [actionLoading, setActionLoading] = useState(null);
    const [toast, setToast]                 = useState(null);
    const [confirmAction, setConfirmAction] = useState(null);

    const fetchPending = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const res = await fetch(`${ADMIN_API}/api/admin/leaves/pending`, { headers: getAuthHeaders() });
            if (!res.ok) throw new Error(`Failed to load leave requests (${res.status})`);
            const data = await res.json();
            setRequests(Array.isArray(data) ? data : data.leaves ?? data.data ?? []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchPending(); }, [fetchPending]);

    useEffect(() => {
        if (loading || requests.length === 0) return;
        const highlightId = searchParams.get('leaveId');
        if (!highlightId) return;
        const idx = requests.findIndex(r => String(r.leaveId ?? r.id) === String(highlightId));
        setCurrentIndex(idx >= 0 ? idx : 0);
        setTimeout(() => setSearchParams({}, { replace: true }), 0);
    }, [loading, requests, searchParams]);

    const showToast = (type, message) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 4000);
    };

    const handleConfirm = async () => {
        const current = requests[currentIndex];
        if (!current || !confirmAction) return;
        const leaveId = current.leaveId ?? current.id;
        setActionLoading(confirmAction);
        try {
            const res = await fetch(`${ADMIN_API}/api/admin/leaves/${leaveId}/${confirmAction}`,
                { method: 'PUT', headers: getAuthHeaders() });
            if (!res.ok) throw new Error(`Failed to ${confirmAction} leave request`);
            setConfirmAction(null); setActionLoading(null);
            showToast('success', `Leave ${confirmAction === 'approve' ? 'approved ✓' : 'rejected'} successfully!`);
            const updated = requests.filter((_, i) => i !== currentIndex);
            setRequests(updated);
            setCurrentIndex(prev => Math.min(prev, Math.max(0, updated.length - 1)));
        } catch (err) {
            setConfirmAction(null); setActionLoading(null);
            showToast('error', err.message);
        }
    };

    const current = requests[currentIndex];
    const total   = requests.length;

    if (loading) return (
        <div className="space-y-4">
            <Breadcrumb />
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
                <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Loading leave requests...</span>
            </div>
        </div>
    );

    if (error) return (
        <div className="space-y-4">
            <Breadcrumb />
            <div className="flex flex-col items-center justify-center h-64 gap-3">
                <AlertCircle className="h-9 w-9 text-red-400" />
                <span className="text-sm text-red-500 font-medium">{error}</span>
                <button onClick={fetchPending} className="text-sm text-blue-600 hover:underline">Retry</button>
            </div>
        </div>
    );

    if (total === 0) return (
        <div className="space-y-4">
            <Breadcrumb />
            <Toast toast={toast} />
            <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-slate-200 shadow-sm gap-3">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center">
                    <Check className="h-7 w-7 text-emerald-500" />
                </div>
                <div className="text-center">
                    <h2 className="text-base font-semibold text-slate-800">All Caught Up!</h2>
                    <p className="text-sm text-slate-500 mt-0.5">No pending leave requests to approve.</p>
                </div>
                <button onClick={fetchPending} className="text-sm text-blue-600 hover:underline">Refresh</button>
            </div>
        </div>
    );

    const employeeCode  = current.employeeCode && current.employeeCode !== ''
        ? current.employeeCode : current.employeeId?.slice(0, 8).toUpperCase();
    const employeeName  = current.employeeName ?? current.empName ?? '—';
    const seniorName    = current.seniorName ?? current.reportingManager ?? '—';
    const designation   = current.designation ?? '—';
    const phone         = current.phone ?? null;
    const startDate     = current.startDate ?? current.fromDate;
    const endDate       = current.endDate   ?? current.toDate;
    const reason        = current.reason    ?? '—';
    const leaveTypeName = current.leaveTypeName && current.leaveTypeName !== '' ? current.leaveTypeName : null;
    const appliedAt     = current.requestedAt ?? current.appliedAt ?? current.appliedDate;
    const days          = daysBetween(startDate, endDate);

    return (
        <div className="space-y-4">
            <Breadcrumb />
            <Toast toast={toast} />
            {confirmAction && (
                <ConfirmPopup
                    action={confirmAction}
                    employeeName={employeeName}
                    days={days}
                    onConfirm={handleConfirm}
                    onCancel={() => setConfirmAction(null)}
                    loading={!!actionLoading}
                />
            )}

            <div className="max-w-2xl mx-auto">

                {/* ── Header ── */}
                <div className="bg-slate-700 text-white px-5 py-3 rounded-t-2xl flex justify-between items-center">
                    <div className="flex items-center gap-2.5">
                        <Bell className="h-4 w-4 text-slate-300" />
                        <h2 className="text-sm font-semibold">Leave Approval</h2>
                        <span className="bg-slate-600 text-slate-200 text-xs font-bold px-2 py-0.5 rounded-full">
                            {currentIndex + 1} / {total}
                        </span>
                    </div>
                    <div className="flex items-center gap-0.5">
                        <button onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}
                            className="p-1.5 rounded-lg hover:bg-slate-600 disabled:opacity-30 transition-colors">
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button onClick={() => setCurrentIndex(p => Math.min(total - 1, p + 1))} disabled={currentIndex === total - 1}
                            className="p-1.5 rounded-lg hover:bg-slate-600 disabled:opacity-30 transition-colors">
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* ── Card body ── */}
                <div className="bg-white rounded-b-2xl border border-slate-200 border-t-0 shadow-sm">

                    {/* Sub-header row */}
                    <div className="px-5 pt-4 pb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Leave Request</span>
                            {leaveTypeName && (
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-full uppercase tracking-wide">
                                    {leaveTypeName}
                                </span>
                            )}
                        </div>
                        <span className="px-2.5 py-0.5 bg-amber-50 text-amber-600 text-xs font-bold rounded-full border border-amber-100">
                            {days} day{days !== 1 ? 's' : ''}
                        </span>
                    </div>

                    {/* Fields — compact grid */}
                    <div className="px-5 pb-3 space-y-2.5">

                        {/* Row 1: ID + Name */}
                        <div className="grid grid-cols-2 gap-3">
                            <ReadField label="Employee ID"   icon={User}     value={employeeCode} />
                            <ReadField label="Employee Name" icon={User}     value={employeeName} />
                        </div>

                        {/* Row 2: Designation + Manager */}
                        <div className="grid grid-cols-2 gap-3">
                            <ReadField label="Designation"       icon={Briefcase} value={designation} />
                            <ReadField label="Reporting Manager" icon={Briefcase} value={seniorName}  />
                        </div>

                        {/* Row 3: Phone (inline, only if present) + Dates — same row */}
                        <div className={`grid gap-3 ${phone ? 'grid-cols-3' : 'grid-cols-2'}`}>
                            {phone && <ReadField label="Phone" icon={User} value={phone} />}
                            <ReadField label="From Date" icon={Calendar} value={formatDate(startDate)} />
                            <ReadField label="To Date"   icon={Calendar} value={formatDate(endDate)}   />
                        </div>

                        {/* Row 4: Reason — smaller box */}
                        <div className="space-y-1">
                            <label className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                <FileText className="h-3 w-3" /> Reason
                            </label>
                            <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 min-h-[52px] leading-relaxed">
                                {reason}
                            </div>
                        </div>

                        {/* Applied on */}
                        {appliedAt && (
                            <p className="text-[11px] text-slate-400 text-right">
                                Applied on {formatDate(appliedAt)}
                            </p>
                        )}
                    </div>

                    {/* ── Action buttons ── */}
                    <div className="px-5 py-3 border-t border-slate-100 flex gap-3">
                        <button
                            onClick={() => setConfirmAction('approve')}
                            disabled={!!actionLoading}
                            className="flex-1 h-10 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                        >
                            <Check className="h-4 w-4" /> Approve
                        </button>
                        <button
                            onClick={() => setConfirmAction('reject')}
                            disabled={!!actionLoading}
                            className="flex-1 h-10 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                        >
                            <X className="h-4 w-4" /> Reject
                        </button>
                    </div>
                </div>

                {/* ── Pagination dots ── */}
                {total > 1 && (
                    <div className="flex justify-center gap-1.5 mt-3">
                        {requests.map((_, i) => (
                            <button key={i} onClick={() => setCurrentIndex(i)}
                                className={`rounded-full transition-all ${i === currentIndex ? 'w-5 h-2 bg-slate-600' : 'w-2 h-2 bg-slate-300 hover:bg-slate-400'}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LeaveApprovalPage;