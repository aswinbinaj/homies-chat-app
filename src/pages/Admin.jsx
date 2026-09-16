import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Navbar } from '../components/Layout/Navbar';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Input } from '../components/UI/Input';
import { Badge } from '../components/UI/Badge';
import {
  Shield,
  Key,
  Users,
  Copy,
  Check,
  Ban,
  Trash2,
  RefreshCw,
  Clock,
  Sparkles,
  AlertCircle,
  Lock,
} from 'lucide-react';
import { formatLastSeen } from '../utils/formatters';
import { getInitials, getAvatarColor } from '../utils/helpers';

export const Admin = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [invites, setInvites] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingInvites, setLoadingInvites] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Invite generation form
  const [customCode, setCustomCode] = useState('');
  const [expiryDays, setExpiryDays] = useState('7');
  const [creatingInvite, setCreatingInvite] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);

  // Cleanup action state
  const [cleaning, setCleaning] = useState(false);

  // Admin Master Passcode Gate State
  const [isUnlocked, setIsUnlocked] = useState(
    () => sessionStorage.getItem('chat_admin_authenticated') === 'true'
  );
  const [passcodeInput, setPasscodeInput] = useState('');
  const [passcodeError, setPasscodeError] = useState('');
  const [attempts, setAttempts] = useState(0);

  const handleUnlock = (e) => {
    e.preventDefault();
    setPasscodeError('');

    if (attempts >= 5) {
      setPasscodeError('Too many failed attempts. Admin gate temporarily locked.');
      return;
    }

    const expectedPasscode = import.meta.env.VITE_ADMIN_PASSCODE || 'Admin@9900';
    if (passcodeInput.trim() === expectedPasscode.trim()) {
      sessionStorage.setItem('chat_admin_authenticated', 'true');
      setIsUnlocked(true);
      setPasscodeInput('');
    } else {
      const next = attempts + 1;
      setAttempts(next);
      if (next >= 5) {
        setPasscodeError('Too many failed attempts. Admin gate locked for 5 minutes.');
      } else {
        setPasscodeError(`Incorrect passcode. (${5 - next} attempts remaining)`);
      }
    }
  };

  const handleLock = () => {
    sessionStorage.removeItem('chat_admin_authenticated');
    setIsUnlocked(false);
  };

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/chat');
    }
  }, [isAdmin, authLoading, navigate]);

  // Load Invites
  const fetchInvites = async () => {
    if (!isSupabaseConfigured) return;
    setLoadingInvites(true);
    try {
      const { data, error } = await supabase
        .from('invites')
        .select(`
          id,
          code,
          created_at,
          expires_at,
          used,
          used_by,
          created_by,
          profiles:used_by (username)
        `)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setInvites(data);
      }
    } catch (err) {
      console.error('Failed to load invites:', err);
    } finally {
      setLoadingInvites(false);
    }
  };

  // Load Registered Users
  const fetchUsers = async () => {
    if (!isSupabaseConfigured) return;
    setLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setUsers(data);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchInvites();
      fetchUsers();
    }
  }, [isAdmin]);

  // Create new invite
  const handleCreateInvite = async (e) => {
    e.preventDefault();
    setCreatingInvite(true);
    setStatusMessage(null);

    try {
      const days = expiryDays === 'never' ? null : parseInt(expiryDays, 10);
      const code = customCode.trim() ? customCode.trim().toUpperCase() : null;

      const { data, error } = await supabase.rpc('create_invite', {
        code_input: code,
        expires_in_days: days,
      });

      if (error) {
        setStatusMessage({ type: 'error', text: error.message });
      } else {
        setStatusMessage({
          type: 'success',
          text: `Invite created: ${data.code}`,
        });
        setCustomCode('');
        fetchInvites();
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Failed to create invite.' });
    } finally {
      setCreatingInvite(false);
    }
  };

  // Revoke an active invite
  const handleRevokeInvite = async (inviteId) => {
    try {
      const { error } = await supabase.rpc('revoke_invite', {
        invite_id: inviteId,
      });

      if (error) {
        setStatusMessage({ type: 'error', text: error.message });
      } else {
        setStatusMessage({ type: 'success', text: 'Invite revoked.' });
        fetchInvites();
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Failed to revoke invite.' });
    }
  };

  // Toggle user disabled status
  const handleToggleDisable = async (targetUser) => {
    if (targetUser.id === user?.id) {
      setStatusMessage({ type: 'error', text: 'You cannot disable your own admin account.' });
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_disabled: !targetUser.is_disabled })
        .eq('id', targetUser.id);

      if (error) {
        setStatusMessage({ type: 'error', text: error.message });
      } else {
        setStatusMessage({
          type: 'success',
          text: `User ${targetUser.username} ${!targetUser.is_disabled ? 'deactivated' : 'reactivated'}.`,
        });
        fetchUsers();
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Failed to update user status.' });
    }
  };

  // Trigger manual expired messages cleanup
  const handleManualCleanup = async () => {
    setCleaning(true);
    try {
      const { data, error } = await supabase.rpc('cleanup_expired_messages');
      if (error) {
        setStatusMessage({ type: 'error', text: error.message });
      } else {
        setStatusMessage({
          type: 'success',
          text: `Cleaned up ${data} expired messages immediately.`,
        });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Failed to run cleanup.' });
    } finally {
      setCleaning(false);
    }
  };

  // Copy code to clipboard
  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <p className="text-sm text-gray-500">Checking permissions...</p>
      </div>
    );
  }

  if (!isAdmin) return null;

  // Render Admin Passcode Gate if console is locked
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#09090b] transition-colors flex flex-col justify-center items-center p-4">
        <Card className="w-full max-w-md p-6 sm:p-8">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center text-indigo-500 mx-auto mb-3 shadow-lg">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-zinc-100 tracking-tight">
              Admin Security Gate
            </h1>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
              Enter the master admin passcode to unlock the management console.
            </p>
          </div>

          {passcodeError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs font-medium animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{passcodeError}</span>
            </div>
          )}

          <form onSubmit={handleUnlock} className="space-y-4">
            <Input
              label="Master Admin Passcode"
              type="password"
              placeholder="••••••••"
              icon={Key}
              value={passcodeInput}
              onChange={(e) => setPasscodeInput(e.target.value)}
              required
              autoFocus
              helperText="Set via VITE_ADMIN_PASSCODE in .env (Default: Admin@9900)"
            />

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={attempts >= 5}
            >
              <Lock className="w-4 h-4 mr-2" />
              Unlock Admin Console
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#09090b] transition-colors">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                Admin Panel
              </h1>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Manage invite codes, members, and group security
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualCleanup}
              loading={cleaning}
              title="Delete all messages expired past 1 hour right now"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Purge Expired Messages
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                fetchInvites();
                fetchUsers();
              }}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleLock}
              title="Lock Admin Session"
            >
              <Lock className="w-3.5 h-3.5" />
              Lock
            </Button>
          </div>
        </div>

        {/* Status Notification */}
        {statusMessage && (
          <div
            className={`p-4 rounded-xl flex items-center gap-2 text-xs font-medium animate-in fade-in ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                : 'bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
            }`}
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* SECTION 1: Generate Invite */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Generate Invite Code
            </h2>
          </div>

          <form onSubmit={handleCreateInvite} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <Input
              label="Custom Code (Optional)"
              placeholder="Leave blank to auto-generate"
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
            />

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                Expiration
              </label>
              <select
                value={expiryDays}
                onChange={(e) => setExpiryDays(e.target.value)}
                className="w-full rounded-xl border border-gray-300 dark:border-zinc-800 bg-white dark:bg-[#141417] text-gray-900 dark:text-zinc-100 text-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="1">1 Day</option>
                <option value="7">7 Days (Default)</option>
                <option value="30">30 Days</option>
                <option value="never">Never Expires</option>
              </select>
            </div>

            <Button
              type="submit"
              loading={creatingInvite}
              disabled={creatingInvite}
              className="w-full h-[42px]"
            >
              <Key className="w-4 h-4 mr-1.5" />
              Generate Invite
            </Button>
          </form>
        </Card>

        {/* SECTION 2: Invites Table */}
        <Card className="overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-zinc-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-indigo-500" />
              <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-zinc-100">
                Invite Codes ({invites.length})
              </h2>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-[#141417]/60 text-gray-500 dark:text-zinc-400 uppercase tracking-wider border-b border-gray-200 dark:border-zinc-800">
                <tr>
                  <th className="px-5 py-3 font-semibold">Code</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Created</th>
                  <th className="px-5 py-3 font-semibold">Expires</th>
                  <th className="px-5 py-3 font-semibold">Claimed By</th>
                  <th className="px-5 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {loadingInvites ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-gray-400">
                      Loading invites...
                    </td>
                  </tr>
                ) : invites.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-gray-400">
                      No invites created yet.
                    </td>
                  </tr>
                ) : (
                  invites.map((inv) => {
                    const isExpired =
                      inv.expires_at && new Date(inv.expires_at).getTime() <= Date.now();
                    const isAvailable = !inv.used && !isExpired;

                    return (
                      <tr key={inv.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30">
                        <td className="px-5 py-3.5 font-mono font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                          <span>{inv.code}</span>
                          <button
                            onClick={() => handleCopy(inv.code)}
                            className="text-gray-400 hover:text-indigo-600 transition-colors"
                            title="Copy code"
                          >
                            {copiedCode === inv.code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </td>

                        <td className="px-5 py-3.5">
                          {inv.used ? (
                            <Badge variant="default">Used</Badge>
                          ) : isExpired ? (
                            <Badge variant="danger">Expired</Badge>
                          ) : (
                            <Badge variant="success">Active</Badge>
                          )}
                        </td>

                        <td className="px-5 py-3.5 text-gray-500">
                          {new Date(inv.created_at).toLocaleDateString()}
                        </td>

                        <td className="px-5 py-3.5 text-gray-500">
                          {inv.expires_at
                            ? new Date(inv.expires_at).toLocaleDateString()
                            : 'Never'}
                        </td>

                        <td className="px-5 py-3.5 font-medium text-gray-700 dark:text-gray-300">
                          {inv.profiles?.username || (inv.used ? 'Registered Member' : '—')}
                        </td>

                        <td className="px-5 py-3.5 text-right">
                          {isAvailable && (
                            <button
                              onClick={() => handleRevokeInvite(inv.id)}
                              className="text-rose-600 hover:text-rose-700 dark:text-rose-400 font-medium text-xs hover:underline"
                            >
                              Revoke
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* SECTION 3: Registered Users Table */}
        <Card className="overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-500" />
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Registered Members ({users.length})
              </h2>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3 font-semibold">User</th>
                  <th className="px-5 py-3 font-semibold">Role</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Joined</th>
                  <th className="px-5 py-3 font-semibold">Last Seen</th>
                  <th className="px-5 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {loadingUsers ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-gray-400">
                      Loading members...
                    </td>
                  </tr>
                ) : (
                  users.map((member) => {
                    const isCurrent = member.id === user?.id;
                    const avatarBg = getAvatarColor(member.username);

                    return (
                      <tr key={member.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30">
                        <td className="px-5 py-3.5 flex items-center gap-3">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${avatarBg}`}
                          >
                            {getInitials(member.username)}
                          </div>
                          <div>
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                              {member.username}
                            </span>
                            {isCurrent && (
                              <span className="ml-1.5 text-[10px] text-gray-400 font-normal">
                                (You)
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-3.5">
                          {member.is_admin ? (
                            <Badge variant="brand">Admin</Badge>
                          ) : (
                            <Badge variant="default">Member</Badge>
                          )}
                        </td>

                        <td className="px-5 py-3.5">
                          {member.is_disabled ? (
                            <Badge variant="danger">Disabled</Badge>
                          ) : (
                            <Badge variant="success">Active</Badge>
                          )}
                        </td>

                        <td className="px-5 py-3.5 text-gray-500">
                          {new Date(member.created_at).toLocaleDateString()}
                        </td>

                        <td className="px-5 py-3.5 text-gray-500">
                          {formatLastSeen(member.last_seen)}
                        </td>

                        <td className="px-5 py-3.5 text-right">
                          {!isCurrent && (
                            <Button
                              size="sm"
                              variant={member.is_disabled ? 'outline' : 'danger'}
                              onClick={() => handleToggleDisable(member)}
                              className="text-[11px] py-1 px-2.5"
                            >
                              <Ban className="w-3 h-3" />
                              {member.is_disabled ? 'Enable' : 'Disable'}
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  );
};
