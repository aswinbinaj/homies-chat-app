import React from 'react';

export const TypingIndicator = ({ typingText }) => {
  if (!typingText) return null;

  return (
    <div className="flex items-center gap-2 px-3 sm:px-6 py-1.5 text-xs text-gray-500 dark:text-zinc-400 animate-in fade-in duration-150 select-none">
      <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-[#141417] px-3 py-1 rounded-full border border-gray-200 dark:border-[#27272a] shadow-xs">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.3s]" />
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.15s]" />
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" />
        <span className="ml-1 text-[11px] font-medium text-gray-700 dark:text-zinc-300">{typingText}</span>
      </div>
    </div>
  );
};
