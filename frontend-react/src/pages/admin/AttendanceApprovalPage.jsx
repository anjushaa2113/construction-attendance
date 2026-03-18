import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import Breadcrumb from '../../components/layout/Breadcrumb';
import {
    CalendarCheck, Check, ChevronLeft, ChevronRight,
    Loader2, AlertCircle, Clock, User, Briefcase, FileText, X
} from 'lucide-react';

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

function formatTime(timeStr) {
    if (!timeStr) return '—';
    const t = timeStr.includes('T') ? timeStr.split('T')[1] : timeStr;
    const [h, m] = t.split(':');
    const hour = parseInt(h, 10);
    return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
}

// ── compact read field ─────────────────────────────────────────────────────────
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

// ── compact time change row ────────────────────────────────────────────────────
function TimeChangeRow({ label, original, corrected }) {
    return (
        <div className="space-y-1">
            <label className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                <Clock className="h-3 w-3" /> {label}
            </label>
            <div className="grid grid-cols-2 gap-2">
                <div className="px-3 py-1.5 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600 font-medium min-h-[30px] flex items-center gap-1.5">
                    <span className="text-[10px] text-red-400 font-bold uppercase">Original</span>
                    <span>{original}</span>
                </div>
                <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-lg text-xs text-emerald-700 font-medium min-h-[30px] flex items-center gap-1.5">
                    <span className="text-[10px] text-emerald-500 font-bold uppercase">Corrected</span>
                    <span>{corrected}</span>
                </div>
            </div>
        </div>
    );
}

// ── confirm modal ──────────────────────────────────────────────────────────────
function ConfirmModal({ type, employeeName, onConfirm, onCancel, loading }) {
    const isApprove = type === 'approve';
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-[360px] p-6 flex flex-col items-center gap-3">
                <div className={`w-13 h-13 w-14 h-14 rounded-full flex items-center justify-center ${isApprove ? 'bg-emerald-100' : 'bg-red-100'}`}>
                    {isApprove
                        ? <Check className="h-7 w-7 text-emerald-500" strokeWidth={2.5} />
                        : <X    className="h-7 w-7 text-red-500"     strokeWidth={2.5} />}
                </div>
                <h3 className="text-base font-bold text-slate-800">
                    {isApprove ? 'Approve Attendance?' : 'Reject Attendance?'}
                </h3>
                <p className="text-sm text-slate-500 text-center leading-relaxed">
                    You are about to{' '}
                    <span className={`font-semibold ${isApprove ? 'text-emerald-600' : 'text-red-500'}`}>{type}</span>{' '}
                    the correction request for{' '}
                    <span className="font-semibold text-slate-700">{employeeName}</span>.
                </p>
                <div className="w-full h-px bg-slate-100" />
                <div className="flex gap-3 w-full">
                    <button onClick={onCancel} disabled={loading}
                        className="flex-1 h-10 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50">
                        Cancel
                    </button>
                    <button onClick={onConfirm} disabled={loading}
                        className={`flex-1 h-10 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 ${isApprove ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : isApprove ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                        {isApprove ? 'Yes, Approve' : 'Yes, Reject'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── result modal ───────────────────────────────────────────────────────────────
function ResultModal({ type, onClose }) {
    const isApprove = type === 'approve';
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-[320px] p-6 flex flex-col items-center gap-3">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center ${isApprove ? 'bg-emerald-100' : 'bg-red-100'}`}>
                    {isApprove
                        ? <Check className="h-7 w-7 text-emerald-500" strokeWidth={2.5} />
                        : <X    className="h-7 w-7 text-red-500"     strokeWidth={2.5} />}
                </div>
                <h3 className="text-base font-bold text-slate-800">
                    {isApprove ? 'Approved Successfully!' : 'Rejected Successfully!'}
                </h3>
                <p className="text-sm text-slate-500 text-center leading-relaxed">
                    The correction has been{' '}
                    <span className={`font-semibold ${isApprove ? 'text-emerald-600' : 'text-red-500'}`}>
                        {isApprove ? 'approved' : 'rejected'}
                    </span> successfully.
                </p>
                <button onClick={onClose}
                    className={`w-full h-10 rounded-xl text-white text-sm font-semibold transition-colors ${isApprove ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`}>
                    Done
                </button>
            </div>
        </div>
    );
}

