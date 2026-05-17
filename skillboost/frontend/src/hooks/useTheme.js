import { useState, useEffect } from 'react';

export function useTheme() {
    const [theme, setTheme] = useState(() => localStorage.getItem('skillboost-theme') || 'light');

    useEffect(() => {
        document.documentElement.dataset.theme = theme;
        localStorage.setItem('skillboost-theme', theme);
    }, [theme]);

    const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

    return { theme, toggleTheme };
}