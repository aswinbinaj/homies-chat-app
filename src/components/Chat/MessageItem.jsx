import React, { useState, useEffect } from 'react';
import { formatMessageTime, formatTimeRemaining } from '../../utils/formatters';
import { getInitials, getAvatarColor } from '../../utils/helpers';
import { Clock } from 'lucide-react';

export const MessageItem = ({ message, isOwnMessage }) => {
  const [timeLeft, setTimeLeft] = useState(() => formatTimeRemaining(message.expires_at));

  useEffect(() => {
    const updateCountdown = () => {
      setTimeLeft(formatTimeRemaining(message.expires_at));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 15000);
    return () => clearInterval(interval);
  }, [message.expires_at]);

  const senderName = isOwnMessage
    ? 'You'
    : message.profiles?.username || 'Friend';
  const avatarBg = getAvatarColor(senderName);

  return (
    <div
      className={`flex items-end gap-2 my-2 sm:my-3 transition-all duration-150 animate-in fade-in-50 slide-in-from-bottom-1.5 ${
        isOwnMessage ? 'justify-end' : 'justify-start'
      }`}
    >
      {/* Friend's Avatar */}
      {!isOwnMessage && (
        <div
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[11px] sm:text-xs font-bold shrink-0 mb-0.5 shadow-xs ring-1 ring-white/10 ${avatarBg}`}
          title={senderName}
        >
          {getInitials(senderName)}
        </div>
      )}

      {/* Bubble Container */}
      <div
        className={`max-w-[88%] sm:max-w-md md:max-w-lg px-3.5 py-2 sm:px-4 sm:py-2.5 shadow-sm transition-colors ${
          isOwnMessage
            ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-2xl rounded-br-xs'
            : 'bg-white dark:bg-[#18181b] text-gray-900 dark:text-zinc-100 border border-gray-100 dark:border-[#27272a] rounded-2xl rounded-bl-xs'
        }`}
      >
        {/* Friend's Username Header */}
        {!isOwnMessage && (
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 tracking-tight">
              {senderName}
            </span>
          </div>
        )}

        {/* Message Content: Plain Text (Guaranteed XSS Safe) */}
        <p className="text-[14px] sm:text-[15px] leading-relaxed break-words whitespace-pre-wrap select-text font-normal">
          {message.message}
        </p>

        {/* Metadata Footer: Expiration Countdown & Sent Time */}
        <div
          className={`flex items-center justify-end gap-1.5 mt-1.5 text-[10px] sm:text-[11px] select-none ${
            isOwnMessage ? 'text-indigo-200' : 'text-gray-400 dark:text-zinc-400'
          }`}
        >
          {/* Ephemeral Countdown */}
          <span
            className="inline-flex items-center gap-1 font-medium bg-black/10 dark:bg-white/5 px-1.5 py-0.5 rounded"
            title={`Expires at: ${new Date(message.expires_at).toLocaleTimeString()}`}
          >
            <Clock className="w-2.5 h-2.5 opacity-80" />
            <span>{timeLeft}</span>
          </span>

          <span className="opacity-40">•</span>

          {/* Time Sent */}
          <span className="opacity-90">{formatMessageTime(message.created_at)}</span>
        </div>
      </div>
    </div>
  );
};
