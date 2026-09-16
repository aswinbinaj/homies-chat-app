import { useState, useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const usePresence = (currentUser, currentProfile) => {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const channelRef = useRef(null);

  // Fetch all registered member profiles to show offline members with last_seen
  const fetchAllMembers = async () => {
    if (!isSupabaseConfigured || !currentUser) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, last_seen, is_admin')
        .order('username', { ascending: true });

      if (!error && data) {
        setAllMembers(data);
      }
    } catch (err) {
      console.error('Failed to fetch members list:', err);
    } finally {
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    fetchAllMembers();
  }, [currentUser]);

  // Realtime Presence tracking
  useEffect(() => {
    if (!isSupabaseConfigured || !currentUser || !currentProfile) return;

    const channel = supabase.channel('private-chat-presence', {
      config: {
        presence: {
          key: currentUser.id,
        },
      },
    });

    channelRef.current = channel;

    // Track presence changes
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const activeList = [];
        Object.keys(state).forEach((key) => {
          const presences = state[key];
          if (presences && presences.length > 0) {
            activeList.push(presences[0]);
          }
        });
        setOnlineUsers(activeList);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        // A user joined
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        // A user left
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: currentUser.id,
            username: currentProfile.username || currentUser.email?.split('@')[0],
            avatar_url: currentProfile.avatar_url || null,
            online_at: new Date().toISOString(),
          });
        }
      });

    // Update last_seen on window unload / close
    const handleBeforeUnload = () => {
      if (currentUser?.id) {
        // Use navigator.sendBeacon or direct async update
        supabase
          .from('profiles')
          .update({ last_seen: new Date().toISOString() })
          .eq('id', currentUser.id)
          .then(() => {});
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (channelRef.current) {
        // Update last_seen on leave
        if (currentUser?.id) {
          supabase
            .from('profiles')
            .update({ last_seen: new Date().toISOString() })
            .eq('id', currentUser.id)
            .then(() => {});
        }
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [currentUser, currentProfile]);

  return {
    onlineUsers,
    allMembers,
    loadingMembers,
    refreshMembers: fetchAllMembers,
  };
};
