import React, { useState, useEffect } from 'react';
import useAuth from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { CalendarDays, UserCheck, UserX, UserMinus, Clock } from 'lucide-react';

const ReportsPage = () => {
    const { user, token } = useAuth();
    const navigate = useNavigate();

    const [reports, setReports]         = useState([]);
    const [summary, setSummary]         = useState(null);
    const [leaves, setLeaves]           = useState([]);
    const [loading, setLoading]         = useState(false);
    const [error, setError]             = useState('');
    const [activeTab, setActiveTab]     = useState('detailed');
    const [hoveredCard, setHoveredCard] = useState(null);
    const [filters, setFilters]         = useState({ fromDate: '', toDate: '' });

    // ── helpers ────────────────────────────────────────────────────────────────

    const today = () => new Date().toISOString().split('T')[0];
    const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString().split('T')[0];

    // ── fetchers ───────────────────────────────────────────────────────────────

    const fetchDetailed = async (fromDate, toDate) => {
        const params = new URLSearchParams();
        params.append('employeeId', user.employeeId);
        if (fromDate) params.append('from', new Date(fromDate + 'T00:00:00').toISOString());
        if (toDate)   params.append('to',   new Date(toDate   + 'T23:59:59').toISOString());
        const res = await apiClient.get(`/Reports/AttendanceDetailed?${params}`);
        setReports(res.data || []);
    };

    const fetchSummary = async (fromDate, toDate) => {
        const params = new URLSearchParams();
        params.append('employeeId', user.employeeId);
        if (fromDate) params.append('from', new Date(fromDate + 'T00:00:00').toISOString());
        if (toDate)   params.append('to',   new Date(toDate   + 'T23:59:59').toISOString());
        const res = await apiClient.get(`/Reports/AttendanceSummary?${params}`);
        setSummary(res.data);
    };

    const fetchLeaves = async () => {
        const params = new URLSearchParams();
        params.append('employeeId', user.employeeId);
        const res = await apiClient.get(`/Reports/MyLeaves?${params}`);
        setLeaves(res.data || []);
    };

    const fetchAll = async (fromDate = '', toDate = '') => {
        if (!user?.employeeId || !token) return;

        // ── BUG FIX: validate date range before hitting the API ──
        if (fromDate && toDate && fromDate > toDate) {
            setError('From Date cannot be later than To Date.');
            return;
        }

        setLoading(true);
        setError('');
        try {
            await Promise.all([
                fetchDetailed(fromDate, toDate),
                fetchSummary(fromDate, toDate),
                fetchLeaves(),
            ]);
        } catch (err) {
            if (err.response?.status === 401) {
                localStorage.removeItem('token');
                navigate('/login');
                return;
            }
            setError('Failed to load reports. ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    // ── BUG FIX: default toDate is today, fromDate is 30 days ago ──
    useEffect(() => {
        if (user?.employeeId && token) {
            const start = daysAgo(30);
            const end   = today();
            setFilters({ fromDate: start, toDate: end });
            fetchAll(start, end);
        }
    }, [user?.employeeId, token]);

    const handleSearch = () => {
        fetchAll(filters.fromDate, filters.toDate);
    };

    const handleClear = () => {
        const start = daysAgo(30);
        const end   = today();
        setFilters({ fromDate: start, toDate: end });
        fetchAll(start, end);
    };

    // ── BUG FIX: prevent toDate going before fromDate via the inputs ──
    const handleFilterChange = (field, value) => {
        setFilters(prev => {
            const next = { ...prev, [field]: value };
            // auto-correct: if fromDate moves past toDate, clamp toDate
            if (field === 'fromDate' && next.toDate && value > next.toDate) {
                next.toDate = value;
            }
            // auto-correct: if toDate moves before fromDate, clamp fromDate
            if (field === 'toDate' && next.fromDate && value < next.fromDate) {
                next.fromDate = value;
            }
            return next;
        });
        setError('');
    };

    // ── formatters ─────────────────────────────────────────────────────────────

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '--';
    const formatTime = (t) => {
        if (!t) return '--:--';
        const [h, m] = t.split(':');
        const hr = parseInt(h);
        return `${String(hr % 12 || 12).padStart(2, '0')}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
    };

    // ── sub-components ─────────────────────────────────────────────────────────

    const StatusBadge = ({ status }) => {
        const styles = {
            Present:  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            Leave:    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
            Absent:   'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
            Pending:  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
            Approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            Rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        };
        return (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                {status}
            </span>
        );
    };

    // ── summary card configs ───────────────────────────────────────────────────

    const SUMMARY_CARDS = summary ? [
        {
            label: 'Total Days',   value: summary.totalDays,
            icon: <CalendarDays className="h-7 w-7" />,
            baseColor: 'bg-blue-50 text-blue-700',     activeColor: 'bg-blue-500 text-white',
            border: 'border-blue-100',                  activeBorder: 'border-blue-500',
            iconBase: 'bg-blue-100 text-blue-600',      iconActive: 'bg-blue-400 text-white',
            shadow: 'shadow-blue-200',                  blob: 'bg-blue-300',
        },
        {
            label: 'Present',      value: summary.presentDays,
            icon: <UserCheck className="h-7 w-7" />,
            baseColor: 'bg-green-50 text-green-700',   activeColor: 'bg-green-500 text-white',
            border: 'border-green-100',                 activeBorder: 'border-green-500',
            iconBase: 'bg-green-100 text-green-600',    iconActive: 'bg-green-400 text-white',
            shadow: 'shadow-green-200',                 blob: 'bg-green-300',
        },
        {
            label: 'Absent',       value: summary.absentDays,
            icon: <UserX className="h-7 w-7" />,
            baseColor: 'bg-red-50 text-red-700',       activeColor: 'bg-red-500 text-white',
            border: 'border-red-100',                   activeBorder: 'border-red-500',
            iconBase: 'bg-red-100 text-red-500',        iconActive: 'bg-red-400 text-white',
            shadow: 'shadow-red-200',                   blob: 'bg-red-300',
        },
        {
            label: 'Leave',        value: summary.leaveDays,
            icon: <UserMinus className="h-7 w-7" />,
            baseColor: 'bg-yellow-50 text-yellow-700', activeColor: 'bg-yellow-500 text-white',
            border: 'border-yellow-100',                activeBorder: 'border-yellow-500',
            iconBase: 'bg-yellow-100 text-yellow-600',  iconActive: 'bg-yellow-400 text-white',
            shadow: 'shadow-yellow-200',                blob: 'bg-yellow-300',
        },
        {
            label: 'Hours Worked', value: `${summary.workingHours}h`,
            icon: <Clock className="h-7 w-7" />,
            baseColor: 'bg-purple-50 text-purple-700', activeColor: 'bg-purple-500 text-white',
            border: 'border-purple-100',                activeBorder: 'border-purple-500',
            iconBase: 'bg-purple-100 text-purple-600',  iconActive: 'bg-purple-400 text-white',
            shadow: 'shadow-purple-200',                blob: 'bg-purple-300',
        },
    ] : [];

    const thClass = "p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300";
    const tdClass = "p-3 text-sm text-gray-700 dark:text-gray-300";

    // ── render ─────────────────────────────────────────────────────────────────

    return (
        <div className="space-y-6">

            {/* ── Filter bar ── */}
            <div className="flex flex-wrap gap-4 p-4 bg-white dark:bg-gray-800 rounded-2xl items-end shadow-sm border border-gray-100 dark:border-gray-700">
                {[
                    { field: 'fromDate', label: 'From Date', max: filters.toDate || today() },
                    { field: 'toDate',   label: 'To Date',   min: filters.fromDate, max: today() },
                ].map(({ field, label, min, max }) => (
                    <div key={field} className="flex flex-col gap-1">
                        <label className="text-sm text-gray-500 dark:text-gray-400">{label}</label>
                        <input
                            type="date"
                            value={filters[field]}
                            min={min}
                            max={max}
                            onChange={e => handleFilterChange(field, e.target.value)}
                            className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 py-1.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                ))}
                <button
                    onClick={handleSearch}
                    disabled={loading}
                    className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-5 py-1.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                    {loading ? 'Loading…' : 'Search'}
                </button>
                <button
                    onClick={handleClear}
                    className="underline text-gray-500 dark:text-gray-400 text-sm"
                >
                    Clear
                </button>
            </div>

            {/* ── Error ── */}
            {error && (
                <div className="text-red-500 px-2 text-sm">{error}</div>
            )}

            {/* ── Summary Cards ── */}
            {summary && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {SUMMARY_CARDS.map((card, i) => {
                        const isHovered = hoveredCard === i;
                        return (
                            <div
                                key={card.label}
                                onMouseEnter={() => setHoveredCard(i)}
                                onMouseLeave={() => setHoveredCard(null)}
                                className={`
                                    relative rounded-2xl p-5 border cursor-default overflow-hidden
                                    flex items-center gap-3 select-none
                                    transition-all duration-300 ease-out
                                    ${isHovered
                                        ? `${card.activeColor} ${card.activeBorder} -translate-y-3 scale-[1.04] shadow-2xl ${card.shadow}`
                                        : `${card.baseColor} ${card.border} shadow-sm hover:shadow-md`
                                    }
                                `}
                            >
                                {isHovered && (
                                    <div className="absolute inset-0 rounded-2xl bg-white opacity-10 pointer-events-none" />
                                )}
                                <div className={`p-2.5 rounded-2xl shrink-0 transition-all duration-300 ${isHovered ? card.iconActive : card.iconBase}`}>
                                    {card.icon}
                                </div>
                                <div className="relative z-10 min-w-0">
                                    <div className={`font-bold leading-none transition-all duration-300 ${isHovered ? 'text-3xl' : 'text-2xl'}`}>
                                        {card.value}
                                    </div>
                                    <div className={`text-xs mt-1.5 font-semibold leading-tight transition-all duration-200 ${isHovered ? 'opacity-95' : 'opacity-60'}`}>
                                        {card.label}
                                    </div>
                                </div>
                                <div className={`
                                    absolute -right-5 -bottom-5 rounded-full pointer-events-none transition-all duration-300
                                    ${isHovered ? 'w-24 h-24 opacity-25 bg-white' : `w-16 h-16 opacity-15 ${card.blob}`}
                                `} />
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Tabs ── */}
            <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700">
                {[
                    { key: 'detailed', label: 'Attendance Detail' },
                    { key: 'leaves',   label: 'My Leaves'         },
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`pb-2 px-1 text-sm font-medium border-b-2 transition-all ${
                            activeTab === tab.key
                                ? 'border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100'
                                : 'border-transparent text-gray-400 dark:text-gray-500'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── Attendance Table ── */}
            {activeTab === 'detailed' && (
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">
                    <table className="min-w-full">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                                {['Name', 'Date', 'Status', 'In Time', 'Out Time', 'Hours Worked'].map(h => (
                                    <th key={h} className={thClass}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" className="text-center p-6 text-gray-400">Loading...</td></tr>
                            ) : reports.length > 0 ? reports.map((r, i) => (
                                <tr key={i} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                                    <td className={tdClass}>{r.employeeName}</td>
                                    <td className={tdClass}>{formatDate(r.attendanceDate)}</td>
                                    <td className={tdClass}><StatusBadge status={r.status} /></td>
                                    <td className={tdClass}>{formatTime(r.checkIn)}</td>
                                    <td className={tdClass}>{formatTime(r.checkOut)}</td>
                                    <td className={tdClass}>{r.hoursWorked}h</td>
                                </tr>
                            )) : (
                                <tr><td colSpan="6" className="text-center p-6 text-gray-400">No records found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ── Leaves Table ── */}
            {activeTab === 'leaves' && (
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">
                    <table className="min-w-full">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                                {['Type', 'From', 'To', 'Reason', 'Status', 'Applied At'].map(h => (
                                    <th key={h} className={thClass}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" className="text-center p-6 text-gray-400">Loading...</td></tr>
                            ) : leaves.length > 0 ? leaves.map((l, i) => (
                                <tr key={i} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                                    <td className={tdClass}>{l.type}</td>
                                    <td className={tdClass}>{formatDate(l.from)}</td>
                                    <td className={tdClass}>{formatDate(l.to)}</td>
                                    <td className={tdClass}>{l.reason}</td>
                                    <td className={tdClass}><StatusBadge status={l.status} /></td>
                                    <td className={tdClass}>{formatDate(l.appliedAt)}</td>
                                </tr>
                            )) : (
                                <tr><td colSpan="6" className="text-center p-6 text-gray-400">No leave records found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ReportsPage;