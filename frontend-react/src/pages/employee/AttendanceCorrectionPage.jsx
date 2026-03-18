import { useState, useEffect, useRef } from "react";
import { ClipboardList, Clock, CheckCircle, XCircle, AlertCircle, User } from "lucide-react";
import useAuth from "../../hooks/useAuth";
import apiClient from "../../services/apiClient";
import { useTabFromUrl } from "../../hooks/useTabFromUrl";

const STATUS = { 0: "Pending", 1: "Approved", 2: "Rejected", 3: "Cancelled" };
const STATUS_STYLE = {
    0: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    1: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    2: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    3: "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400",
};
const STATUS_ICON = {
    0: <AlertCircle className="h-3.5 w-3.5" />,
    1: <CheckCircle className="h-3.5 w-3.5" />,
    2: <XCircle className="h-3.5 w-3.5" />,
    3: <XCircle className="h-3.5 w-3.5" />,
};

const fmt12 = (t) => {
    if (!t) return "--";
    const [h, m] = t.split(":");
    const hr = parseInt(h, 10);
    return `${hr % 12 || 12}:${m} ${hr < 12 ? "AM" : "PM"}`;
};

const fmtDate = (iso) =>
    iso ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "--";

const SectionCard = ({ title, icon, children }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <span className="text-blue-600 dark:text-blue-400">{icon}</span>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">{title}</h2>
        </div>
        <div className="p-6">{children}</div>
    </div>
);

const Field = ({ label, children }) => (
    <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        {children}
    </div>
);

const inputClass = "w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-60 disabled:cursor-not-allowed placeholder-gray-400 dark:placeholder-gray-500";

