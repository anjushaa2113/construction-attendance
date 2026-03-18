import React, { useState, useEffect } from 'react';
import Breadcrumb from '../../components/layout/Breadcrumb';
import useAuth from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const BASE_URL = 'https://localhost:7008';

const TABS = [
    { key: 'attendance', label: 'Attendance' },
    { key: 'leaves', label: 'Leaves' },
    { key: 'employees', label: 'Employees' },
];

const AdminReportsPage = () => {
    const { token } = useAuth();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('attendance');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [attendanceData, setAttendanceData] = useState([]);
    const [leavesData, setLeavesData] = useState([]);
    const [employeesData, setEmployeesData] = useState([]);

    const [attendanceFilters, setAttendanceFilters] = useState({ fromDate: '', toDate: '' });
    const [leavesFilters, setLeavesFilters] = useState({ fromDate: '', toDate: '', status: '' });

    const authHeaders = {
        Authorization: `Bearer ${token}`,
        'Cache-Control': 'no-cache',
    };

    const handleUnauth = (res) => {
        if (res.status === 401) {
            localStorage.removeItem('token');
            navigate('/login');
            return true;
        }
        return false;
    };

    const fetchAttendance = async (from = '', to = '') => {
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams();
            if (from) params.append('fromDate', new Date(from + 'T00:00:00').toISOString());
            if (to) params.append('toDate', new Date(to + 'T23:59:59').toISOString());

            const res = await fetch(`${BASE_URL}/api/admin/reports/attendance?${params}`, {
                headers: authHeaders,
            });
            if (handleUnauth(res)) return;
            if (!res.ok) throw new Error();
            setAttendanceData(await res.json());
        } catch {
            setError('Failed to load attendance report.');
        } finally {
            setLoading(false);
        }
    };

    const fetchLeaves = async (from = '', to = '', status = '') => {
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams();
            if (from) params.append('fromDate', new Date(from + 'T00:00:00').toISOString());
            if (to) params.append('toDate', new Date(to + 'T23:59:59').toISOString());
            if (status) params.append('status', status);

            const res = await fetch(`${BASE_URL}/api/admin/reports/leaves?${params}`, {
                headers: authHeaders,
            });
            if (handleUnauth(res)) return;
            if (!res.ok) throw new Error();
            setLeavesData(await res.json());
        } catch {
            setError('Failed to load leaves report.');
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${BASE_URL}/api/admin/reports/employees`, {
                headers: authHeaders,
            });
            if (handleUnauth(res)) return;
            if (!res.ok) throw new Error();
            setEmployeesData(await res.json());
        } catch {
            setError('Failed to load employees report.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!token) return;
        setError('');
        if (activeTab === 'attendance') fetchAttendance();
        if (activeTab === 'leaves') fetchLeaves();
        if (activeTab === 'employees') fetchEmployees();
    }, [activeTab, token]);

    const formatDate = (d) => (d ? new Date(d).toLocaleDateString('en-GB') : '--');

    const formatTime = (t) => {
        if (!t) return '--:--';
        const [h, m] = t.split(':');
        const hh = parseInt(h);
        return `${String(hh % 12 || 12).padStart(2, '0')}:${m} ${hh >= 12 ? 'PM' : 'AM'}`;
    };

    return (
        <div className="space-y-6">
            <Breadcrumb
                items={[
                    { label: 'Dashboard', path: '/admin/dashboard' },
                    { label: 'Reports', path: '/admin/reports' },
                ]}
            />

            {/* TABS */}
            <div className="flex border-b bg-white rounded-t-lg px-4">
                {TABS.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === tab.key
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {error && <div className="text-red-500 px-1">{error}</div>}

            {/* ── ATTENDANCE TAB ── */}
            {activeTab === 'attendance' && (
                <>
                    <div className="flex flex-wrap gap-4 p-4 bg-white rounded-lg items-center">
                        <label className="text-sm text-gray-600">From</label>
                        <input
                            type="date"
                            value={attendanceFilters.fromDate}
                            onChange={(e) =>
                                setAttendanceFilters((p) => ({ ...p, fromDate: e.target.value }))
                            }
                            className="border px-3 py-1.5 rounded text-sm"
                        />
                        <label className="text-sm text-gray-600">To</label>
                        <input
                            type="date"
                            value={attendanceFilters.toDate}
                            onChange={(e) =>
                                setAttendanceFilters((p) => ({ ...p, toDate: e.target.value }))
                            }
                            className="border px-3 py-1.5 rounded text-sm"
                        />
                        <button
                            onClick={() =>
                                fetchAttendance(attendanceFilters.fromDate, attendanceFilters.toDate)
                            }
                            className="bg-black text-white px-4 py-1.5 rounded text-sm"
                        >
                            Search
                        </button>
                        <button
                            onClick={() => {
                                setAttendanceFilters({ fromDate: '', toDate: '' });
                                fetchAttendance();
                            }}
                            className="underline text-gray-600 text-sm"
                        >
                            Clear
                        </button>
                    </div>

                    <div className="bg-white border rounded-lg overflow-hidden">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="border-b bg-gray-50">
                                    <th className="p-3 text-left font-semibold">Name</th>
                                    <th className="p-3 text-left font-semibold">Emp ID</th>
                                    <th className="p-3 text-left font-semibold">Date</th>
                                    <th className="p-3 text-left font-semibold">Status</th>
                                    <th className="p-3 text-left font-semibold">In</th>
                                    <th className="p-3 text-left font-semibold">Out</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="text-center p-4 text-gray-400">
                                            Loading...
                                        </td>
                                    </tr>
                                ) : attendanceData.length > 0 ? (
                                    attendanceData.map((r, i) => (
                                        <tr key={i} className="border-b hover:bg-gray-50">
                                            <td className="p-3">{r.employeeName}</td>
                                            <td className="p-3 text-xs text-gray-500 font-mono">
                                                {r.employeeId}
                                            </td>
                                            <td className="p-3">{formatDate(r.date)}</td>
                                            <td className="p-3">
                                                <span
                                                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                        r.status === 'Present'
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-red-100 text-red-700'
                                                    }`}
                                                >
                                                    {r.status}
                                                </span>
                                            </td>
                                            <td className="p-3">{formatTime(r.inTime)}</td>
                                            <td className="p-3">{formatTime(r.outTime)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="text-center p-4 text-gray-400">
                                            No records found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* ── LEAVES TAB ── */}
            {activeTab === 'leaves' && (
                <>
                    <div className="flex flex-wrap gap-4 p-4 bg-white rounded-lg items-center">
                        <label className="text-sm text-gray-600">From</label>
                        <input
                            type="date"
                            value={leavesFilters.fromDate}
                            onChange={(e) =>
                                setLeavesFilters((p) => ({ ...p, fromDate: e.target.value }))
                            }
                            className="border px-3 py-1.5 rounded text-sm"
                        />
                        <label className="text-sm text-gray-600">To</label>
                        <input
                            type="date"
                            value={leavesFilters.toDate}
                            onChange={(e) =>
                                setLeavesFilters((p) => ({ ...p, toDate: e.target.value }))
                            }
                            className="border px-3 py-1.5 rounded text-sm"
                        />
                        <select
                            value={leavesFilters.status}
                            onChange={(e) =>
                                setLeavesFilters((p) => ({ ...p, status: e.target.value }))
                            }
                            className="border px-3 py-1.5 rounded text-sm"
                        >
                            <option value="">All Statuses</option>
                            <option value="Approved">Approved</option>
                            <option value="Pending">Pending</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                        <button
                            onClick={() =>
                                fetchLeaves(
                                    leavesFilters.fromDate,
                                    leavesFilters.toDate,
                                    leavesFilters.status
                                )
                            }
                            className="bg-black text-white px-4 py-1.5 rounded text-sm"
                        >
                            Search
                        </button>
                        <button
                            onClick={() => {
                                setLeavesFilters({ fromDate: '', toDate: '', status: '' });
                                fetchLeaves();
                            }}
                            className="underline text-gray-600 text-sm"
                        >
                            Clear
                        </button>
                    </div>

                    <div className="bg-white border rounded-lg overflow-hidden">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="border-b bg-gray-50">
                                    <th className="p-3 text-left font-semibold">Name</th>
                                    <th className="p-3 text-left font-semibold">Emp ID</th>
                                    <th className="p-3 text-left font-semibold">From</th>
                                    <th className="p-3 text-left font-semibold">To</th>
                                    <th className="p-3 text-left font-semibold">Type</th>
                                    <th className="p-3 text-left font-semibold">Status</th>
                                    <th className="p-3 text-left font-semibold">Reason</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="7" className="text-center p-4 text-gray-400">
                                            Loading...
                                        </td>
                                    </tr>
                                ) : leavesData.length > 0 ? (
                                    leavesData.map((r, i) => (
                                        <tr key={i} className="border-b hover:bg-gray-50">
                                            <td className="p-3">{r.employeeName}</td>
                                            <td className="p-3 text-xs text-gray-500 font-mono">
                                                {r.employeeId}
                                            </td>
                                            <td className="p-3">
                                                {formatDate(r.fromDate || r.startDate)}
                                            </td>
                                            <td className="p-3">
                                                {formatDate(r.toDate || r.endDate)}
                                            </td>
                                            <td className="p-3">{r.leaveType || r.type || '--'}</td>
                                            <td className="p-3">
                                                <span
                                                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                        r.status === 'Approved'
                                                            ? 'bg-green-100 text-green-700'
                                                            : r.status === 'Rejected'
                                                            ? 'bg-red-100 text-red-700'
                                                            : 'bg-yellow-100 text-yellow-700'
                                                    }`}
                                                >
                                                    {r.status}
                                                </span>
                                            </td>
                                            <td className="p-3 text-gray-500">
                                                {r.reason || '--'}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="text-center p-4 text-gray-400">
                                            No records found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* ── EMPLOYEES TAB ── */}
            {activeTab === 'employees' && (
                <div className="bg-white border rounded-lg overflow-hidden">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="border-b bg-gray-50">
                                <th className="p-3 text-left font-semibold">Name</th>
                                <th className="p-3 text-left font-semibold">Email</th>
                                <th className="p-3 text-left font-semibold">Role</th>
                                <th className="p-3 text-left font-semibold">Status</th>
                                <th className="p-3 text-left font-semibold">ID</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="text-center p-4 text-gray-400">
                                        Loading...
                                    </td>
                                </tr>
                            ) : employeesData.length > 0 ? (
                                employeesData.map((e, i) => (
                                    <tr key={i} className="border-b hover:bg-gray-50">
                                        <td className="p-3 font-medium">{e.name}</td>
                                        <td className="p-3 text-gray-500">{e.email}</td>
                                        <td className="p-3">
                                            <span
                                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                    e.role === 'Admin'
                                                        ? 'bg-purple-100 text-purple-700'
                                                        : 'bg-blue-100 text-blue-700'
                                                }`}
                                            >
                                                {e.role}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            <span
                                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                    e.isActive
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-gray-100 text-gray-500'
                                                }`}
                                            >
                                                {e.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="p-3 text-xs text-gray-400 font-mono">
                                            {e.id}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="text-center p-4 text-gray-400">
                                        No records found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AdminReportsPage;