// ── main page ──────────────────────────────────────────────────────────────────
const AttendanceApprovalPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    const [requests, setRequests]           = useState([]);
    const [loading, setLoading]             = useState(true);
    const [error, setError]                 = useState(null);
    const [currentIndex, setCurrentIndex]   = useState(0);
    const [actionLoading, setActionLoading] = useState(null);
    const [toast, setToast]                 = useState(null);
    const [confirmModal, setConfirmModal]   = useState(null);
    const [resultModal, setResultModal]     = useState(null);

    const fetchPending = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const res = await fetch(`${ADMIN_API}/api/admin/attendance-corrections?status=0`, {
                headers: getAuthHeaders(),
            });
            if (!res.ok) throw new Error(`Failed to load corrections (${res.status})`);
            const data = await res.json();
            setRequests(Array.isArray(data) ? data : data.data ?? []);
            setCurrentIndex(0);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchPending(); }, [fetchPending]);

    useEffect(() => {
        if (loading || requests.length === 0) return;
        const highlightId = searchParams.get('correctionId');
        if (!highlightId) return;
        const idx = requests.findIndex(r =>
            String(r.id ?? r.correctionId).toLowerCase() === highlightId.toLowerCase()
        );
        setCurrentIndex(idx >= 0 ? idx : 0);
        setSearchParams({}, { replace: true });
    }, [loading, requests]);

    const showToast = (type, message) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 3000);
    };

    const handleConfirm = async () => {
        const action  = confirmModal.type;
        const current = requests[currentIndex];
        if (!current) return;
        const correctionId = current.id ?? current.correctionId ?? current.attendanceCorrectionId;
        setActionLoading(action);
        try {
            const res = await fetch(
                `${ADMIN_API}/api/admin/attendance-corrections/${correctionId}/${action}`,
                { method: 'PUT', headers: getAuthHeaders() }
            );
            if (!res.ok) {
                const errBody = await res.text().catch(() => '');
                throw new Error(`Failed to ${action} correction (${res.status}): ${errBody}`);
            }
            setConfirmModal(null);
            setResultModal({ type: action });
            const updated = requests.filter((_, i) => i !== currentIndex);
            setRequests(updated);
            setCurrentIndex(prev => Math.min(prev, Math.max(0, updated.length - 1)));
        } catch (err) {
            setConfirmModal(null);
            showToast('error', err.message);
        } finally {
            setActionLoading(null);
        }
    };

    const current = requests[currentIndex];
    const total   = requests.length;

    if (loading) return (
        <div className="space-y-4">
            <Breadcrumb />
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
                <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Loading attendance corrections...</span>
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
            <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-slate-200 shadow-sm gap-3">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center">
                    <Check className="h-7 w-7 text-emerald-500" />
                </div>
                <div className="text-center">
                    <h2 className="text-base font-semibold text-slate-800">All Caught Up!</h2>
                    <p className="text-sm text-slate-500 mt-0.5">No pending attendance corrections.</p>
                </div>
                <button onClick={fetchPending} className="text-sm text-blue-600 hover:underline">Refresh</button>
            </div>
        </div>
    );

    const emp          = current.employee ?? {};
    const employeeName = emp.name ?? current.employeeName ?? '—';
    const employeeCode = emp.employeeCode && emp.employeeCode !== ''
        ? emp.employeeCode
        : emp.employeeId?.split('-')[0].toUpperCase() ?? '—';
    const designation  = emp.designation && emp.designation !== '' ? emp.designation : '—';
    const seniorName   = emp.seniorName  && emp.seniorName  !== '' ? emp.seniorName  : '—';
    const role         = emp.role ?? '—';

    return (
        <div className="space-y-4">
            <Breadcrumb />

            {confirmModal && (
                <ConfirmModal
                    type={confirmModal.type}
                    employeeName={employeeName}
                    onConfirm={handleConfirm}
                    onCancel={() => setConfirmModal(null)}
                    loading={!!actionLoading}
                />
            )}
            {resultModal && <ResultModal type={resultModal.type} onClose={() => setResultModal(null)} />}

            {toast && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                    {toast.type === 'success' ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    {toast.message}
                </div>
            )}

            <div className="max-w-2xl mx-auto">

                {/* ── Header ── */}
                <div className="bg-slate-700 text-white px-5 py-3 rounded-t-2xl flex justify-between items-center">
                    <div className="flex items-center gap-2.5">
                        <CalendarCheck className="h-4 w-4 text-slate-300" />
                        <h2 className="text-sm font-semibold">Attendance Approval</h2>
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

                    {/* Sub-header */}
                    <div className="px-5 pt-3 pb-2 flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Correction Request</span>
                        <span className="px-2.5 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-full border border-amber-100">
                            Pending Review
                        </span>
                    </div>

                    {/* Fields */}
                    <div className="px-5 pb-3 space-y-2.5">

                        {/* Row 1: ID + Name */}
                        <div className="grid grid-cols-2 gap-3">
                            <ReadField label="Employee ID"   icon={User}     value={employeeCode} />
                            <ReadField label="Employee Name" icon={User}     value={employeeName} />
                        </div>

                        {/* Row 2: Role + Manager + Requested On — all 3 inline */}
                        <div className="grid grid-cols-3 gap-3">
                            <ReadField label="Job Role"          icon={Briefcase}    value={role}                                                        />
                            <ReadField label="Reporting Manager" icon={Briefcase}    value={seniorName}                                                  />
                            <ReadField label="Requested On"      icon={CalendarCheck} value={formatDate(current.correctionDate ?? current.requestedAt)} />
                        </div>

                        {/* Row 3: Punch In */}
                        <TimeChangeRow
                            label="Punch In"
                            original={formatTime(current.originalPunchIn)}
                            corrected={formatTime(current.correctedPunchIn)}
                        />

                        {/* Row 4: Punch Out */}
                        <TimeChangeRow
                            label="Punch Out"
                            original={formatTime(current.originalPunchOut)}
                            corrected={formatTime(current.correctedPunchOut)}
                        />

                        {/* Row 5: Reason — compact box */}
                        <div className="space-y-1">
                            <label className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                <FileText className="h-3 w-3" /> Reason
                            </label>
                            <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 min-h-[44px] leading-relaxed">
                                {current.reason || '—'}
                            </div>
                        </div>
                    </div>

                    {/* ── Action buttons ── */}
                    <div className="px-5 py-3 border-t border-slate-100 flex gap-3">
                        <button
                            onClick={() => setConfirmModal({ type: 'approve' })}
                            disabled={!!actionLoading}
                            className="flex-1 h-10 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                        >
                            <Check className="h-4 w-4" /> Approve
                        </button>
                        <button
                            onClick={() => setConfirmModal({ type: 'reject' })}
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

export default AttendanceApprovalPage;