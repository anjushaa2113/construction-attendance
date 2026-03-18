import React, { useState, useEffect, useCallback } from 'react';
import Breadcrumb from '../../components/layout/Breadcrumb';
import useAuth from '../../hooks/useAuth';
import {
    ShieldCheck, Search, AlertCircle, ChevronDown, User, Filter,
    Activity, CheckCircle2, XCircle, Hourglass,
    ChevronLeft, ChevronRight, Download, CalendarCheck, CalendarDays
} from 'lucide-react';

const ADMIN_API = import.meta.env.VITE_ADMIN_API_URL || 'https://localhost:7008';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

function formatDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(d) {
    if (!d) return '—';
    const dt = new Date(d);
    return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        + ' · ' + dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatTime(t) {
    if (!t) return '—';
    const s = t.includes('T') ? t.split('T')[1] : t;
    const [h, m] = s.split(':');
    const hour = parseInt(h, 10);
    return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
}

const STATUS_CONFIG = {
    0: { label: 'Pending',  color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200',   dot: 'bg-amber-400'   },
    1: { label: 'Approved', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-400' },
    2: { label: 'Rejected', color: 'text-red-500',     bg: 'bg-red-50',     border: 'border-red-200',     dot: 'bg-red-400'     },
};

// ── Interactive Stat Card (matches Dashboard style exactly) ──────────────────
function StatCard({ icon: Icon, label, value, baseColor, activeColor, iconBase, iconActive, shadow, border, activeBorder }) {
    const [isActive, setIsActive] = useState(false);
    return (
        <div
            onMouseEnter={() => setIsActive(true)}
            onMouseLeave={() => setIsActive(false)}
            onClick={() => setIsActive(a => !a)}
            className={`
                relative rounded-2xl p-5 border cursor-pointer
                flex items-center gap-4 overflow-hidden
                transition-all duration-300 ease-out select-none
                ${isActive
                    ? `${activeColor} ${activeBorder} shadow-xl ${shadow} -translate-y-2 scale-[1.03]`
                    : `${baseColor} ${border} shadow-sm hover:shadow-md`
                }
            `}
        >
            {/* Background glow on active */}
            {isActive && (
                <div className="absolute inset-0 opacity-20 bg-white rounded-2xl blur-xl pointer-events-none" />
            )}

            <div className={`p-3 rounded-xl transition-all duration-300 shrink-0 ${isActive ? iconActive : iconBase}`}>
                <Icon className="h-6 w-6" />
            </div>

            <div className="relative z-10">
                <div className={`text-3xl font-bold transition-all duration-300 ${isActive ? 'scale-110 origin-left' : ''}`}>
                    {value}
                </div>
                <div className={`text-xs mt-0.5 font-medium transition-colors duration-300 ${isActive ? 'opacity-90' : 'opacity-70'}`}>
                    {label}
                </div>
            </div>

            {/* Decorative circle */}
            <div className={`
                absolute -right-4 -bottom-4 w-20 h-20 rounded-full opacity-10
                transition-all duration-300
                ${isActive ? 'scale-150 opacity-20 bg-white' : 'bg-current'}
            `} />
        </div>
    );
}

// ── Stat card configs ────────────────────────────────────────────────────────
const STAT_CARDS = (stats) => [
    {
        label: 'Total',
        value: stats.total,
        icon: Activity,
        baseColor:    'bg-slate-50   text-slate-700',
        activeColor:  'bg-slate-700  text-white',
        iconBase:     'bg-slate-200  text-slate-600',
        iconActive:   'bg-slate-600  text-white',
        shadow:       'shadow-slate-200',
        border:       'border-slate-200',
        activeBorder: 'border-slate-700',
    },
    {
        label: 'Pending',
        value: stats.pending,
        icon: Hourglass,
        baseColor:    'bg-amber-50   text-amber-700',
        activeColor:  'bg-amber-500  text-white',
        iconBase:     'bg-amber-100  text-amber-600',
        iconActive:   'bg-amber-400  text-white',
        shadow:       'shadow-amber-200',
        border:       'border-amber-100',
        activeBorder: 'border-amber-500',
    },
    {
        label: 'Approved',
        value: stats.approved,
        icon: CheckCircle2,
        baseColor:    'bg-emerald-50  text-emerald-700',
        activeColor:  'bg-emerald-600 text-white',
        iconBase:     'bg-emerald-100 text-emerald-600',
        iconActive:   'bg-emerald-500 text-white',
        shadow:       'shadow-emerald-200',
        border:       'border-emerald-100',
        activeBorder: 'border-emerald-600',
    },
    {
        label: 'Rejected',
        value: stats.rejected,
        icon: XCircle,
        baseColor:    'bg-red-50  text-red-700',
        activeColor:  'bg-red-600 text-white',
        iconBase:     'bg-red-100 text-red-600',
        iconActive:   'bg-red-500 text-white',
        shadow:       'shadow-red-200',
        border:       'border-red-100',
        activeBorder: 'border-red-600',
    },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
    const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG[0];
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
        </span>
    );
}

function DetailCell({ label, value, red, green, wide }) {
    return (
        <div className={wide ? 'col-span-2' : ''}>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
            <p className={`text-sm font-medium ${red ? 'text-red-500' : green ? 'text-emerald-600' : 'text-slate-700'}`}>{value}</p>
        </div>
    );
}

function Pagination({ page, totalPages, setPage }) {
    if (totalPages <= 1) return null;
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
        .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
        .reduce((acc, p, idx, arr) => { if (idx > 0 && p - arr[idx - 1] > 1) acc.push('…'); acc.push(p); return acc; }, []);
    return (
        <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-colors">
                <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </button>
            <div className="flex items-center gap-1">
                {pages.map((p, i) => p === '…'
                    ? <span key={`e${i}`} className="px-1 text-slate-400 text-sm">…</span>
                    : <button key={p} onClick={() => setPage(p)}
                        className={`w-8 h-8 rounded-lg text-sm font-semibold transition-colors ${p === page ? 'bg-slate-700 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
                        {p}
                      </button>
                )}
            </div>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-colors">
                Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
        </div>
    );
}

// ── Attendance Row ────────────────────────────────────────────────────────────
function AttendanceLogRow({ log, index }) {
    const [expanded, setExpanded] = useState(false);
    const emp  = log.employee ?? {};
    const name = emp.name ?? log.employeeName ?? '—';
    const code = emp.employeeCode ?? (emp.employeeId ? emp.employeeId.split('-')[0].toUpperCase() : '—');
    const by   = log.actionBy ?? log.reviewedBy ?? '—';
    const at   = log.actionAt ?? log.reviewedAt ?? log.updatedAt ?? null;

    return (
        <>
            <tr onClick={() => setExpanded(e => !e)}
                className={`border-b border-slate-100 cursor-pointer transition-colors hover:bg-slate-50/80 ${expanded ? 'bg-slate-50' : index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                <td className="px-5 py-3.5 text-xs text-slate-400 font-medium">{index + 1}</td>
                <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                            <User className="h-4 w-4 text-slate-500" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-700">{name}</p>
                            <p className="text-xs text-slate-400 font-mono">{code}</p>
                        </div>
                    </div>
                </td>
                <td className="px-4 py-3.5 text-sm text-slate-600 whitespace-nowrap">{formatDate(log.requestedAt)}</td>
                <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2 text-xs">
                        <span className="px-2 py-0.5 bg-red-50 text-red-500 rounded-md font-mono border border-red-100">{formatTime(log.originalPunchIn)}</span>
                        <span className="text-slate-300">→</span>
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md font-mono border border-emerald-100">{formatTime(log.correctedPunchIn)}</span>
                    </div>
                </td>
                <td className="px-4 py-3.5"><StatusBadge status={log.status} /></td>
                <td className="px-4 py-3.5 text-sm text-slate-600">
                    {log.status === 0 ? <span className="text-slate-400 italic text-xs">Awaiting review</span> : by}
                </td>
                <td className="px-4 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                    {log.status === 0 ? '—' : formatDateTime(at)}
                </td>
                <td className="px-4 py-3.5 text-right">
                    <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform inline-block ${expanded ? 'rotate-180' : ''}`} />
                </td>
            </tr>
            {expanded && (
                <tr className="bg-slate-50 border-b border-slate-100">
                    <td colSpan={8} className="px-6 py-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <DetailCell label="Punch Out (Original)"  value={formatTime(log.originalPunchOut)} red />
                            <DetailCell label="Punch Out (Corrected)" value={formatTime(log.correctedPunchOut)} green />
                            <DetailCell label="Correction Date"       value={formatDate(log.correctionDate ?? log.attendanceDate)} />
                            <DetailCell label="Reviewed By"           value={log.status !== 0 ? by : '—'} />
                            <DetailCell label="Reason" value={log.reason || '—'} wide />
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}

// ── Leave Row ─────────────────────────────────────────────────────────────────
function LeaveLogRow({ log, index }) {
    const [expanded, setExpanded] = useState(false);
    const name      = log.employeeName ?? '—';
    const empId     = log.employeeId   ?? '—';
    const leaveType = log.leaveType ?? log.type ?? '—';
    const statusStr = log.status ?? '';
    let status = 0;
    if (typeof statusStr === 'number') { status = statusStr; }
    else if (statusStr.toLowerCase() === 'approved') { status = 1; }
    else if (statusStr.toLowerCase() === 'rejected') { status = 2; }

    return (
        <>
            <tr onClick={() => setExpanded(e => !e)}
                className={`border-b border-slate-100 cursor-pointer transition-colors hover:bg-slate-50/80 ${expanded ? 'bg-slate-50' : index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                <td className="px-5 py-3.5 text-xs text-slate-400 font-medium">{index + 1}</td>
                <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                            <User className="h-4 w-4 text-slate-500" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-700">{name}</p>
                            <p className="text-xs text-slate-400 font-mono">{typeof empId === 'string' ? empId.split('-')[0].toUpperCase() : empId}</p>
                        </div>
                    </div>
                </td>
                <td className="px-4 py-3.5 text-sm text-slate-600 whitespace-nowrap">{formatDate(log.fromDate ?? log.startDate)}</td>
                <td className="px-4 py-3.5 text-sm text-slate-600 whitespace-nowrap">{formatDate(log.toDate ?? log.endDate)}</td>
                <td className="px-4 py-3.5">
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-600 text-xs font-semibold rounded-lg border border-blue-100">{leaveType}</span>
                </td>
                <td className="px-4 py-3.5"><StatusBadge status={status} /></td>
                <td className="px-4 py-3.5 text-xs text-slate-500">{log.reason || '—'}</td>
                <td className="px-4 py-3.5 text-right">
                    <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform inline-block ${expanded ? 'rotate-180' : ''}`} />
                </td>
            </tr>
            {expanded && (
                <tr className="bg-slate-50 border-b border-slate-100">
                    <td colSpan={8} className="px-6 py-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <DetailCell label="Leave Type"  value={leaveType} />
                            <DetailCell label="From"        value={formatDate(log.fromDate ?? log.startDate)} />
                            <DetailCell label="To"          value={formatDate(log.toDate ?? log.endDate)} />
                            <DetailCell label="Employee ID" value={empId} />
                            <DetailCell label="Reason" value={log.reason || '—'} wide />
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}

// ── Shared Filter Bar ─────────────────────────────────────────────────────────
function FilterBar({ searchQuery, setSearchQuery, fromDate, setFromDate, toDate, setToDate, statusFilter, setStatusFilter, onSearch, onClear, hasFilters, showSearchButton = false, statusOptions }) {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4">
            <div className="flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[180px]">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Search</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input type="text" placeholder="Name or Employee ID…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                            className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300" />
                    </div>
                </div>
                <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">From</label>
                    <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="h-10 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
                </div>
                <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">To</label>
                    <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="h-10 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
                </div>
                <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Status</label>
                    <div className="relative">
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                            className="h-10 pl-3 pr-8 rounded-xl border border-slate-200 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white">
                            {statusOptions}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    </div>
                </div>
                {showSearchButton && (
                    <button onClick={onSearch} className="h-10 px-5 rounded-xl bg-slate-700 text-white text-sm font-semibold hover:bg-slate-800 transition-colors">
                        Search
                    </button>
                )}
                {hasFilters && (
                    <button onClick={onClear} className="h-10 px-4 rounded-xl border border-slate-200 text-sm text-slate-500 hover:bg-slate-50 transition-colors">Clear</button>
                )}
            </div>
        </div>
    );
}

// ── Attendance Tab ────────────────────────────────────────────────────────────
function AttendanceTab() {
    const [logs, setLogs]                 = useState([]);
    const [filtered, setFiltered]         = useState([]);
    const [loading, setLoading]           = useState(true);
    const [error, setError]               = useState(null);
    const [searchQuery, setSearchQuery]   = useState('');
    const [fromDate, setFromDate]         = useState('');
    const [toDate, setToDate]             = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage]                 = useState(1);
    const PAGE_SIZE = 10;

    const fetchLogs = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const [r0, r1, r2] = await Promise.all([
                fetch(`${ADMIN_API}/api/admin/attendance-corrections?status=0`, { headers: getAuthHeaders() }),
                fetch(`${ADMIN_API}/api/admin/attendance-corrections?status=1`, { headers: getAuthHeaders() }),
                fetch(`${ADMIN_API}/api/admin/attendance-corrections?status=2`, { headers: getAuthHeaders() }),
            ]);
            const parse = async (r) => { if (!r.ok) return []; const d = await r.json(); return Array.isArray(d) ? d : d.data ?? []; };
            const [p, a, rj] = await Promise.all([parse(r0), parse(r1), parse(r2)]);
            const all = [
                ...p.map(x  => ({ ...x,  status: 0 })),
                ...a.map(x  => ({ ...x,  status: 1 })),
                ...rj.map(x => ({ ...x, status: 2 })),
            ].sort((a, b) => new Date(b.requestedAt ?? 0) - new Date(a.requestedAt ?? 0));
            setLogs(all); setFiltered(all);
        } catch (e) { setError(e.message); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchLogs(); }, [fetchLogs]);

    useEffect(() => {
        let r = [...logs];
        if (statusFilter !== 'all') r = r.filter(l => l.status === parseInt(statusFilter));
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            r = r.filter(l => (l.employee?.name ?? l.employeeName ?? '').toLowerCase().includes(q) || (l.employee?.employeeCode ?? l.employee?.employeeId ?? '').toLowerCase().includes(q));
        }
        if (fromDate) r = r.filter(l => l.requestedAt && new Date(l.requestedAt) >= new Date(fromDate));
        if (toDate)   r = r.filter(l => l.requestedAt && new Date(l.requestedAt) <= new Date(toDate + 'T23:59:59'));
        setFiltered(r); setPage(1);
    }, [statusFilter, searchQuery, fromDate, toDate, logs]);

    const stats = { total: logs.length, pending: logs.filter(l => l.status === 0).length, approved: logs.filter(l => l.status === 1).length, rejected: logs.filter(l => l.status === 2).length };
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const handleExport = () => {
        const headers = ['Name','Emp ID','Requested On','Original In','Corrected In','Original Out','Corrected Out','Status','Reason'];
        const rows = filtered.map(l => { const emp = l.employee ?? {}; return [emp.name ?? l.employeeName ?? '', emp.employeeCode ?? emp.employeeId ?? '', formatDate(l.requestedAt), formatTime(l.originalPunchIn), formatTime(l.correctedPunchIn), formatTime(l.originalPunchOut), formatTime(l.correctedPunchOut), STATUS_CONFIG[l.status]?.label ?? '', l.reason ?? ''].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','); });
        const blob = new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'attendance-audit.csv'; a.click();
    };

    return (
        <div className="space-y-4">
            {!loading && !error && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {STAT_CARDS(stats).map(card => <StatCard key={card.label} {...card} />)}
                </div>
            )}
            <FilterBar
                searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                fromDate={fromDate} setFromDate={setFromDate}
                toDate={toDate} setToDate={setToDate}
                statusFilter={statusFilter} setStatusFilter={setStatusFilter}
                onClear={() => { setSearchQuery(''); setFromDate(''); setToDate(''); setStatusFilter('all'); }}
                hasFilters={!!(searchQuery || fromDate || toDate || statusFilter !== 'all')}
                statusOptions={<>
                    <option value="all">All Statuses</option>
                    <option value="0">Pending</option>
                    <option value="1">Approved</option>
                    <option value="2">Rejected</option>
                </>}
            />
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-slate-400" />
                        <span className="text-sm font-semibold text-slate-700">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
                        {filtered.length !== logs.length && <span className="text-xs text-slate-400">(filtered from {logs.length})</span>}
                    </div>
                    <button onClick={handleExport} disabled={filtered.length === 0} className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors">
                        <Download className="h-3.5 w-3.5" /> Export CSV
                    </button>
                </div>
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
                        <div className="w-8 h-8 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm">Loading…</span>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-3">
                        <AlertCircle className="h-10 w-10 text-red-400" />
                        <span className="text-sm text-red-500">{error}</span>
                        <button onClick={fetchLogs} className="text-sm text-blue-600 hover:underline">Retry</button>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
                        <CalendarCheck className="h-10 w-10 text-slate-300" />
                        <span className="text-sm">No records match your filters.</span>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/60">
                                    {['#','Employee','Requested On','Punch In Change','Status','Action By','Action At',''].map((h, i) => (
                                        <th key={i} className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {paginated.map((log, i) => (
                                    <AttendanceLogRow key={log.correctionId ?? log.attendanceCorrectionId ?? log.id ?? i} log={log} index={(page - 1) * PAGE_SIZE + i} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                <Pagination page={page} totalPages={totalPages} setPage={setPage} />
            </div>
        </div>
    );
}

// ── Leaves Tab ────────────────────────────────────────────────────────────────
function LeavesTab() {
    const { token } = useAuth();
    const [logs, setLogs]                 = useState([]);
    const [filtered, setFiltered]         = useState([]);
    const [loading, setLoading]           = useState(true);
    const [error, setError]               = useState(null);
    const [searchQuery, setSearchQuery]   = useState('');
    const [fromDate, setFromDate]         = useState('');
    const [toDate, setToDate]             = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage]                 = useState(1);
    const PAGE_SIZE = 10;

    const fetchLogs = useCallback(async (from = '', to = '', status = '') => {
        setLoading(true); setError(null);
        try {
            const params = new URLSearchParams();
            if (from)   params.append('fromDate', new Date(from + 'T00:00:00').toISOString());
            if (to)     params.append('toDate',   new Date(to   + 'T23:59:59').toISOString());
            if (status) params.append('status', status);
            const res = await fetch(`${ADMIN_API}/api/admin/reports/leaves?${params}`, {
                headers: { Authorization: `Bearer ${token}`, 'Cache-Control': 'no-cache' },
            });
            if (!res.ok) throw new Error(`Failed to load leave logs (${res.status})`);
            const data = await res.json();
            setLogs(Array.isArray(data) ? data : data.data ?? []);
        } catch (e) { setError(e.message); }
        finally { setLoading(false); }
    }, [token]);

    useEffect(() => { fetchLogs(); }, [fetchLogs]);

    useEffect(() => {
        if (!searchQuery.trim()) { setFiltered(logs); setPage(1); return; }
        const q = searchQuery.toLowerCase();
        setFiltered(logs.filter(l => (l.employeeName ?? '').toLowerCase().includes(q) || (l.employeeId ?? '').toLowerCase().includes(q)));
        setPage(1);
    }, [searchQuery, logs]);

    // Keep filtered in sync when logs change (no search active)
    useEffect(() => {
        if (!searchQuery.trim()) setFiltered(logs);
    }, [logs]);

    const normalize = (l) => {
        const s = l.status ?? '';
        if (typeof s === 'number') return s;
        if (s.toLowerCase() === 'approved') return 1;
        if (s.toLowerCase() === 'rejected') return 2;
        return 0;
    };
    const stats = { total: logs.length, pending: logs.filter(l => normalize(l) === 0).length, approved: logs.filter(l => normalize(l) === 1).length, rejected: logs.filter(l => normalize(l) === 2).length };
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const handleSearch = () => fetchLogs(fromDate, toDate, statusFilter);
    const handleClear  = () => { setFromDate(''); setToDate(''); setStatusFilter(''); setSearchQuery(''); fetchLogs(); };

    const handleExport = () => {
        const headers = ['Name','Emp ID','From','To','Leave Type','Status','Reason'];
        const rows = filtered.map(l => [l.employeeName ?? '', l.employeeId ?? '', formatDate(l.fromDate ?? l.startDate), formatDate(l.toDate ?? l.endDate), l.leaveType ?? l.type ?? '', l.status ?? '', l.reason ?? ''].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
        const blob = new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'leave-audit.csv'; a.click();
    };

    return (
        <div className="space-y-4">
            {!loading && !error && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {STAT_CARDS(stats).map(card => <StatCard key={card.label} {...card} />)}
                </div>
            )}
            <FilterBar
                searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                fromDate={fromDate} setFromDate={setFromDate}
                toDate={toDate} setToDate={setToDate}
                statusFilter={statusFilter} setStatusFilter={setStatusFilter}
                onSearch={handleSearch} onClear={handleClear}
                hasFilters={!!(fromDate || toDate || statusFilter || searchQuery)}
                showSearchButton
                statusOptions={<>
                    <option value="">All Statuses</option>
                    <option value="Approved">Approved</option>
                    <option value="Pending">Pending</option>
                    <option value="Rejected">Rejected</option>
                </>}
            />
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-slate-400" />
                        <span className="text-sm font-semibold text-slate-700">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
                        {filtered.length !== logs.length && <span className="text-xs text-slate-400">(filtered from {logs.length})</span>}
                    </div>
                    <button onClick={handleExport} disabled={filtered.length === 0} className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors">
                        <Download className="h-3.5 w-3.5" /> Export CSV
                    </button>
                </div>
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
                        <div className="w-8 h-8 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm">Loading…</span>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-3">
                        <AlertCircle className="h-10 w-10 text-red-400" />
                        <span className="text-sm text-red-500">{error}</span>
                        <button onClick={() => fetchLogs()} className="text-sm text-blue-600 hover:underline">Retry</button>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
                        <CalendarDays className="h-10 w-10 text-slate-300" />
                        <span className="text-sm">No records match your filters.</span>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/60">
                                    {['#','Employee','From','To','Type','Status','Reason',''].map((h, i) => (
                                        <th key={i} className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {paginated.map((log, i) => (
                                    <LeaveLogRow key={log.leaveId ?? log.id ?? i} log={log} index={(page - 1) * PAGE_SIZE + i} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                <Pagination page={page} totalPages={totalPages} setPage={setPage} />
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const AuditLogsPage = () => {
    const [activeTab, setActiveTab] = useState('attendance');

    const tabs = [
        { key: 'attendance', label: 'Attendance Corrections', icon: CalendarCheck },
        { key: 'leaves',     label: 'Leave Requests',         icon: CalendarDays  },
    ];

    return (
        <div className="space-y-6 animate-slide-up">
            <Breadcrumb />

            <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-slate-700 rounded-xl flex items-center justify-center">
                    <ShieldCheck className="h-5 w-5 text-white" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-slate-800">Audit Logs</h1>
                    <p className="text-xs text-slate-500">Admin activity on attendance corrections and leave requests</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.key;
                    return (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${active ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                            <Icon className="h-4 w-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {activeTab === 'attendance' ? <AttendanceTab /> : <LeavesTab />}
        </div>
    );
};

export default AuditLogsPage;