import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, UserCheck, CalendarCheck, FileBarChart, ShieldCheck, Settings } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const AdminSidebar = () => {
    const { t } = useLanguage();

    const navItems = [
        { path: '/admin/dashboard',  label: t.dashboard          || 'Dashboard',           icon: <LayoutDashboard className="h-5 w-5" /> },
        { path: '/admin/staff',      label: t.staffDirectory     || 'Staff Directory',      icon: <Users className="h-5 w-5" /> },
        { path: '/admin/leaves',     label: t.leaveApproval      || 'Leave Approval',       icon: <UserCheck className="h-5 w-5" /> },
        { path: '/admin/attendance', label: t.attendanceApproval || 'Attendance Approval',  icon: <CalendarCheck className="h-5 w-5" /> },
        { path: '/admin/reports',    label: t.reports            || 'Reports',              icon: <FileBarChart className="h-5 w-5" /> },
        { path: '/admin/audit-logs', label: t.auditLogs          || 'Audit Logs',           icon: <ShieldCheck className="h-5 w-5" /> },
    ];

    const navClass = ({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 rounded-xl group ${
            isActive
                ? 'bg-accent-600 text-white shadow-md shadow-accent-100 translate-x-1'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
        }`;

    return (
        <aside className="w-64 glass border-r border-slate-200/50 flex flex-col h-full shrink-0 z-30 transition-all duration-300">

            <nav className="flex-1 py-4 flex flex-col gap-1 px-4">
                {navItems.map((item) => (
                    <NavLink key={item.path} to={item.path} className={navClass}>
                        <div className="transition-transform group-hover:scale-110">{item.icon}</div>
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-slate-200/50">
                <NavLink to="/admin/settings" className={navClass}>
                    <div className="transition-transform group-hover:scale-110">
                        <Settings className="h-5 w-5" />
                    </div>
                    <span>{t.settings || 'Settings'}</span>
                </NavLink>
            </div>

        </aside>
    );
};

export default AdminSidebar;