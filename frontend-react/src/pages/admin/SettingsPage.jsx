import { useState, useEffect } from 'react';
import { Sun, Moon, Lock, Globe, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { useLanguage } from '../../context/LanguageContext';
import apiClient from '../../services/apiClient';

const SectionCard = ({ title, icon, children }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <span className="text-blue-600 dark:text-blue-400">{icon}</span>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">{title}</h2>
        </div>
        <div className="p-6">{children}</div>
    </div>
);

const inputClass = "w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-gray-400 dark:placeholder-gray-500";

const AdminSettingsPage = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const { language, setLanguage, t } = useLanguage();

    // Theme
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
    useEffect(() => {
        theme === 'dark'
            ? document.documentElement.classList.add('dark')
            : document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', theme);
    }, [theme]);

    // Password
    const [passwordData, setPasswordData] = useState({
        currentPassword: '', newPassword: '', confirmPassword: '',
    });
    const [showPasswords,   setShowPasswords]   = useState({ current: false, new: false, confirm: false });
    const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
    const [passwordLoading, setPasswordLoading] = useState(false);

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordMessage({ type: 'error', text: t.passwordMismatch }); return;
        }
        if (passwordData.newPassword.length < 6) {
            setPasswordMessage({ type: 'error', text: t.passwordTooShort }); return;
        }
        setPasswordLoading(true);
        setPasswordMessage({ type: '', text: '' });
        try {
            const res = await apiClient.post('/Auth/change-password', {
                currentPassword: passwordData.currentPassword,
                newPassword:     passwordData.newPassword,
            });
            setPasswordMessage({ type: 'success', text: res.data?.message || t.passwordChanged });
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setTimeout(() => { logout(); navigate('/login'); }, 2000);
        } catch (err) {
            setPasswordMessage({ type: 'error', text: err.response?.data?.message || t.networkError });
        } finally {
            setPasswordLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-10">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-3">
                {t.settings}
            </h1>

            {/* ── Appearance ── */}
            <SectionCard
                title={t.appearance}
                icon={theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            >
                <div className="flex gap-4">
                    {[
                        { value: 'light', icon: <Sun className="h-4 w-4" />,  label: t.light },
                        { value: 'dark',  icon: <Moon className="h-4 w-4" />, label: t.dark  },
                    ].map(({ value, icon, label }) => (
                        <button
                            key={value}
                            onClick={() => setTheme(value)}
                            className={`flex-1 p-4 rounded-xl border-2 transition-all font-semibold text-sm flex items-center justify-center gap-2 ${
                                theme === value
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                    : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500'
                            }`}
                        >
                            {icon}{label}
                            {theme === value && <Check className="h-4 w-4 ml-auto" />}
                        </button>
                    ))}
                </div>
            </SectionCard>

            {/* ── Language ── */}
            <SectionCard title={t.language} icon={<Globe className="h-5 w-5" />}>
                <select value={language} onChange={e => setLanguage(e.target.value)} className={inputClass}>
                    <option value="en">English</option>
                    <option value="ta">Tamil</option>
                    <option value="hi">Hindi</option>
                </select>
            </SectionCard>

            {/* ── Change Password ── */}
            <SectionCard title={t.changePassword} icon={<Lock className="h-5 w-5" />}>
                {passwordMessage.text && (
                    <div className={`mb-5 p-3.5 rounded-lg text-sm flex items-center gap-2 ${
                        passwordMessage.type === 'success'
                            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
                            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
                    }`}>
                        {passwordMessage.type === 'success'
                            ? <Check className="h-4 w-4 shrink-0" />
                            : <AlertCircle className="h-4 w-4 shrink-0" />
                        }
                        {passwordMessage.text}
                    </div>
                )}
                <form onSubmit={handlePasswordChange} className="space-y-4">
                    {[
                        { key: 'current', field: 'currentPassword', label: t.currentPassword },
                        { key: 'new',     field: 'newPassword',     label: t.newPassword     },
                        { key: 'confirm', field: 'confirmPassword', label: t.confirmPassword  },
                    ].map(({ key, field, label }) => (
                        <div key={field}>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                {label}
                            </label>
                            <div className="relative">
                                <input
                                    type={showPasswords[key] ? 'text' : 'password'}
                                    value={passwordData[field]}
                                    onChange={e => setPasswordData(prev => ({ ...prev, [field]: e.target.value }))}
                                    className={`${inputClass} pr-10`}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPasswords(prev => ({ ...prev, [key]: !prev[key] }))}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                >
                                    {showPasswords[key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                    ))}
                    <button
                        type="submit"
                        disabled={passwordLoading}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                    >
                        {passwordLoading ? (
                            <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />{t.updating}</>
                        ) : (
                            <><Lock className="h-4 w-4" />{t.updatePasswordBtn}</>
                        )}
                    </button>
                </form>
            </SectionCard>
        </div>
    );
};

export default AdminSettingsPage;