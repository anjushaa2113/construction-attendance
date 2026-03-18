import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Calendar, Users, UserCheck, UserMinus, ClipboardList } from 'lucide-react';
import Card from '../../components/ui/Card';

const ADMIN_API = import.meta.env.VITE_ADMIN_API_URL || 'https://localhost:7008';

const MONTHS = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
];

function formatDate(date) {
    return date.toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
}

const DashboardPage = () => {

    const [dashboardStats, setDashboardStats] = useState(null);
    const [statsLoading, setStatsLoading]     = useState(true);
    const [statsError, setStatsError]         = useState('');
    const [activeCard, setActiveCard]         = useState(null);

    const [leaveData, setLeaveData]       = useState([]);
    const [leaveLoading, setLeaveLoading] = useState(true);

    const [bestEmployees, setBestEmployees] = useState([]);
    const [empLoading, setEmpLoading]       = useState(true);

    const [year, setYear]   = useState('2026');
    const [month, setMonth] = useState('March');

    const getMonthRange = (monthName, yearStr) => {
        const monthIndex = MONTHS.indexOf(monthName);
        const y = parseInt(yearStr);
        const fromDate = new Date(y, monthIndex, 1).toISOString();
        const toDate   = new Date(y, monthIndex + 1, 0, 23, 59, 59).toISOString();
        return { fromDate, toDate };
    };

    const countDays = (startDate, endDate) => {
        const start = new Date(startDate);
        const end   = new Date(endDate);
        const diff  = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
        return diff > 0 ? diff : 1;
    };

    const authHeader = () => {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        return { Authorization: `Bearer ${token}` };
    };

    useEffect(() => {
        const fetchDashboard = async () => {
            setStatsLoading(true); setStatsError('');
            try {
                const res = await fetch(`${ADMIN_API}/api/admin/dashboard`, { headers: authHeader() });
                if (!res.ok) throw new Error(`Status ${res.status}`);
                setDashboardStats(await res.json());
            } catch (err) {
                setStatsError('Failed to load dashboard stats.');
            } finally {
                setStatsLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    useEffect(() => {
        const fetchLeaveAnalysis = async () => {
            setLeaveLoading(true);
            try {
                const { fromDate, toDate } = getMonthRange(month, year);
                const [attRes, leaveRes] = await Promise.all([
                    fetch(`${ADMIN_API}/api/admin/reports/attendance?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}`, { headers: authHeader() }),
                    fetch(`${ADMIN_API}/api/admin/reports/leaves?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}`, { headers: authHeader() }),
                ]);
                const attendance = attRes.ok  ? await attRes.json()  : [];
                const leaves     = leaveRes.ok ? await leaveRes.json() : [];

                const presentCount = attendance.filter(a => a.status === 'Present').length;
                const absentCount  = attendance.filter(a => a.status === 'Absent').length;
                let approvedDays = 0, pendingDays = 0, rejectedDays = 0;
                leaves.forEach(leave => {
                    const days = countDays(leave.startDate, leave.endDate);
                    if      (leave.status === 'Approved')  approvedDays += days;
                    else if (leave.status === 'Pending')   pendingDays  += days;
                    else if (leave.status === 'Rejected')  rejectedDays += days;
                });
                setLeaveData([
                    presentCount  > 0 && { name: 'Present',       value: presentCount,  color: '#10b981' },
                    approvedDays  > 0 && { name: 'On Leave',       value: approvedDays,  color: '#0ea5e9' },
                    pendingDays   > 0 && { name: 'Pending Leave',  value: pendingDays,   color: '#f59e0b' },
                    absentCount   > 0 && { name: 'Absent',         value: absentCount,   color: '#f43f5e' },
                    rejectedDays  > 0 && { name: 'Leave Rejected', value: rejectedDays,  color: '#64748b' },
                ].filter(Boolean));
            } catch (err) {
                setLeaveData([]);
            } finally {
                setLeaveLoading(false);
            }
        };
        fetchLeaveAnalysis();
    }, [month, year]);

    useEffect(() => {
        const fetchBestEmployees = async () => {
            setEmpLoading(true);
            try {
                const empRes = await fetch(`${ADMIN_API}/api/admin/reports/employees`, { headers: authHeader() });
                if (!empRes.ok) throw new Error();
                const employees = await empRes.json();
                const fromDate = `${year}-01-01T00:00:00`;
                const toDate   = `${year}-12-31T23:59:59`;
                const [attRes, leaveRes] = await Promise.all([
                    fetch(`${ADMIN_API}/api/admin/reports/attendance?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}`, { headers: authHeader() }),
                    fetch(`${ADMIN_API}/api/admin/reports/leaves?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}`, { headers: authHeader() }),
                ]);
                const attendance = attRes.ok  ? await attRes.json()  : [];
                const leaves     = leaveRes.ok ? await leaveRes.json() : [];

                const attMap = {};
                attendance.forEach(record => {
                    const id = record.employeeId ?? record.EmployeeId;
                    if (!id) return;
                    if (!attMap[id]) attMap[id] = { present: 0, total: 0 };
                    attMap[id].total++;
                    if (record.status === 'Present') attMap[id].present++;
                });
                leaves.forEach(leave => {
                    if (leave.status !== 'Approved') return;
                    const id   = leave.employeeId;
                    const days = countDays(leave.startDate, leave.endDate);
                    if (!attMap[id]) attMap[id] = { present: 0, total: 0 };
                    attMap[id].present += days;
                    attMap[id].total   += days;
                });
                setBestEmployees(
                    employees
                        .map(emp => {
                            const id    = emp.id ?? emp.employeeId;
                            const stats = attMap[id];
                            const pct   = stats?.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;
                            return {
                                id,
                                empId:      id ? id.replace(/-/g, '').slice(0, 6).toUpperCase() : 'N/A',
                                name:       emp.name ?? emp.fullName ?? '—',
                                category:   emp.role ?? emp.designation ?? '—',
                                attendance: pct,
                                total:      stats?.total ?? 0,
                            };
                        })
                        .filter(emp => emp.total > 0)
                        .sort((a, b) => b.attendance - a.attendance)
                        .slice(0, 5)
                );
            } catch (err) {
                setBestEmployees([]);
            } finally {
                setEmpLoading(false);
            }
        };
        fetchBestEmployees();
    }, [year]);

    const statCards = dashboardStats ? [
        { label: 'Total Employees',        value: dashboardStats.totalEmployees,       icon: <Users className="h-6 w-6" />,       baseColor: 'bg-blue-50   text-blue-700',   activeColor: 'bg-blue-600  text-white', iconBase: 'bg-blue-100  text-blue-600',  iconActive: 'bg-blue-500  text-white', shadow: 'shadow-blue-200',   border: 'border-blue-100',   activeBorder: 'border-blue-600'   },
        { label: 'Present Today',          value: dashboardStats.presentToday,         icon: <UserCheck className="h-6 w-6" />,   baseColor: 'bg-green-50  text-green-700',  activeColor: 'bg-green-600 text-white', iconBase: 'bg-green-100 text-green-600', iconActive: 'bg-green-500 text-white', shadow: 'shadow-green-200',  border: 'border-green-100',  activeBorder: 'border-green-600'  },
        { label: 'On Leave Today',         value: dashboardStats.onLeaveToday,         icon: <UserMinus className="h-6 w-6" />,   baseColor: 'bg-yellow-50 text-yellow-700', activeColor: 'bg-yellow-500 text-white',iconBase: 'bg-yellow-100 text-yellow-600',iconActive: 'bg-yellow-400 text-white',shadow: 'shadow-yellow-200', border: 'border-yellow-100', activeBorder: 'border-yellow-500' },
        { label: 'Pending Leave Requests', value: dashboardStats.pendingLeaveRequests, icon: <ClipboardList className="h-6 w-6" />,baseColor: 'bg-red-50   text-red-700',    activeColor: 'bg-red-600   text-white', iconBase: 'bg-red-100   text-red-600',   iconActive: 'bg-red-500   text-white', shadow: 'shadow-red-200',    border: 'border-red-100',    activeBorder: 'border-red-600'    },
    ] : [];

    const CustomTooltip = ({ active, payload }) => {
        if (!active || !payload?.length) return null;
        return (
            <div className="bg-white rounded-xl shadow-lg px-4 py-2 border border-slate-100">
                <p className="font-semibold text-slate-700">{payload[0].name}</p>
                <p className="text-slate-500 text-sm">{payload[0].value} days</p>
            </div>
        );
    };

    return (
        <div className="space-y-8 animate-slide-up">

            {/* ── Date display ── */}
            <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50">
                    <Calendar className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider leading-none mb-0.5">Today</p>
                    <p className="text-sm font-semibold text-slate-700 leading-none">{formatDate(new Date())}</p>
                </div>
            </div>

            {statsError && <div className="text-red-500 text-sm px-2">{statsError}</div>}

            {/* ── Stat Cards ── */}
            {statsLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1,2,3,4].map(i => <div key={i} className="rounded-2xl p-5 bg-gray-100 animate-pulse h-28" />)}
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {statCards.map((card, i) => {
                        const isActive = activeCard === i;
                        return (
                            <div key={card.label}
                                onMouseEnter={() => setActiveCard(i)}
                                onMouseLeave={() => setActiveCard(null)}
                                onClick={() => setActiveCard(isActive ? null : i)}
                                className={`relative rounded-2xl p-5 border cursor-pointer flex items-center gap-4 overflow-hidden transition-all duration-300 ease-out select-none ${isActive ? `${card.activeColor} ${card.activeBorder} shadow-xl ${card.shadow} -translate-y-2 scale-[1.03]` : `${card.baseColor} ${card.border} shadow-sm hover:shadow-md`}`}
                            >
                                {isActive && <div className="absolute inset-0 opacity-20 bg-white rounded-2xl blur-xl pointer-events-none" />}
                                <div className={`p-3 rounded-xl transition-all duration-300 shrink-0 ${isActive ? card.iconActive : card.iconBase}`}>
                                    {card.icon}
                                </div>
                                <div className="relative z-10">
                                    <div className={`text-3xl font-bold transition-all duration-300 ${isActive ? 'scale-110 origin-left' : ''}`}>{card.value}</div>
                                    <div className={`text-xs mt-0.5 font-medium transition-colors duration-300 ${isActive ? 'opacity-90' : 'opacity-70'}`}>{card.label}</div>
                                </div>
                                <div className={`absolute -right-4 -bottom-4 w-20 h-20 rounded-full opacity-10 transition-all duration-300 ${isActive ? 'scale-150 opacity-20 bg-white' : 'bg-current'}`} />
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Charts + Table ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="flex flex-col overflow-hidden">
                    <div className="flex w-full justify-between items-center mb-10">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Leave Analysis</h2>
                            <p className="text-sm text-slate-500 mt-1">Attendance distribution for {month} {year}</p>
                        </div>
                        <div className="flex gap-2">
                            <select value={month} onChange={e => setMonth(e.target.value)}
                                className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 py-1.5 px-4 rounded-xl text-xs font-semibold focus:outline-none cursor-pointer transition-all">
                                {MONTHS.map(m => <option key={m}>{m}</option>)}
                            </select>
                            <select value={year} onChange={e => setYear(e.target.value)}
                                className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 py-1.5 px-4 rounded-xl text-xs font-semibold focus:outline-none cursor-pointer transition-all">
                                <option>2026</option><option>2025</option>
                            </select>
                        </div>
                    </div>
                    <div className="w-full h-[300px] flex justify-center">
                        {leaveLoading ? (
                            <div className="flex items-center justify-center w-full">
                                <div className="w-32 h-32 rounded-full bg-gray-100 animate-pulse" />
                            </div>
                        ) : leaveData.length === 0 ? (
                            <div className="flex items-center justify-center w-full text-slate-400 text-sm">No data for {month} {year}</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={leaveData} cx="50%" cy="50%" innerRadius={80} outerRadius={105} paddingAngle={4} dataKey="value" stroke="none">
                                        {leaveData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </Card>

                <Card className="flex flex-col overflow-hidden">
                    <div className="mb-8">
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Best Employees</h2>
                        <p className="text-sm text-slate-500 mt-1">Top performers this year ({year})</p>
                    </div>
                    {empLoading ? (
                        <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}</div>
                    ) : bestEmployees.length === 0 ? (
                        <div className="flex items-center justify-center flex-1 text-slate-400 text-sm">No attendance data available for {year}</div>
                    ) : (
                        <div className="overflow-hidden border border-slate-100 rounded-xl">
                            <table className="min-w-full divide-y divide-slate-100">
                                <thead className="bg-slate-50/50">
                                    <tr>
                                        {['ID','Name','Role','Attendance'].map(h => (
                                            <th key={h} className={`px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider ${h === 'Attendance' ? 'text-center' : 'text-left'}`}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-50">
                                    {bestEmployees.map(emp => (
                                        <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-4 py-4 text-sm font-bold text-slate-400">{emp.empId}</td>
                                            <td className="px-4 py-4 text-sm font-semibold text-slate-900">{emp.name}</td>
                                            <td className="px-4 py-4 text-sm text-slate-500">{emp.category}</td>
                                            <td className="px-4 py-4 text-sm">
                                                <div className="flex items-center justify-center gap-2">
                                                    <div className="flex-1 w-16 bg-slate-100 rounded-full h-1.5">
                                                        <div className="bg-blue-500 h-full rounded-full" style={{ width: `${emp.attendance}%` }} />
                                                    </div>
                                                    <span className="font-bold text-slate-900">{emp.attendance}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default DashboardPage;