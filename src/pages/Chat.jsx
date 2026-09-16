import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useMessages } from '../hooks/useMessages';
import { usePresence } from '../hooks/usePresence';
import { useTyping } from '../hooks/useTyping';
import { usePrivacyProtection } from '../hooks/usePrivacyProtection';
import { Navbar } from '../components/Layout/Navbar';
import { Sidebar } from '../components/Layout/Sidebar';
import { ChatArea } from '../components/Chat/ChatArea';
import { PrivacyShieldOverlay } from '../components/Chat/PrivacyShieldOverlay';

export const Chat = () => {
  const { user, profile } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Privacy and anti-screenshot guard is permanently enabled
  const { isWindowBlurred, screenshotAttempted } = usePrivacyProtection(true);

  // Custom Hooks
  const {
    messages,
    loading: messagesLoading,
    connectionStatus,
    sendMessage,
  } = useMessages(user);

  const { onlineUsers, allMembers } = usePresence(user, profile);
  const { typingText, broadcastTyping } = useTyping(user, profile);

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden bg-gray-100 dark:bg-[#09090b] transition-colors relative select-none">
      {/* Privacy Guard Anti-Screenshot & Blur Overlay */}
      <PrivacyShieldOverlay
        isWindowBlurred={isWindowBlurred}
        screenshotAttempted={screenshotAttempted}
      />

      {/* Top Navbar */}
      <Navbar
        onlineCount={onlineUsers.length}
        onToggleMembers={() => setIsSidebarOpen(true)}
      />

      {/* Main Chat Interface */}
      <ChatArea
        messages={messages}
        loading={messagesLoading}
        connectionStatus={connectionStatus}
        currentUserId={user?.id}
        typingText={typingText}
        onSendMessage={sendMessage}
        onTyping={broadcastTyping}
      />

      {/* Online & Offline Members Slide-over Drawer */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        allMembers={allMembers}
        onlineUsers={onlineUsers}
        currentUserId={user?.id}
      />
    </div>
  );
};