const StatusBadge = ({ status }) => (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLE[status] ?? STATUS_STYLE[0]}`}>
        {STATUS_ICON[status]}
        {STATUS[status] ?? "Unknown"}
    </span>
);

const SuccessModal = ({ onClose, onViewRequests }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Request Submitted!</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Your attendance correction request has been submitted successfully and is pending admin approval.
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

export default function AttendanceCorrectionPage() {
    const { user } = useAuth();

    const [tab,         setTab]         = useState("request");
    const [highlightId, setHighlightId] = useState(null);

    // ── Read ?tab=history&correctionId=xxx from URL (set by notification click) ──
    useTabFromUrl(setTab, setHighlightId, 'correctionId');

    const [form, setForm] = useState({ date: "", requestedCheckIn: "", requestedCheckOut: "", reason: "" });
    const [matchedDay,      setMatchedDay]      = useState(null);
    const [fetchingRecord,  setFetchingRecord]  = useState(false);
    const [submitting,      setSubmitting]      = useState(false);
    const [alert,           setAlert]           = useState({ type: "", text: "" });
    const [history,         setHistory]         = useState([]);
    const [loadingHistory,  setLoadingHistory]  = useState(false);
    const [showSuccess,     setShowSuccess]     = useState(false);

    // Ref map: correctionId → DOM element
    const itemRefs = useRef({});

    const employeeId   = user?.employeeId;
    const employeeName = user?.name || user?.email || "Employee";
    const jobRole      = user?.role || "Employee";
    const todayStr     = new Date().toISOString().split("T")[0];

    // Fetch attendance record for selected date
    useEffect(() => {
        if (!form.date || !employeeId) return;
        let cancelled = false;
        const lookup = async () => {
            setFetchingRecord(true);
            setMatchedDay(null);
            try {
                const dateObj = new Date(form.date);
                const month   = dateObj.getMonth() + 1;
                const year    = dateObj.getFullYear();
                const res     = await apiClient.get(`/Employee/attendance/monthly?month=${month}&year=${year}`);
                if (cancelled) return;
                const match = (res.data?.days || []).find((d) => d.date === form.date);
                if (!cancelled) setMatchedDay(match || null);
            } catch { /* silent */ }
            finally { if (!cancelled) setFetchingRecord(false); }
        };
        lookup();
        return () => { cancelled = true; };
    }, [form.date, employeeId]);

    // Load history when tab switches to history
    const loadHistory = async () => {
        setLoadingHistory(true);
        try {
            const res  = await apiClient.get("/AttendanceCorrections");
            const mine = (res.data || []).filter((r) => r.employeeId === employeeId);
            setHistory(mine.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt)));
        } catch {
            setHistory([]);
        } finally {
            setLoadingHistory(false);
        }
    };

    useEffect(() => { if (tab === "history") loadHistory(); }, [tab]);

    // ── Scroll to & flash the highlighted record once history loads ──
    useEffect(() => {
        if (!highlightId || loadingHistory || history.length === 0) return;
        const el = itemRefs.current[highlightId];
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        const timer = setTimeout(() => setHighlightId(null), 3000);
        return () => clearTimeout(timer);
    }, [highlightId, loadingHistory, history]);

    const handleChange = (e) => {
        setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
        if (alert.text) setAlert({ type: "", text: "" });
    };

    const resetForm = () => {
        setForm({ date: "", requestedCheckIn: "", requestedCheckOut: "", reason: "" });
        setMatchedDay(null);
        setAlert({ type: "", text: "" });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!matchedDay) { setAlert({ type: "error", text: "No attendance record found for the selected date." }); return; }
        if (!matchedDay.attendanceId) { setAlert({ type: "error", text: "Could not retrieve attendance record ID. Please refresh and try again." }); return; }
        if (form.requestedCheckIn && form.requestedCheckOut && form.requestedCheckIn >= form.requestedCheckOut) {
            setAlert({ type: "error", text: "Requested Check-Out time must be after Check-In time." }); return;
        }
        setSubmitting(true);
        setAlert({ type: "", text: "" });
        try {
            await apiClient.post("/AttendanceCorrections", {
                employeeId,
                attendanceId:      matchedDay.attendanceId,
                originalCheckIn:   matchedDay.checkIn  ? matchedDay.checkIn  + ":00" : null,
                originalCheckOut:  matchedDay.checkOut ? matchedDay.checkOut + ":00" : null,
                requestedCheckIn:  form.requestedCheckIn  + ":00",
                requestedCheckOut: form.requestedCheckOut + ":00",
                reason:            form.reason,
                status:            0,
                requestedAt:       new Date().toISOString(),
            });
            resetForm();
            setShowSuccess(true);
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data || "Submission failed. Please try again.";
            setAlert({ type: "error", text: typeof msg === "string" ? msg : JSON.stringify(msg) });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-10">

            {showSuccess && (
                <SuccessModal
                    onClose={() => setShowSuccess(false)}
                    onViewRequests={() => { setShowSuccess(false); setTab("history"); }}
                />
            )}

            {/* Page Header */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Attendance Correction</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Request a correction for an incorrect attendance entry.</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-xl p-1 w-fit">
                {[["request", "New Request"], ["history", "My Requests"]].map(([key, label]) => (
                    <button key={key} onClick={() => setTab(key)}
                        className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                            tab === key
                                ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm"
                                : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                        }`}>
                        {label}
                    </button>
                ))}
            </div>

            {/* ══ NEW REQUEST TAB ══ */}
            {tab === "request" && (
                <SectionCard title="Correction Request" icon={<Clock className="h-5 w-5" />}>
                    {alert.text && (
                        <div className={`mb-6 p-4 rounded-lg text-sm flex items-start gap-3 ${
                            alert.type === "success"
                                ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400"
                                : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400"
                        }`}>
                            {alert.type === "success" ? <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" /> : <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />}
                            <span>{alert.text}</span>
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg px-4 py-3">
                            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                                <User className="h-4 w-4 text-white" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{employeeName}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{jobRole}</p>
                            </div>
                        </div>
                        <Field label="Date">
                            <input type="date" name="date" value={form.date} onChange={handleChange} max={todayStr} required className={inputClass} />
                            {fetchingRecord && (
                                <p className="text-xs text-blue-500 mt-1.5 flex items-center gap-1.5">
                                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                    </svg>
                                    Looking up attendance record…
                                </p>
                            )}
                            {!fetchingRecord && form.date && !matchedDay && (
                                <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                                    <AlertCircle className="h-3.5 w-3.5" /> No attendance record found for this date.
                                </p>
                            )}
                            {!fetchingRecord && matchedDay && (
                                <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1 flex-wrap">
                                    <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                                    Record found ({matchedDay.status}) — Check-in: <strong className="ml-1">{fmt12(matchedDay.checkIn) || "--"}</strong>
                                    <span className="mx-1">|</span>
                                    Check-out: <strong className="ml-1">{fmt12(matchedDay.checkOut) || "--"}</strong>
                                </p>
                            )}
                        </Field>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="Requested Check-In">
                                <input type="time" name="requestedCheckIn" value={form.requestedCheckIn} onChange={handleChange} required className={inputClass} />
                            </Field>
                            <Field label="Requested Check-Out">
                                <input type="time" name="requestedCheckOut" value={form.requestedCheckOut} onChange={handleChange} required className={inputClass} />
                            </Field>
                        </div>
                        <Field label="Reason">
                            <textarea name="reason" value={form.reason} onChange={handleChange} rows={3} required placeholder="Briefly describe why the correction is needed…" className={`${inputClass} resize-none`} />
                        </Field>
                        <button type="submit" disabled={submitting || !matchedDay}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2">
                            {submitting ? (
                                <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                </svg>Submitting…</>
                            ) : "Submit Request"}
                        </button>
                    </form>
                </SectionCard>
            )}

            {/* ══ MY REQUESTS TAB ══ */}
            {tab === "history" && (
                <SectionCard title="My Correction Requests" icon={<ClipboardList className="h-5 w-5" />}>
                    {loadingHistory ? (
                        <div className="flex items-center justify-center py-12 text-gray-400 gap-3">
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg>
                            Loading requests…
                        </div>
                    ) : history.length === 0 ? (
                        <div className="py-12 text-center text-gray-400 dark:text-gray-500">
                            <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-40" />
                            <p className="font-medium">No correction requests yet</p>
                            <p className="text-sm mt-1">Your submitted requests will appear here.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {history.map((r) => {
                                const correctionId  = String(r.correctionId ?? r.id ?? '');
                                const isHighlighted = highlightId === correctionId;

                                return (
                                    <div
                                        key={correctionId}
                                        ref={el => { if (el) itemRefs.current[correctionId] = el; }}
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
                                            <div className="flex items-center gap-3">
                                                <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
                                                    {fmtDate(r.attendance?.attendanceDate?.slice(0, 10) || r.attendanceDate?.slice(0, 10) || r.requestedAt?.slice(0, 10))}
                                                </span>
                                                <StatusBadge status={r.status} />
                                            </div>
                                            {r.approvedAt && (
                                                <span className="text-xs text-gray-400 shrink-0">
                                                    Reviewed {fmtDate(r.approvedAt?.slice(0, 10))}
                                                </span>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mb-3">
                                            {[
                                                { label: "Original In",   value: fmt12(r.originalCheckIn  || r.originalPunchIn),  color: "text-gray-700 dark:text-gray-300" },
                                                { label: "Original Out",  value: fmt12(r.originalCheckOut || r.originalPunchOut), color: "text-gray-700 dark:text-gray-300" },
                                                { label: "Requested In",  value: fmt12(r.requestedCheckIn  || r.correctedPunchIn),  color: "text-blue-600 dark:text-blue-400" },
                                                { label: "Requested Out", value: fmt12(r.requestedCheckOut || r.correctedPunchOut), color: "text-blue-600 dark:text-blue-400" },
                                            ].map(({ label, value, color }) => (
                                                <div key={label} className="bg-white dark:bg-gray-800 rounded-md px-3 py-2 border border-gray-100 dark:border-gray-700">
                                                    <p className="text-gray-400 dark:text-gray-500 mb-0.5">{label}</p>
                                                    <p className={`font-semibold ${color}`}>{value}</p>
                                                </div>
                                            ))}
                                        </div>

                                        {r.reason && <p className="text-xs text-gray-500 dark:text-gray-400 italic">"{r.reason}"</p>}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </SectionCard>
            )}
        </div>
    );
}