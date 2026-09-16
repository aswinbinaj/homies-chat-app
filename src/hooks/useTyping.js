import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const useTyping = (currentUser, currentProfile) => {
  const [typingUsers, setTypingUsers] = useState([]);
  const channelRef = useRef(null);
  const typingTimeouts = useRef(new Map());
  const selfTypingTimeout = useRef(null);

  useEffect(() => {
    if (!isSupabaseConfigured || !currentUser) return;

    const channel = supabase.channel('private-chat-typing');
    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { user_id, username, isTyping } = payload.payload;

        // Ignore self events
        if (user_id === currentUser.id) return;

        if (isTyping) {
          // Clear any existing reset timer for this user
          if (typingTimeouts.current.has(user_id)) {
            clearTimeout(typingTimeouts.current.get(user_id));
          }

          // Add to typing list if not already present
          setTypingUsers((prev) => {
            if (prev.some((u) => u.user_id === user_id)) return prev;
            return [...prev, { user_id, username }];
          });

          // Auto-remove after 2.5s timeout if no new event
          const timer = setTimeout(() => {
            setTypingUsers((prev) => prev.filter((u) => u.user_id !== user_id));
            typingTimeouts.current.delete(user_id);
          }, 2500);

          typingTimeouts.current.set(user_id, timer);
        } else {
          // Explicitly stopped typing
          if (typingTimeouts.current.has(user_id)) {
            clearTimeout(typingTimeouts.current.get(user_id));
            typingTimeouts.current.delete(user_id);
          }
          setTypingUsers((prev) => prev.filter((u) => u.user_id !== user_id));
        }
      })
      .subscribe();

    return () => {
      // Clear all timers
      typingTimeouts.current.forEach((timer) => clearTimeout(timer));
      typingTimeouts.current.clear();
      if (selfTypingTimeout.current) clearTimeout(selfTypingTimeout.current);
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  // Broadcast current user's typing state
  const broadcastTyping = useCallback(
    (isTyping) => {
      if (!channelRef.current || !currentUser || !currentProfile) return;

      channelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          user_id: currentUser.id,
          username: currentProfile.username || currentUser.email?.split('@')[0],
          isTyping,
        },
      });

      // If typing is true, set a self-timeout to automatically broadcast stopped typing
      if (selfTypingTimeout.current) {
        clearTimeout(selfTypingTimeout.current);
      }

      if (isTyping) {
        selfTypingTimeout.current = setTimeout(() => {
          broadcastTyping(false);
        }, 2200);
      }
    },
    [currentUser, currentProfile]
  );

  // Helper string generator for typing label
  const getTypingText = () => {
    if (typingUsers.length === 0) return null;
    if (typingUsers.length === 1) {
      return `${typingUsers[0].username} is typing...`;
    }
    if (typingUsers.length === 2) {
      return `${typingUsers[0].username} and ${typingUsers[1].username} are typing...`;
    }
    return `${typingUsers[0].username}, ${typingUsers[1].username} and ${typingUsers.length - 2} other${typingUsers.length > 3 ? 's' : ''} are typing...`;
  };

  return {
    typingUsers,
    typingText: getTypingText(),
    broadcastTyping,
  };
};
