import React from 'react';
import { LoginForm } from '../components/Auth/LoginForm';
import { useTheme } from '../context/ThemeContext';
import { Moon, Sun } from 'lucide-react';

export const Login = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-3.5 sm:p-6 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-[#09090b] dark:to-[#040405] transition-colors relative">
      <div className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4">
        <button
          onClick={toggleTheme}
          className="p-2 text-gray-500 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-xl transition-colors active:scale-95"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-500" />}
        </button>
      </div>

      <LoginForm />
    </div>
  );
};
