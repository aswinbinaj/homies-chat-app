import React from 'react';
import { ShieldAlert, EyeOff } from 'lucide-react';

export const PrivacyShieldOverlay = ({ isWindowBlurred, screenshotAttempted }) => {
  if (screenshotAttempted) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 text-white p-6 text-center animate-in fade-in duration-150 backdrop-blur-xl">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mb-4 animate-bounce">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold tracking-tight mb-2 text-rose-300">
          Screenshots Restricted
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-sm leading-relaxed">
          Screen captures, printing, and saving are restricted in this private group chat to protect friend privacy.
        </p>
      </div>
    );
  }

  if (isWindowBlurred) {
    return (
      <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-[#09090b]/90 backdrop-blur-2xl text-zinc-300 p-6 text-center animate-in fade-in duration-200 select-none">
        <div className="w-14 h-14 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-indigo-400 mb-3 shadow-lg">
          <EyeOff className="w-7 h-7" />
        </div>
        <h3 className="text-base font-semibold text-zinc-100 mb-1">
          Privacy Guard Active
        </h3>
        <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
          Chat content is concealed while the window is inactive to block background snipping and screen recorders. Click to resume.
        </p>
      </div>
    );
  }

  return null;
};
