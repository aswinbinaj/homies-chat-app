import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import {
  MessageSquare,
  Ghost,
  Users,
  Shield,
  ShieldCheck,
  ShieldOff,
  LogOut,
  Moon,
  Sun,
} from 'lucide-react';
import { getInitials, getAvatarColor } from '../../utils/helpers';

export const Navbar = ({
  onlineCount = 0,
  onToggleMembers,
}) => {
  const { user, profile, isAdmin, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const displayName = profile?.username || user?.email?.split('@')[0] || 'Friend';
  const avatarBg = getAvatarColor(displayName);

  return (
    <header className="h-14 sm:h-16 border-b border-gray-200 dark:border-zinc-800/80 bg-white/95 dark:bg-[#0c0c0e]/95 backdrop-blur-md sticky top-0 z-30 transition-colors shrink-0">
      <div className="max-w-7xl mx-auto h-full px-3 sm:px-4 flex items-center justify-between">
        {/* Logo & Title */}
        <Link to="/chat" className="flex items-center gap-2 sm:gap-2.5 group">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/25 group-hover:scale-105 transition-transform">
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-bold text-gray-900 dark:text-zinc-100 text-sm sm:text-base tracking-tight">
                HomiesOnly
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold bg-indigo-500/10 dark:bg-indigo-400/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                1h
              </span>
            </div>
            <p className="text-[10px] text-gray-500 dark:text-zinc-400 hidden sm:block">
              Vanishing friends chat
            </p>
          </div>
        </Link>

        {/* Right Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Online Members Trigger */}
          {onToggleMembers && (
            <button
              onClick={onToggleMembers}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-xl bg-gray-100 dark:bg-zinc-800/70 hover:bg-gray-200 dark:hover:bg-zinc-700/80 text-gray-700 dark:text-zinc-200 border border-transparent dark:border-zinc-700/50 transition-all active:scale-95"
              title="View members"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="hidden sm:inline">Members</span>
              <span className="font-semibold text-xs text-gray-900 dark:text-zinc-100">
                {onlineCount}
              </span>
            </button>
          )}

          {/* Permanent Privacy Guard Status Indicator & Policy Link */}
          <Link
            to="/privacy"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs select-none shadow-xs transition-colors active:scale-95"
            title="Privacy & Security Policy (Click to view full policy)"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">Protected</span>
          </Link>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="p-2 text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 hover:bg-gray-100 dark:hover:bg-zinc-800/80 rounded-xl transition-colors active:scale-95"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
          </button>

          {/* Admin Link (if Admin) */}
          {isAdmin && (
            <Link
              to="/admin"
              className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl transition-colors border border-transparent dark:border-indigo-900/40 active:scale-95"
              title="Admin Dashboard"
            >
              <Shield className="w-4 h-4" />
            </Link>
          )}

          {/* Profile link */}
          <Link
            to="/profile"
            className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800/80 transition-colors border border-transparent dark:border-zinc-800 active:scale-95"
            title="Your Profile"
          >
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ring-1 ring-white/20 shadow-xs ${avatarBg}`}>
              {getInitials(displayName)}
            </div>
            <span className="text-xs font-medium text-gray-700 dark:text-zinc-200 hidden md:block max-w-[100px] truncate">
              {displayName}
            </span>
          </Link>

          {/* Sign Out Button */}
          <button
            onClick={handleSignOut}
            className="p-2 text-gray-500 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors active:scale-95"
            title="Sign Out"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
