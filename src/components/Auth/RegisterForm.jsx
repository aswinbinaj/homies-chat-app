import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Input } from '../UI/Input';
import { Button } from '../UI/Button';
import { Card } from '../UI/Card';
import { Mail, Lock, User, Key, AlertCircle, CheckCircle2, Users } from 'lucide-react';
import { validateUsername } from '../../utils/helpers';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

export const RegisterForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [inviteStatus, setInviteStatus] = useState(null); // { valid: boolean, message: string } | null
  const [validatingInvite, setValidatingInvite] = useState(false);

  const { signUp } = useAuth();
  const navigate = useNavigate();

  // Validate invite code on blur
  const handleCheckInvite = async () => {
    const cleanCode = inviteCode.trim().toUpperCase();
    if (!cleanCode || !isSupabaseConfigured) return;

    setValidatingInvite(true);
    setInviteStatus(null);

    try {
      const { data, error } = await supabase.rpc('check_invite_valid', {
        code_input: cleanCode,
      });

      if (error) {
        console.warn('Invite pre-check RPC error:', error.message);
        setInviteStatus(null);
      } else if (data?.valid) {
        setInviteStatus({ valid: true, message: 'Valid invite code!' });
      } else {
        setInviteStatus({ valid: false, message: data?.reason || 'Invalid invite code.' });
      }
    } catch (err) {
      console.warn('Invite verification exception:', err);
      setInviteStatus(null);
    } finally {
      setValidatingInvite(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // Username validation
    const usernameCheck = validateUsername(username);
    if (!usernameCheck.isValid) {
      setFormError(usernameCheck.error);
      return;
    }

    if (password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }

    if (!inviteCode.trim()) {
      setFormError('An invite code is required to register.');
      return;
    }

    setLoading(true);
    const result = await signUp({
      email,
      password,
      username: usernameCheck.username,
      inviteCode,
    });
    setLoading(false);

    if (result.success) {
      if (result.requiresEmailConfirmation) {
        setFormError('Account created! Please check your email to confirm your registration.');
      } else {
        navigate('/chat');
      }
    } else {
      setFormError(result.error || 'Registration failed. Please try again.');
    }
  };

  return (
    <Card className="w-full max-w-md p-6 sm:p-8">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white mx-auto mb-3 shadow-lg shadow-indigo-600/30">
          <Users className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100 tracking-tight">
          Join HomiesOnly
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 mt-1">
          Private, 1-hour vanishing chat for the homies
        </p>
      </div>

      {/* Error / Feedback Alert */}
      {formError && (
        <div className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 flex items-start gap-2.5 text-rose-700 dark:text-rose-300 text-xs font-medium animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{formError}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Invite Code Input with Live Pre-Validation */}
        <div>
          <Input
            label="Invite Code"
            type="text"
            placeholder="e.g. WELCOME-FRIENDS-2026"
            icon={Key}
            value={inviteCode}
            onChange={(e) => {
              setInviteCode(e.target.value.toUpperCase());
              setInviteStatus(null);
            }}
            onBlur={handleCheckInvite}
            required
            autoCapitalize="characters"
          />
          {validatingInvite && (
            <p className="mt-1 text-xs text-indigo-500">Checking invite code...</p>
          )}
          {inviteStatus && (
            <div className={`mt-1 flex items-center gap-1.5 text-xs font-medium ${inviteStatus.valid ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
              {inviteStatus.valid ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5" />
              )}
              <span>{inviteStatus.message}</span>
            </div>
          )}
        </div>

        <Input
          label="Username"
          type="text"
          placeholder="e.g. rahul"
          icon={User}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          autoComplete="username"
          helperText="3-30 letters, numbers, or underscores"
        />

        <Input
          label="Email Address"
          type="email"
          placeholder="your@email.com"
          icon={Mail}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />

        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          icon={Lock}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
          helperText="Minimum 6 characters"
        />

        <Button
          type="submit"
          loading={loading}
          disabled={loading}
          className="w-full mt-2"
          size="lg"
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </Button>
      </form>

      {/* Login Link */}
      <div className="mt-6 text-center text-xs text-gray-500 dark:text-zinc-400">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          Sign in
        </Link>
      </div>

      {/* Privacy Policy Link */}
      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-zinc-800/80 text-center">
        <Link
          to="/privacy"
          className="text-[11px] text-gray-400 dark:text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          Security & Privacy Policy
        </Link>
      </div>
    </Card>
  );
};
