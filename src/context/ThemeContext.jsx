import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({
  isDark: true,
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('chat_app_theme');
    if (saved !== null) {
      return saved === 'dark';
    }
    return true; // Default to sleek black theme
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('chat_app_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('chat_app_theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
