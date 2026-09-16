import React from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';

export const ChatArea = ({
  messages,
  loading,
  connectionStatus,
  currentUserId,
  typingText,
  onSendMessage,
  onTyping,
}) => {
  return (
    <main className="flex-1 flex flex-col h-[calc(100dvh-3.5rem)] sm:h-[calc(100dvh-4rem)] max-w-5xl mx-auto w-full bg-white dark:bg-[#09090b] sm:border-x border-gray-200 dark:border-zinc-800/80 shadow-xs transition-colors overflow-hidden">
      {/* Messages Thread */}
      <MessageList
        messages={messages}
        currentUserId={currentUserId}
        loading={loading}
        connectionStatus={connectionStatus}
      />

      {/* Ephemeral Realtime Typing Indicator */}
      <TypingIndicator typingText={typingText} />

      {/* Sticky Bottom Message Input */}
      <MessageInput
        onSendMessage={onSendMessage}
        onTyping={onTyping}
        disabled={loading || connectionStatus === 'disconnected'}
      />
    </main>
  );
};
