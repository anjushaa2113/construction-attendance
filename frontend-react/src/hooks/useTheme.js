import { useState, useEffect } from 'react';

const useTheme = () => {
    // Restoring useState to maintain consistent hook order and prevent React errors
    const [theme, setTheme] = useState(() => {
        // Always return 'light', but check localStorage just in case to be consistent
        return 'light';
    });

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    }, []);

    const toggleTheme = () => {
        // No-op
    };

    return { theme, toggleTheme };
};

export default useTheme;
