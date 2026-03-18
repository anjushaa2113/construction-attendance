import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, Calendar, Clock, LogOut } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import { useLanguage } from '../../context/LanguageContext';

const EmployeeSidebar = () => {
    const { logout } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { path: '/employee/dashboard', label: t.dashboard, icon: <LayoutDashboard className="h-5 w-5" /> },
        { path: '/employee/leave-request', label: t.leaveRequest, icon: <Calendar className="h-5 w-5" /> },
        { path: '/employee/attendance-correction', label: t.attendanceCorrection, icon: <Clock className="h-5 w-5" /> },
        { path: '/employee/reports', label: t.reports, icon: <FileText className="h-5 w-5" /> },
    ];

    return (
        <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full shadow-lg z-10 transition-all duration-300">

            {/* ❌ "Employee Portal" title block removed */}

            <nav className="flex-1 overflow-y-auto py-4">
                <ul className="space-y-1 px-2">
                    {navItems.map((item) => (
                        <li key={item.path}>
                            <NavLink
                                to={item.path}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                                        isActive
                                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium shadow-sm'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                                    }`
                                }
                            >
                                {item.icon}
                                <span>{item.label}</span>
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                    <LogOut className="h-4 w-4" />
                    <span>{t.logout}</span>
                </button>
            </div>
        </aside>
    );
};

export default EmployeeSidebar;