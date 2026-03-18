import React, { useState, useEffect, useRef } from 'react';
import { Calendar, FileText, Tag, Check, AlertCircle, Loader2, X, Clock, CheckCircle, XCircle, RefreshCw, ClipboardList } from 'lucide-react';
import apiClient from '../../services/apiClient';
import { useTabFromUrl } from '../../hooks/useTabFromUrl';

const LEAVE_TYPES = [
    { id: "11111111-1111-1111-1111-111111111111", label: "Casual Leave" },
    { id: "22222222-2222-2222-2222-222222222222", label: "Sick Leave" },
    { id: "33333333-3333-3333-3333-333333333333", label: "Paid Leave" },
    { id: "44444444-4444-4444-4444-444444444444", label: "Annual Leave" },
    { id: "55555555-5555-5555-5555-555555555555", label: "Maternity Leave" },
    { id: "66666666-6666-6666-6666-666666666666", label: "Paternity Leave" },
    { id: "77777777-7777-7777-7777-777777777777", label: "Unpaid Leave" },
    { id: "88888888-8888-8888-8888-888888888888", label: "Emergency Leave" },
    { id: "99999999-9999-9999-9999-999999999999", label: "Compensatory Leave" },
];
const LEAVE_TYPE_MAP = Object.fromEntries(LEAVE_TYPES.map(t => [t.id, t.label]));

const todayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const toISODate   = (d) => d ? new Date(d + 'T00:00:00').toISOString() : '';
const daysBetween = (from, to) => {
    if (!from || !to) return null;
    const diff = new Date(to) - new Date(from);
    return diff < 0 ? null : Math.round(diff / 86400000) + 1;
};
const formatDate = (d) => d
    ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

const inputClass = "w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 dark:focus:border-blue-500 transition-all placeholder-gray-400 dark:placeholder-gray-500";

const SectionCard = ({ title, icon, children }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <span className="text-blue-600 dark:text-blue-400">{icon}</span>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">{title}</h2>
        </div>
        <div className="p-6">{children}</div>
    </div>
);

function FormField({ label, icon: Icon, children }) {
    return (
        <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {Icon && <Icon className="h-3.5 w-3.5" />}
                {label}
            </label>
            {children}
        </div>
    );
}

function StatusBadge({ status }) {
    const s = typeof status === 'number' ? status : String(status).toLowerCase();
    const numericMap = {
        0: { icon: Clock,       bg: 'bg-amber-50 dark:bg-amber-900/20',     text: 'text-amber-700 dark:text-amber-400',     border: 'border-amber-200 dark:border-amber-800',    label: 'Pending'   },
        1: { icon: CheckCircle, bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800', label: 'Approved'  },
        2: { icon: XCircle,     bg: 'bg-red-50 dark:bg-red-900/20',         text: 'text-red-700 dark:text-red-400',         border: 'border-red-200 dark:border-red-800',        label: 'Rejected'  },
        3: { icon: XCircle,     bg: 'bg-gray-50 dark:bg-gray-700',          text: 'text-gray-600 dark:text-gray-400',       border: 'border-gray-200 dark:border-gray-600',      label: 'Cancelled' },
    };
    const stringMap = {
        'pending':   numericMap[0],
        'approved':  numericMap[1],
        'rejected':  numericMap[2],
        'cancelled': numericMap[3],
    };
    const cfg  = numericMap[s] ?? stringMap[s] ?? numericMap[0];
    const Icon = cfg.icon;
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
            <Icon className="h-3 w-3" />{cfg.label ?? status}
        </span>
    );
}

const SuccessModal = ({ onClose, onViewRequests }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Request Submitted!</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Your leave request has been submitted successfully and is pending approval.
            </p>
            <div className="flex flex-col gap-3 w-full">
                <button onClick={onViewRequests} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-semibold transition-all">
                    View My Requests
                </button>
                <button onClick={onClose} className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 py-2.5 rounded-lg text-sm font-semibold transition-all">
                    Submit Another
                </button>
            </div>
        </div>
    </div>
);

