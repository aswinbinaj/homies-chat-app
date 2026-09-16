import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch or refresh the user's profile record from public.profiles
  const fetchProfile = useCallback(async (userId) => {
    if (!userId || !isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // If profile doesn't exist yet (slight trigger delay), retry once after a short delay
        console.warn('Profile fetch warning:', error.message);
        return null;
      }
      setProfile(data);
      return data;
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
      return null;
    }
  }, []);

  // Initialize auth session
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let mounted = true;

    // Get current active session
    supabase.auth.getSession().then(({ data: { session }, error: sessionError }) => {
      if (!mounted) return;
      if (sessionError) {
        console.error('Error fetching session:', sessionError.message);
        setError(sessionError.message);
      }
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen to auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          // Add brief delay if SIGNED_UP to allow database trigger to populate profile
          if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
            await fetchProfile(newSession.user.id);
          } else if (event === 'TOKEN_REFRESHED') {
            fetchProfile(newSession.user.id);
          }
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [fetchProfile]);

  // Sign In with Email and Password
  const signIn = async ({ email, password }) => {
    setError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        // Human-friendly error translation
        let msg = error.message;
        if (msg.includes('Invalid login credentials')) {
          msg = 'Invalid email or password. Please double-check your credentials.';
        }
        setError(msg);
        return { success: false, error: msg };
      }

      // Check if user is disabled
      const userProfile = await fetchProfile(data.user.id);
      if (userProfile?.is_disabled) {
        await supabase.auth.signOut();
        const disabledMsg = 'Your account has been deactivated by an administrator.';
        setError(disabledMsg);
        return { success: false, error: disabledMsg };
      }

      return { success: true, user: data.user };
    } catch (err) {
      const msg = err.message || 'An unexpected error occurred during sign in.';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  // Sign Up with Invite Code verification
  const signUp = async ({ email, password, username, inviteCode }) => {
    setError(null);
    try {
      // 1. Pre-check invite code validity with secure database RPC
      const cleanCode = inviteCode.trim().toUpperCase();
      try {
        const { data: inviteCheck, error: rpcError } = await supabase.rpc('check_invite_valid', {
          code_input: cleanCode,
        });

        if (!rpcError && inviteCheck && !inviteCheck.valid) {
          return { success: false, error: inviteCheck.reason || 'Invalid or expired invite code.' };
        }
      } catch (rpcCatch) {
        console.warn('Invite pre-check RPC skipped, relying on database trigger:', rpcCatch);
      }

      // 2. Perform Supabase registration with user metadata
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            username: username.trim(),
            invite_code: cleanCode,
          },
        },
      });

      if (error) {
        let msg = error.message;
        if (msg.includes('User already registered')) {
          msg = 'An account with this email address already exists.';
        } else if (msg.includes('Username must be') || msg.includes('invite code')) {
          // Trigger exception bubble-up
          msg = msg.replace(/^.*ERROR:\s*/, '');
        }
        setError(msg);
        return { success: false, error: msg };
      }

      // If user profile is immediately available or needs verification
      if (data.user) {
        // Wait briefly for trigger to finish inserting profile
        await new Promise((resolve) => setTimeout(resolve, 600));
        await fetchProfile(data.user.id);
      }

      return {
        success: true,
        user: data.user,
        requiresEmailConfirmation: !data.session && Boolean(data.user),
      };
    } catch (err) {
      const msg = err.message || 'Registration failed. Please try again.';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  // Sign Out
  const signOut = async () => {
    try {
      if (user?.id) {
        // Update last_seen right before signing out
        await supabase
          .from('profiles')
          .update({ last_seen: new Date().toISOString() })
          .eq('id', user.id);
      }
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setSession(null);
      return { success: true };
    } catch (err) {
      console.error('Sign out error:', err);
      return { success: false, error: err.message };
    }
  };

  // Update profile (Avatar, etc.)
  const updateProfile = async (updates) => {
    if (!user) return { success: false, error: 'Not authenticated' };
    try {
      // Whitelist safe fields (cannot alter is_admin or id)
      const allowedUpdates = {};
      if (updates.avatar_url !== undefined) allowedUpdates.avatar_url = updates.avatar_url;
      if (updates.username !== undefined) allowedUpdates.username = updates.username.trim();

      const { data, error } = await supabase
        .from('profiles')
        .update(allowedUpdates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      setProfile(data);
      return { success: true, profile: data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const value = {
    session,
    user,
    profile,
    isAdmin: Boolean(profile?.is_admin),
    loading,
    error,
    clearError: () => setError(null),
    signIn,
    signUp,
    signOut,
    updateProfile,
    refreshProfile: () => user && fetchProfile(user.id),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
