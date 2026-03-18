import { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  UserCheck, UserX, AlertCircle, Calendar,
  ChevronLeft, ChevronRight, Clock, TrendingUp,
} from 'lucide-react';
import { getEmployeeDashboard, getMonthlyAttendance } from '../../services/employeeService';

// ── constants ──────────────────────────────────────────────────────────────────

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const STATUS_META = {
  present: { label: 'Present', color: '#22c55e', pill: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' },
  absent:  { label: 'Absent',  color: '#ef4444', pill: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300'         },
  leave:   { label: 'Leave',   color: '#8b5cf6', pill: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300' },
  weekend: { label: 'Weekend', color: '#cbd5e1', pill: 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'     },
};

const CHART_BARS = [
  { key: 'present', label: 'Present', color: '#22c55e', text: 'text-green-700 dark:text-green-300',   track: 'bg-green-100 dark:bg-green-900/30',   pill: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'     },
  { key: 'absent',  label: 'Absent',  color: '#ef4444', text: 'text-red-600 dark:text-red-300',       track: 'bg-red-100 dark:bg-red-900/30',       pill: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300'             },
  { key: 'leave',   label: 'Leave',   color: '#8b5cf6', text: 'text-violet-700 dark:text-violet-300', track: 'bg-violet-100 dark:bg-violet-900/30', pill: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300' },
];

// ── stat card configs ──────────────────────────────────────────────────────────

const STAT_CARDS = (data) => [
  {
    key:          'totalAttendance',
    label:        'Total Attendance',
    value:        data?.totalAttendance ?? 0,
    icon:         <UserCheck className="h-7 w-7" />,
    baseColor:    'bg-green-50  text-green-700',
    activeColor:  'bg-green-500 text-white',
    border:       'border-green-100',
    activeBorder: 'border-green-500',
    iconBase:     'bg-green-100  text-green-600',
    iconActive:   'bg-green-400  text-white',
    shadow:       'shadow-green-200',
    blob:         'bg-green-300',
  },
  {
    key:          'presentDays',
    label:        'Present Days',
    value:        data?.attendanceChart?.present ?? 0,
    icon:         <TrendingUp className="h-7 w-7" />,
    baseColor:    'bg-blue-50  text-blue-700',
    activeColor:  'bg-blue-500 text-white',
    border:       'border-blue-100',
    activeBorder: 'border-blue-500',
    iconBase:     'bg-blue-100  text-blue-600',
    iconActive:   'bg-blue-400  text-white',
    shadow:       'shadow-blue-200',
    blob:         'bg-blue-300',
  },
  {
    key:          'absentDays',
    label:        'Absent Days',
    value:        data?.attendanceChart?.absent ?? 0,
    icon:         <UserX className="h-7 w-7" />,
    baseColor:    'bg-yellow-50  text-yellow-700',
    activeColor:  'bg-yellow-500 text-white',
    border:       'border-yellow-100',
    activeBorder: 'border-yellow-500',
    iconBase:     'bg-yellow-100  text-yellow-600',
    iconActive:   'bg-yellow-400  text-white',
    shadow:       'shadow-yellow-200',
    blob:         'bg-yellow-300',
  },
  {
    key:          'pendingCorrections',
    label:        'Pending Corrections',
    value:        data?.pendingCorrections ?? 0,
    icon:         <AlertCircle className="h-7 w-7" />,
    baseColor:    'bg-red-50  text-red-700',
    activeColor:  'bg-red-500 text-white',
    border:       'border-red-100',
    activeBorder: 'border-red-500',
    iconBase:     'bg-red-100  text-red-500',
    iconActive:   'bg-red-400  text-white',
    shadow:       'shadow-red-200',
    blob:         'bg-red-300',
  },
];

// ── helpers ────────────────────────────────────────────────────────────────────

function buildDailyData(days, month, year) {
  const today       = new Date();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dayMap      = {};
  (days ?? []).forEach(d => { dayMap[d.day] = d; });
  const result = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    if (date > today) break;
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const apiDay    = dayMap[d];
    result.push({
      day: d,
      label:       date.toLocaleDateString('en-US', { weekday: 'short' }),
      status:      isWeekend ? 'weekend' : (apiDay?.status ?? 'absent'),
      checkIn:     apiDay?.checkIn    ?? null,
      checkOut:    apiDay?.checkOut   ?? null,
      hoursWorked: apiDay?.hoursWorked ?? 0,
      value: 1,
    });
  }
  return result;
}

// ── tooltips ───────────────────────────────────────────────────────────────────

const DayTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d    = payload[0]?.payload;
  const meta = STATUS_META[d?.status] ?? STATUS_META.absent;
  return (
    <div style={{ background:'#fff', border:'1px solid #f1f5f9', borderRadius:12, padding:'12px 16px', boxShadow:'0 8px 24px rgba(0,0,0,0.10)', minWidth:150 }}>
      <p style={{ margin:0, fontWeight:700, color:'#1e293b', fontSize:13 }}>
        {d?.label}, {d?.day} <span style={{ fontWeight:400, color:'#94a3b8' }}>{MONTHS[new Date().getMonth()]}</span>
      </p>
      <p style={{ margin:'4px 0 0', fontWeight:600, color:meta.color, fontSize:13 }}>{meta.label}</p>
      {d?.checkIn && <p style={{ margin:'4px 0 0', fontSize:11, color:'#64748b' }}>🕐 {d.checkIn} → {d.checkOut ?? '—'}</p>}
      {d?.hoursWorked > 0 && <p style={{ margin:'2px 0 0', fontSize:11, color:'#94a3b8' }}>{d.hoursWorked.toFixed(1)}h worked</p>}
    </div>
  );
};

const SummaryTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const name = payload[0]?.payload?.name;
  const val  = payload[0]?.value ?? 0;
  const bar  = CHART_BARS.find(b => b.label === name);
  return (
    <div style={{ background:'#fff', border:'1px solid #f1f5f9', borderRadius:12, padding:'10px 16px', boxShadow:'0 8px 24px rgba(0,0,0,0.10)' }}>
      <p style={{ margin:0, fontWeight:700, color:'#1e293b', fontSize:13 }}>{name}</p>
      <p style={{ margin:'4px 0 0', fontWeight:700, color:bar?.color, fontSize:20 }}>
        {val}<span style={{ fontSize:12, fontWeight:400, color:'#94a3b8', marginLeft:4 }}>days</span>
      </p>
    </div>
  );
};

// ── StatCard ───────────────────────────────────────────────────────────────────

const StatCard = ({ card, isHovered, onMouseEnter, onMouseLeave }) => (
  <div
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    className={`
      relative rounded-2xl p-5 border cursor-pointer overflow-hidden
      flex items-center gap-4 select-none
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
    <div className={`p-3 rounded-2xl shrink-0 transition-all duration-300 ${isHovered ? card.iconActive : card.iconBase}`}>
      {card.icon}
    </div>
    <div className="relative z-10 min-w-0">
      <div className={`font-bold leading-none transition-all duration-300 ${isHovered ? 'text-4xl' : 'text-3xl'}`}>
        {card.value}
      </div>
      <div className={`text-xs mt-1.5 font-semibold leading-tight transition-all duration-200 ${isHovered ? 'opacity-95' : 'opacity-60'}`}>
        {card.label}
      </div>
    </div>
    <div className={`
      absolute -right-6 -bottom-6 rounded-full pointer-events-none transition-all duration-300
      ${isHovered ? 'w-28 h-28 opacity-25 bg-white' : `w-20 h-20 opacity-15 ${card.blob}`}
    `} />
  </div>
);

// ── main ───────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [employeeData,  setEmployeeData]  = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [hoveredCard,   setHoveredCard]   = useState(null);

  const [monthData,    setMonthData]    = useState(null);
  const [monthLoading, setMonthLoading] = useState(false);
  const [monthCache,   setMonthCache]   = useState({});
  const [activeBar,    setActiveBar]    = useState(null);
  const [chartMode,    setChartMode]    = useState('summary');

  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1);
  const [viewYear,  setViewYear]  = useState(today.getFullYear());

  useEffect(() => {
    getEmployeeDashboard()
      .then(res => {
        setEmployeeData(res.data);
        const { attendanceChart } = res.data;
        const key  = `${today.getFullYear()}-${today.getMonth() + 1}`;
        const seed = { present: attendanceChart?.present ?? 0, absent: attendanceChart?.absent ?? 0, leave: attendanceChart?.leave ?? 0, days: [] };
        setMonthCache(prev => ({ ...prev, [key]: seed }));
        setMonthData(seed);
      })
      .catch(err => console.error('Dashboard error:', err))
      .finally(() => setLoading(false));
  }, []);

  const fetchMonth = useCallback(async (month, year) => {
    const key = `${year}-${month}`;
    if (monthCache[key]) { setMonthData(monthCache[key]); return; }
    setMonthLoading(true);
    try {
      const res = await getMonthlyAttendance(month, year);
      setMonthCache(prev => ({ ...prev, [key]: res.data }));
      setMonthData(res.data);
    } catch {
      setMonthData({ present: 0, absent: 0, leave: 0, days: [] });
    } finally {
      setMonthLoading(false);
    }
  }, [monthCache]);

  useEffect(() => {
    if (!employeeData) return;
    fetchMonth(viewMonth, viewYear);
  }, [viewMonth, viewYear, employeeData]);

  const isCurrentMonth = viewMonth === today.getMonth() + 1 && viewYear === today.getFullYear();

  const goBack = () => {
    setActiveBar(null);
    if (viewMonth === 1) { setViewYear(y => y - 1); setViewMonth(12); }
    else { setViewMonth(m => m - 1); }
  };
  const goForward = () => {
    if (isCurrentMonth) return;
    setActiveBar(null);
    if (viewMonth === 12) { setViewYear(y => y + 1); setViewMonth(1); }
    else { setViewMonth(m => m + 1); }
  };

  const present = monthData?.present ?? 0;
  const absent  = monthData?.absent  ?? 0;
  const leave   = monthData?.leave   ?? 0;
  const total   = present + absent + leave || 1;

  const summaryChartData = [
    { name: 'Present', value: present },
    { name: 'Absent',  value: absent  },
    { name: 'Leave',   value: leave   },
  ];

  const dailyData = buildDailyData(monthData?.days ?? [], viewMonth - 1, viewYear);

  if (loading)       return <div className="p-6 text-gray-500 dark:text-gray-400">Loading...</div>;
  if (!employeeData) return <div className="p-6 text-red-500">Failed to load dashboard.</div>;

  const { employeeName = '', employeeEmail = '', upcomingLeaves = [] } = employeeData;
  const cards = STAT_CARDS(employeeData);

  const monogram = employeeName
    .split(' ').filter(Boolean)
    .map(n => n[0].toUpperCase())
    .slice(0, 2).join('');

  const dateStr = today.toLocaleDateString('en-US', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="space-y-6">

      {/* ══════════════════════════════════════
          Welcome Banner — Neat & Classic
      ══════════════════════════════════════ */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">

        {/* Main content */}
        <div className="flex items-center justify-between gap-6 px-8 py-6 flex-wrap">

          {/* ── Left: Avatar + Identity ── */}
          <div className="flex items-center gap-5">

            {/* Avatar */}
            <div className="relative shrink-0">
              <div
                className="w-[52px] h-[52px] rounded-full flex items-center justify-center text-base font-bold select-none"
                style={{ background: '#f1f5f9', color: '#475569', letterSpacing: '0.05em' }}
              >
                {monogram}
              </div>
              {/* Presence dot */}
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white dark:border-gray-800" />
            </div>

            {/* Divider */}
            <div className="w-px h-11 bg-gray-100 dark:bg-gray-700 shrink-0" />

            {/* Text */}
            <div>
              <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">
                Welcome back
              </p>
              <p className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                {employeeName}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {employeeEmail}
              </p>
            </div>
          </div>

          {/* ── Right: Date + Stats ── */}
          <div className="flex items-center gap-6 shrink-0 flex-wrap">

            {/* Stat group */}
            <div className="flex items-center gap-4">
              {[
                { label: 'Present', value: present, color: '#22c55e', bg: '#f0fdf4', fg: '#15803d' },
                { label: 'Absent',  value: absent,  color: '#ef4444', bg: '#fef2f2', fg: '#b91c1c' },
                { label: 'Leave',   value: leave,   color: '#8b5cf6', bg: '#f5f3ff', fg: '#6d28d9' },
              ].map(({ label, value, bg, fg }) => (
                <div key={label} className="text-center">
                  <p
                    className="text-2xl font-bold leading-none"
                    style={{ color: fg }}
                  >
                    {value}
                  </p>
                  <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-wide">
                    {label}
                  </p>
                </div>
              ))}
            </div>

            {/* Vertical rule */}
            <div className="w-px h-11 bg-gray-100 dark:bg-gray-700 shrink-0" />

            {/* Date */}
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 leading-tight">
                {today.toLocaleDateString('en-US', { weekday: 'long' })}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {today.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        {/* Footer rule */}
        <div className="px-8 py-2.5 bg-gray-50 dark:bg-gray-800/60 border-t border-gray-100 dark:border-gray-700 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Attendance summary for&nbsp;
            <span className="font-semibold text-gray-500 dark:text-gray-400">
              {MONTHS[today.getMonth()]} {today.getFullYear()}
            </span>
          </p>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <StatCard
            key={card.key}
            card={card}
            isHovered={hoveredCard === i}
            onMouseEnter={() => setHoveredCard(i)}
            onMouseLeave={() => setHoveredCard(null)}
          />
        ))}
      </div>

      {/* ── Chart card ── */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Attendance Overview</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5 text-xs font-semibold">
              {['summary', 'daily'].map(mode => (
                <button
                  key={mode}
                  onClick={() => setChartMode(mode)}
                  className={`px-3 py-1.5 rounded-md capitalize transition-all ${
                    chartMode === mode
                      ? 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >{mode}</button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <button onClick={goBack} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <ChevronLeft className="w-4 h-4 text-gray-500" />
              </button>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 min-w-[130px] text-center">
                {MONTHS[viewMonth - 1]} {viewYear}
              </span>
              <button
                onClick={goForward}
                disabled={isCurrentMonth}
                className={`p-1.5 rounded-lg transition-colors ${isCurrentMonth ? 'opacity-25 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              >
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-5">
          {CHART_BARS.map(({ key, label, pill }) => (
            <span key={key} className={`text-xs font-semibold px-3 py-1.5 rounded-full ${pill}`}>
              {label}: {monthData?.[key] ?? 0}
            </span>
          ))}
          {monthData?.workingHours > 0 && (
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center gap-1">
              <Clock className="w-3 h-3" />{monthData.workingHours.toFixed(1)}h worked
            </span>
          )}
        </div>

        <div className="space-y-2.5 mb-6">
          {CHART_BARS.map(({ key, label, color, text, track }) => {
            const value = monthData?.[key] ?? 0;
            const pct   = Math.round((value / total) * 100);
            return (
              <div key={key} className="flex items-center gap-3">
                <span className={`text-xs font-semibold w-14 shrink-0 ${text}`}>{label}</span>
                <div className={`flex-1 h-2 rounded-full ${track} overflow-hidden`}>
                  <div className="h-full rounded-full transition-all duration-700" style={{ width:`${pct}%`, background:color }} />
                </div>
                <span className={`text-xs font-bold w-16 text-right shrink-0 ${text}`}>{value}d · {pct}%</span>
              </div>
            );
          })}
        </div>

        <div className="relative" style={{ height: 220 }}>
          {monthLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 dark:bg-gray-800/80 rounded-lg">
              <span className="text-sm text-gray-400 animate-pulse">Loading…</span>
            </div>
          )}
          {chartMode === 'summary' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summaryChartData} barSize={64} margin={{ top:8, right:16, left:-20, bottom:0 }} onMouseLeave={() => setActiveBar(null)}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill:'#64748b', fontSize:13, fontWeight:600 }} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill:'#94a3b8', fontSize:11 }} />
                <Tooltip content={<SummaryTooltip />} cursor={{ fill:'rgba(99,102,241,0.04)', radius:6 }} />
                <Bar dataKey="value" radius={[8,8,0,0]} onMouseEnter={(_,i) => setActiveBar(i)}>
                  {summaryChartData.map((_,i) => (
                    <Cell key={i} fill={CHART_BARS[i].color} opacity={activeBar === null || activeBar === i ? 1 : 0.35} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
          {chartMode === 'daily' && (
            dailyData.length === 0
              ? <div className="flex items-center justify-center h-full text-sm text-gray-400">No attendance data for this month.</div>
              : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyData} barSize={14} margin={{ top:8, right:8, left:-30, bottom:0 }} onMouseLeave={() => setActiveBar(null)}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill:'#94a3b8', fontSize:10 }} tickFormatter={v => v % 2 === 1 ? v : ''} />
                    <YAxis hide domain={[0,1.2]} />
                    <Tooltip content={<DayTooltip />} cursor={{ fill:'rgba(99,102,241,0.04)', radius:4 }} />
                    <Bar dataKey="value" radius={[4,4,0,0]} onMouseEnter={(_,i) => setActiveBar(i)}>
                      {dailyData.map((entry, i) => (
                        <Cell key={i} fill={STATUS_META[entry.status]?.color ?? '#6366f1'} opacity={activeBar === null || activeBar === i ? 1 : 0.35} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )
          )}
        </div>

        <div className="flex justify-center gap-5 mt-3">
          {Object.entries(STATUS_META).map(([key, { label, color }]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background:color, display:'inline-block' }} />
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Upcoming Leaves ── */}
      {upcomingLeaves.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Upcoming Leaves</h2>
          <div className="space-y-3">
            {upcomingLeaves.map((lv, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm mt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-violet-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{lv.reason || 'Leave'}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(lv.startDate).toLocaleDateString('en-US', { day:'numeric', month:'short', year:'numeric' })}
                      {' → '}
                      {new Date(lv.endDate).toLocaleDateString('en-US', { day:'numeric', month:'short', year:'numeric' })}
                    </p>
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 ${
                  lv.status
                    ? 'bg-white dark:bg-gray-800 text-violet-600 dark:text-violet-300 border-violet-200 dark:border-violet-700'
                    : 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700'
                }`}>
                  {lv.status ?? 'Pending'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}