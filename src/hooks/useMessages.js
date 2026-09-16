import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { validateMessage } from '../utils/helpers';

export const useMessages = (currentUser) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'connecting' | 'connected' | 'reconnecting' | 'disconnected'
  const profileCache = useRef(new Map());

  // Fetch a user profile by ID to attach to realtime messages if missing
  const getSenderProfile = useCallback(async (userId) => {
    if (!userId) return null;
    if (profileCache.current.has(userId)) {
      return profileCache.current.get(userId);
    }
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .eq('id', userId)
        .single();
      if (data) {
        profileCache.current.set(userId, data);
        return data;
      }
    } catch {
      // Ignore
    }
    return { username: 'Friend', avatar_url: null };
  }, []);

  // Fetch active non-expired messages from Supabase
  const loadMessages = useCallback(async () => {
    if (!isSupabaseConfigured || !currentUser) {
      setLoading(false);
      return;
    }

    try {
      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          user_id,
          message,
          created_at,
          expires_at,
          profiles:user_id (
            username,
            avatar_url
          )
        `)
        .gt('expires_at', nowIso)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) {
        console.error('Error fetching messages:', error);
        setError('Unable to load chat messages.');
      } else {
        // Cache profiles
        data?.forEach((m) => {
          if (m.profiles && m.user_id) {
            profileCache.current.set(m.user_id, m.profiles);
          }
        });

        // Double check expiration on client side before setting
        const active = (data || []).filter(
          (m) => new Date(m.expires_at).getTime() > Date.now()
        );
        setMessages(active);
        setError(null);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
      setError('Connection error while loading messages.');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Initial load
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Client-side automatic expiration timer:
  // Purges expired messages from state every 2 seconds without requiring page refresh
  useEffect(() => {
    const interval = setInterval(() => {
      setMessages((prev) => {
        const now = Date.now();
        const unexpired = prev.filter((m) => new Date(m.expires_at).getTime() > now);
        if (unexpired.length !== prev.length) {
          return unexpired;
        }
        return prev;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Supabase Realtime Subscription for new messages
  useEffect(() => {
    if (!isSupabaseConfigured || !currentUser) return;

    const channel = supabase
      .channel('private-chat-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          const newMsg = payload.new;

          // Check if message is already expired
          if (new Date(newMsg.expires_at).getTime() <= Date.now()) {
            return;
          }

          // Fetch sender profile details if not included in payload
          let senderProfile = profileCache.current.get(newMsg.user_id);
          if (!senderProfile) {
            senderProfile = await getSenderProfile(newMsg.user_id);
          }

          const messageWithProfile = {
            ...newMsg,
            profiles: senderProfile,
          };

          setMessages((prev) => {
            // Deduplicate in case optimistic insertion already added it
            if (prev.some((m) => m.id === newMsg.id)) {
              return prev.map((m) => (m.id === newMsg.id ? messageWithProfile : m));
            }
            return [...prev, messageWithProfile];
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          setMessages((prev) => prev.filter((m) => m.id !== payload.old.id));
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected');
        } else if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
          setConnectionStatus('reconnecting');
        } else if (status === 'CLOSED') {
          setConnectionStatus('disconnected');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, getSenderProfile]);

  // Send a message
  const sendMessage = async (text) => {
    if (!currentUser) {
      return { success: false, error: 'You must be signed in to send messages.' };
    }

    const validation = validateMessage(text);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    setSending(true);
    setError(null);

    try {
      // Let database set user_id = auth.uid(), created_at = NOW(), expires_at = NOW() + 1 hour
      // via default values and RLS verification
      const { data, error: insertError } = await supabase
        .from('messages')
        .insert({
          message: validation.sanitized,
          user_id: currentUser.id,
        })
        .select(`
          id,
          user_id,
          message,
          created_at,
          expires_at
        `)
        .single();

      if (insertError) {
        console.error('Message insert error:', insertError);
        const userFriendlyError = 'Unable to send message. Please check your connection.';
        setError(userFriendlyError);
        return { success: false, error: userFriendlyError };
      }

      // Optimistically add to UI with current user profile
      if (data) {
        const fullMsg = {
          ...data,
          profiles: profileCache.current.get(currentUser.id) || {
            username: currentUser.email?.split('@')[0] || 'You',
            avatar_url: null,
          },
        };

        setMessages((prev) => {
          if (prev.some((m) => m.id === data.id)) return prev;
          return [...prev, fullMsg];
        });
      }

      return { success: true };
    } catch (err) {
      console.error('Exception sending message:', err);
      const msg = 'Unable to send message.';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setSending(false);
    }
  };

  return {
    messages,
    loading,
    error,
    sending,
    connectionStatus,
    sendMessage,
    refreshMessages: loadMessages,
  };
};
