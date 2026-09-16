import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Navbar } from '../components/Layout/Navbar';
import { Card } from '../components/UI/Card';
import { Input } from '../components/UI/Input';
import { Button } from '../components/UI/Button';
import { Badge } from '../components/UI/Badge';
import { User, Mail, Calendar, Shield, CheckCircle2, AlertCircle } from 'lucide-react';
import { getInitials, getAvatarColor, validateUsername } from '../utils/helpers';

export const Profile = () => {
  const { user, profile, updateProfile, isAdmin } = useAuth();

  const [username, setUsername] = useState(profile?.username || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'success' | 'error', message: string }

  const handleSave = async (e) => {
    e.preventDefault();
    setStatus(null);

    const check = validateUsername(username);
    if (!check.isValid) {
      setStatus({ type: 'error', message: check.error });
      return;
    }

    setLoading(true);
    const res = await updateProfile({
      username: check.username,
      avatar_url: avatarUrl.trim() || null,
    });
    setLoading(false);

    if (res.success) {
      setStatus({ type: 'success', message: 'Profile updated successfully!' });
    } else {
      setStatus({
        type: 'error',
        message: res.error.includes('duplicate')
          ? 'Username is already taken by another member.'
          : res.error || 'Failed to update profile.',
      });
    }
  };

  const displayName = profile?.username || user?.email?.split('@')[0] || 'Friend';
  const avatarBg = getAvatarColor(displayName);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#09090b] transition-colors">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
        <Card className="p-5 sm:p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5 pb-6 mb-6 border-b border-gray-100 dark:border-zinc-800/80">
            <div
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-xl sm:text-2xl font-bold shadow-md ring-1 ring-white/10 ${avatarBg}`}
            >
              {getInitials(displayName)}
            </div>
            <div className="text-center sm:text-left space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-zinc-100">
                  {displayName}
                </h1>
                {isAdmin && (
                  <Badge variant="brand" size="md">
                    <Shield className="w-3 h-3" />
                    Admin
                  </Badge>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-zinc-400 flex items-center justify-center sm:justify-start gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                {user?.email}
              </p>
              {profile?.created_at && (
                <p className="text-xs text-gray-400 dark:text-zinc-500 flex items-center justify-center sm:justify-start gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Joined {new Date(profile.created_at).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          {/* Status Alert */}
          {status && (
            <div
              className={`mb-6 p-3.5 rounded-xl flex items-center gap-2.5 text-xs font-medium ${
                status.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300'
              }`}
            >
              {status.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{status.message}</span>
            </div>
          )}

          {/* Profile Form */}
          <form onSubmit={handleSave} className="space-y-4 sm:space-y-5">
            <Input
              label="Username"
              icon={User}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              helperText="Visible to all group members in the chat"
            />

            <Input
              label="Avatar Image URL (Optional)"
              type="url"
              placeholder="https://example.com/avatar.png"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              helperText="Optional external image link. Defaults to your stylized initials."
            />

            <div className="pt-2">
              <Button type="submit" loading={loading} disabled={loading} className="w-full sm:w-auto">
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>

          {/* Security Notice */}
          <div className="mt-8 p-4 rounded-xl bg-gray-50 dark:bg-[#141417] border border-gray-200 dark:border-zinc-800/80 text-xs text-gray-500 dark:text-zinc-400 space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-gray-700 dark:text-zinc-300">
                Security & Privacy
              </p>
              <Link
                to="/privacy"
                className="text-indigo-600 dark:text-indigo-400 hover:underline text-[11px] font-semibold"
              >
                View full policy →
              </Link>
            </div>
            <p>
              Your password and authentication are managed securely through Supabase Auth.
              Profiles are protected by Row Level Security (RLS) and can only be modified by you. Messages vanish permanently after 1 hour.
            </p>
          </div>
        </Card>
      </main>
    </div>
  );
};
