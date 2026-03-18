import React, { useRef, useEffect } from 'react';
import { Settings, LogOut, Mail } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const ProfilePopup = ({ isOpen, onClose, settingsPath }) => {
    const popupRef = useRef(null);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popupRef.current && !popupRef.current.contains(event.target)) onClose();
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    const handleLogout = () => { logout(); navigate('/login'); };
    const handleSettings = () => { navigate(settingsPath || '/admin/settings'); onClose(); };

    if (!isOpen) return null;

    return (
        <div ref={popupRef} className="absolute right-0 top-12 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
            
            {/* Profile Header */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-lg shrink-0">
                        {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold text-gray-800 dark:text-white truncate">{user?.name || 'User'}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role || 'Role'}</p>
                        {user?.email && (
                            <div className="flex items-center gap-1 mt-0.5">
                                <Mail className="h-3 w-3 text-gray-400 dark:text-gray-500 shrink-0" />
                                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{user.email}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Settings */}
            <div className="p-2">
                <button onClick={handleSettings} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-3">
                    <Settings className="h-4 w-4 text-gray-500 dark:text-gray-400" />Settings
                </button>
            </div>

            {/* Logout */}
            <div className="p-2 border-t border-gray-100 dark:border-gray-700">
                <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-3">
                    <LogOut className="h-4 w-4" />Logout
                </button>
            </div>
        </div>
    );
};

export default ProfilePopup;