const LeaveRequestPage = () => {
    const today = todayStr();

    const [tab,         setTab]         = useState('history');
    const [highlightId, setHighlightId] = useState(null);

    // ── Read ?tab=history&leaveId=xxx from URL (set by notification click) ──
    useTabFromUrl(setTab, setHighlightId, 'leaveId');

    const [formData,       setFormData]       = useState({ fromDate: '', toDate: '', reason: '', leaveTypeId: '' });
    const [submitting,     setSubmitting]     = useState(false);
    const [alert,          setAlert]          = useState({ type: '', text: '' });
    const [showSuccess,    setShowSuccess]    = useState(false);
    const [history,        setHistory]        = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError,   setHistoryError]   = useState(null);

    // Ref map: leaveId → DOM element, so we can scroll to it
    const itemRefs = useRef({});

    const fetchHistory = async () => {
        setHistoryLoading(true);
        setHistoryError(null);
        try {
            const res  = await apiClient.get('/Leave/my');
            const data = res.data;
            setHistory(Array.isArray(data) ? data : data.data ?? []);
        } catch (err) {
            setHistoryError(err.message);
        } finally {
            setHistoryLoading(false);
        }
    };

    useEffect(() => { if (tab === 'history') fetchHistory(); }, [tab]);

    // ── Scroll to & flash the highlighted record once history loads ──
    useEffect(() => {
        if (!highlightId || historyLoading || history.length === 0) return;
        const el = itemRefs.current[highlightId];
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        // Clear highlight after 3 seconds
        const timer = setTimeout(() => setHighlightId(null), 3000);
        return () => clearTimeout(timer);
    }, [highlightId, historyLoading, history]);

    const days              = daysBetween(formData.fromDate, formData.toDate);
    const selectedLeaveType = LEAVE_TYPES.find(t => t.id === formData.leaveTypeId);

    const handleFromDate = (value) => {
        setFormData(prev => ({ ...prev, fromDate: value, toDate: prev.toDate < value ? '' : prev.toDate }));
        if (alert.text) setAlert({ type: '', text: '' });
    };

    const resetForm = () => {
        setFormData({ fromDate: '', toDate: '', reason: '', leaveTypeId: '' });
        setAlert({ type: '', text: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.fromDate < today) { setAlert({ type: 'error', text: 'From date cannot be in the past.' }); return; }
        if (formData.toDate < formData.fromDate) { setAlert({ type: 'error', text: 'End date cannot be before start date.' }); return; }
        setSubmitting(true);
        setAlert({ type: '', text: '' });
        try {
            await apiClient.post('/Leave', {
                fromDate: toISODate(formData.fromDate), toDate: toISODate(formData.toDate),
                reason: formData.reason, leaveTypeId: formData.leaveTypeId,
            });
            resetForm();
            setShowSuccess(true);
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data?.title || 'Failed to submit';
            setAlert({ type: 'error', text: typeof msg === 'string' ? msg : JSON.stringify(msg) });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-10">

            {showSuccess && (
                <SuccessModal
                    onClose={() => { setShowSuccess(false); setTab('request'); }}
                    onViewRequests={() => { setShowSuccess(false); setTab('history'); }}
                />
            )}

            {/* Page Header */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Leave Request</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Submit and track your leave requests.</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-xl p-1 w-fit">
                {[['request', 'New Request'], ['history', 'My Requests']].map(([key, label]) => (
                    <button key={key} onClick={() => setTab(key)}
                        className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                            tab === key
                                ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                        }`}>
                        {label}
                    </button>
                ))}
            </div>

            {/* ══ NEW REQUEST TAB ══ */}
            {tab === 'request' && (
                <SectionCard title="Leave Request" icon={<Calendar className="h-5 w-5" />}>
                    {alert.text && (
                        <div className={`mb-6 p-4 rounded-lg text-sm flex items-start gap-3 ${
                            alert.type === 'success'
                                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
                                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
                        }`}>
                            {alert.type === 'success' ? <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" /> : <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />}
                            <span>{alert.text}</span>
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <FormField label="Leave Type" icon={Tag}>
                            <select value={formData.leaveTypeId} onChange={e => { setFormData(p => ({ ...p, leaveTypeId: e.target.value })); if (alert.text) setAlert({ type: '', text: '' }); }} required className={inputClass}>
                                <option value="">Select leave type...</option>
                                {LEAVE_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                            </select>
                        </FormField>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField label="From Date" icon={Calendar}>
                                <input type="date" value={formData.fromDate} min={today} onChange={e => handleFromDate(e.target.value)} required className={inputClass} />
                            </FormField>
                            <FormField label="To Date" icon={Calendar}>
                                <input type="date" value={formData.toDate} min={formData.fromDate || today} onChange={e => { setFormData(p => ({ ...p, toDate: e.target.value })); if (alert.text) setAlert({ type: '', text: '' }); }} required disabled={!formData.fromDate} className={`${inputClass} ${!formData.fromDate ? 'opacity-50 cursor-not-allowed' : ''}`} />
                            </FormField>
                        </div>
                        {!formData.fromDate && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 -mt-2 flex items-center gap-1">
                                <Calendar className="h-3 w-3" /> Select a From Date first to enable the To Date picker.
                            </p>
                        )}
                        {days !== null && days > 0 && (
                            <div className="flex items-center gap-2">
                                <span className="px-3 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-xs font-bold rounded-full border border-amber-100 dark:border-amber-800">
                                    {days} day{days !== 1 ? 's' : ''} leave
                                </span>
                                {days > 5 && <span className="text-xs text-gray-400 dark:text-gray-500">Long leave — ensure manager approval</span>}
                            </div>
                        )}
                        <FormField label="Reason" icon={FileText}>
                            <textarea value={formData.reason} onChange={e => { setFormData(p => ({ ...p, reason: e.target.value })); if (alert.text) setAlert({ type: '', text: '' }); }} rows={3} required placeholder="Briefly describe the reason for your leave..." className={`${inputClass} resize-none`} />
                        </FormField>
                        <button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2">
                            {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</> : <><Check className="h-4 w-4" /> Submit Request</>}
                        </button>
                    </form>
                </SectionCard>
            )}

            {/* ══ MY REQUESTS TAB ══ */}
            {tab === 'history' && (
                <SectionCard title="My Leave Requests" icon={<ClipboardList className="h-5 w-5" />}>
                    {historyLoading ? (
                        <div className="flex items-center justify-center py-12 text-gray-400 gap-3">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span className="text-sm">Loading requests…</span>
                        </div>
                    ) : historyError ? (
                        <div className="flex items-center justify-center py-12 gap-2 text-red-400">
                            <AlertCircle className="h-5 w-5" />
                            <span className="text-sm">Failed to load: {historyError}</span>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="py-12 text-center text-gray-400 dark:text-gray-500">
                            <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-40" />
                            <p className="font-medium">No leave requests yet</p>
                            <p className="text-sm mt-1">Your submitted requests will appear here.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {history.map((leave, idx) => {
                                const leaveId   = String(leave.leaveId ?? leave.id ?? idx);
                                const startDate = leave.startDate ?? leave.fromDate ?? leave.StartDate;
                                const endDate   = leave.endDate   ?? leave.toDate   ?? leave.EndDate;
                                const reason    = leave.reason    ?? leave.Reason   ?? '—';
                                const status    = leave.status    ?? leave.Status   ?? 'Pending';
                                const ltId      = leave.leaveTypeId ?? leave.LeaveTypeId;
                                const ltName    = leave.leaveTypeName ?? leave.leaveType?.name ?? (ltId ? LEAVE_TYPE_MAP[ltId] : null) ?? 'Leave';
                                const appliedAt = leave.requestedAt ?? leave.appliedAt ?? leave.createdAt;
                                const leaveDays = daysBetween(startDate, endDate);
                                const isHighlighted = highlightId === leaveId;

                                return (
                                    <div
                                        key={leaveId}
                                        ref={el => { if (el) itemRefs.current[leaveId] = el; }}
                                        className={`
                                            rounded-lg border p-4 transition-all duration-500
                                            ${isHighlighted
                                                ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 shadow-md shadow-blue-100 dark:shadow-blue-900/20 ring-2 ring-blue-300 dark:ring-blue-700'
                                                : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 hover:border-blue-300 dark:hover:border-blue-600'
                                            }
                                        `}
                                    >
                                        {/* Highlight banner */}
                                        {isHighlighted && (
                                            <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-semibold mb-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                                From your notification
                                            </div>
                                        )}

                                        <div className="flex items-start justify-between gap-4 mb-3">
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{ltName}</span>
                                                {leaveDays && (
                                                    <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full font-medium">
                                                        {leaveDays} day{leaveDays !== 1 ? 's' : ''}
                                                    </span>
                                                )}
                                                <StatusBadge status={status} />
                                            </div>
                                            {appliedAt && (
                                                <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
                                                    Applied {formatDate(appliedAt)}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-2">
                                            <Calendar className="h-3 w-3" />
                                            {formatDate(startDate)}
                                            {endDate && endDate !== startDate && <> → {formatDate(endDate)}</>}
                                        </div>

                                        {reason !== '—' && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400 italic">"{reason}"</p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </SectionCard>
            )}
        </div>
    );
};

export default LeaveRequestPage;