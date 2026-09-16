import React from 'react';

export const Card = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`bg-white dark:bg-[#111114] border border-gray-200 dark:border-zinc-800/80 rounded-2xl shadow-xs transition-colors ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
