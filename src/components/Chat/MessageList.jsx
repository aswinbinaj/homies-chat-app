import React, { useEffect, useRef } from 'react';
import { MessageItem } from './MessageItem';
import { formatDayDivider } from '../../utils/formatters';
import { MessageSquare, WifiOff, Loader2 } from 'lucide-react';

export const MessageList = ({
  messages = [],
  currentUserId,
  loading = false,
  connectionStatus = 'connected',
}) => {
  const bottomRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-gray-400 dark:text-zinc-500">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
        <p className="text-xs sm:text-sm font-medium">Loading chat history...</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-2.5 py-3 sm:px-6 space-y-0.5 transition-colors"
    >
      {/* Reconnection alert banner */}
      {connectionStatus === 'reconnecting' && (
        <div className="sticky top-2 z-20 flex items-center justify-center gap-2 py-1.5 px-3.5 rounded-full bg-amber-500/10 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 text-xs font-medium border border-amber-500/20 shadow-sm animate-pulse max-w-xs mx-auto backdrop-blur-md">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Reconnecting to chat...</span>
        </div>
      )}

      {/* Empty State */}
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-center p-6 sm:p-8 max-w-sm mx-auto my-auto min-h-[320px]">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/50 dark:border-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4 shadow-sm shadow-indigo-500/10">
            <MessageSquare className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-zinc-100 mb-1 tracking-tight">
            HomiesOnly Chat
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 leading-relaxed max-w-xs">
            Say hello to the homies! All messages automatically vanish exactly 1 hour after they are sent.
          </p>
        </div>
      ) : (
        <>
          {messages.map((message, index) => {
            const isOwn = message.user_id === currentUserId;
            const prevMessage = messages[index - 1];

            const showDateDivider =
              !prevMessage ||
              formatDayDivider(prevMessage.created_at) !==
                formatDayDivider(message.created_at);

            return (
              <React.Fragment key={message.id}>
                {showDateDivider && (
                  <div className="flex items-center justify-center my-4 select-none">
                    <span className="px-3 py-1 rounded-full text-[10px] font-semibold text-gray-500 dark:text-zinc-400 bg-gray-100 dark:bg-zinc-800/80 border border-gray-200/60 dark:border-zinc-700/50 uppercase tracking-wider shadow-2xs">
                      {formatDayDivider(message.created_at)}
                    </span>
                  </div>
                )}
                <MessageItem message={message} isOwnMessage={isOwn} />
              </React.Fragment>
            );
          })}
          <div ref={bottomRef} className="h-1" />
        </>
      )}
    </div>
  );
};
