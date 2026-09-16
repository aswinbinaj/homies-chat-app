import React, { useState, useRef, useEffect } from 'react';
import { Send, AlertCircle } from 'lucide-react';

export const MessageInput = ({ onSendMessage, onTyping, disabled = false }) => {
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  const handleChange = (e) => {
    const val = e.target.value;
    if (val.length <= 1000) {
      setText(val);
      setError('');
      if (onTyping) {
        onTyping(val.trim().length > 0);
      }
    } else {
      setError('Message cannot exceed 1,000 characters.');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (trimmed.length > 1000) {
      setError('Message cannot exceed 1,000 characters.');
      return;
    }

    if (onTyping) {
      onTyping(false);
    }

    const success = await onSendMessage(trimmed);
    if (success) {
      setText('');
      setError('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.focus();
      }
    }
  };

  const charCount = text.length;
  const isOverLimit = charCount > 1000;
  const isNearLimit = charCount > 900;

  return (
    <div className="p-2.5 sm:p-4 bg-white/95 dark:bg-[#0c0c0e]/95 backdrop-blur-md border-t border-gray-200 dark:border-zinc-800/80 transition-colors shrink-0 pb-safe">
      <div className="max-w-4xl mx-auto">
        {error && (
          <div className="flex items-center gap-1.5 text-xs text-rose-500 font-medium mb-1.5 px-1 animate-in fade-in">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="relative flex items-end gap-2 bg-gray-50 dark:bg-[#141417] rounded-2xl border border-gray-200 dark:border-[#27272a] focus-within:border-indigo-500 dark:focus-within:border-indigo-500/80 focus-within:ring-2 focus-within:ring-indigo-500/20 px-3 py-1.5 sm:py-2 transition-all shadow-xs">
          {/* Text Area: Note text-[16px] on mobile to prevent iOS Safari auto-zoom */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="Type a message... (1 hour lifespan)"
            className="w-full resize-none max-h-28 bg-transparent text-[16px] sm:text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none py-1.5 leading-relaxed"
          />

          <div className="flex items-center gap-2 shrink-0 pb-0.5">
            {/* Character counter */}
            {charCount > 0 && (
              <span
                className={`text-[10px] sm:text-[11px] font-mono select-none ${
                  isOverLimit
                    ? 'text-rose-500 font-bold'
                    : isNearLimit
                    ? 'text-amber-500'
                    : 'text-gray-400 dark:text-zinc-500'
                }`}
              >
                {charCount}/1000
              </span>
            )}

            {/* Send Button */}
            <button
              type="button"
              onClick={handleSend}
              disabled={disabled || !text.trim() || isOverLimit}
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:hover:bg-indigo-600 text-white shadow-md shadow-indigo-600/30 transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed shrink-0"
              title="Send message"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
