import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Card } from '../components/UI/Card';
import {
  ShieldCheck,
  Clock,
  Lock,
  EyeOff,
  Database,
  Users,
  KeyRound,
  ArrowLeft,
  Moon,
  Sun,
  CheckCircle2,
} from 'lucide-react';

export const PrivacyPolicy = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#09090b] text-gray-900 dark:text-zinc-100 transition-colors py-8 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Top Navigation */}
        <div className="flex items-center justify-between">
          <Link
            to="/chat"
            className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors py-1.5 px-3 rounded-xl bg-gray-100 dark:bg-zinc-800/80"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Chat</span>
          </Link>

          <button
            onClick={toggleTheme}
            className="p-2 text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
          </button>
        </div>

        {/* Header Hero */}
        <div className="text-center py-4 sm:py-6">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 mx-auto mb-3 shadow-lg shadow-indigo-600/10">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-zinc-100">
            Security & Privacy Policy
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 mt-2 max-w-lg mx-auto">
            HomiesOnly is built from the ground up to guarantee private, confidential, and ephemeral communication among trusted friends.
          </p>
        </div>

        {/* Policy Points Grid */}
        <div className="space-y-4">
          {/* 1. Ephemeral Messages */}
          <Card className="p-5 sm:p-6 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0 mt-0.5">
              <Clock className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-gray-900 dark:text-zinc-100">
                1. Strict 1-Hour Ephemeral Lifespan
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">
                Every single message sent has a hardcoded expiration timestamp set to exactly <strong>1 hour</strong> from the moment it is created. Database Row Level Security (RLS) automatically blocks any query for expired messages, client sessions auto-purge them every 2 seconds, and automated server-side cleanup workers permanently delete expired rows. No chat logs or permanent archives are ever maintained.
              </p>
            </div>
          </Card>

          {/* 2. Privacy Guard & Anti-Screenshot */}
          <Card className="p-5 sm:p-6 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0 mt-0.5">
              <EyeOff className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-gray-900 dark:text-zinc-100">
                2. Privacy Guard & Anti-Screenshot Protection
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">
                A permanent Privacy Guard is enforced on all chat views. If the chat window loses focus (such as when a user opens the Windows Snipping Tool, takes a screenshot overlay, or switches apps), the entire conversation instantly blanks behind an opaque privacy mask. Keyboard shortcuts like <code>PrintScreen</code>, <code>Ctrl+P</code> (Print), and <code>Ctrl+S</code> are intercepted, and printing stylesheets blank out all content. Text selection and dragging are also restricted.
              </p>
            </div>
          </Card>

          {/* 3. Invite-Only Registration */}
          <Card className="p-5 sm:p-6 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 shrink-0 mt-0.5">
              <Users className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-gray-900 dark:text-zinc-100">
                3. Closed Invite-Only Registration
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">
                Random signups are strictly forbidden. The system requires an authorized invite code generated by a group administrator. Invite verification is enforced atomically at the database level by PostgreSQL triggers, ensuring no user can bypass code validation. Each invite code can only be claimed once.
              </p>
            </div>
          </Card>

          {/* 4. PostgreSQL Row Level Security (RLS) */}
          <Card className="p-5 sm:p-6 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 shrink-0 mt-0.5">
              <Database className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-gray-900 dark:text-zinc-100">
                4. Row Level Security (RLS) Architecture
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">
                Every table in our database (<code>profiles</code>, <code>messages</code>, <code>invites</code>) has active Row Level Security. Authenticated members can only select active non-expired messages and cannot edit or delete other members' posts. Normal members have zero read or write access to the <code>invites</code> table. User profiles can only be updated by the account owner, and privilege escalation is blocked by database constraints.
              </p>
            </div>
          </Card>

          {/* 5. Password & Authentication Security */}
          <Card className="p-5 sm:p-6 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shrink-0 mt-0.5">
              <KeyRound className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-gray-900 dark:text-zinc-100">
                5. Secure Credentials Management
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">
                All passwords and authentication credentials are handled exclusively by Supabase Auth using salted and hashed algorithms. No passwords or plaintext secrets are ever stored in application profile tables. Furthermore, no master service-role keys are ever packaged or exposed in frontend code.
              </p>
            </div>
          </Card>

          {/* 6. Ephemeral Realtime Memory */}
          <Card className="p-5 sm:p-6 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500 shrink-0 mt-0.5">
              <Lock className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-gray-900 dark:text-zinc-100">
                6. Zero Tracking & In-Memory Indicators
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">
                The application contains no advertisements, no tracking pixels, no telemetry, and no third-party analytics libraries. Typing indicators and online presence exist purely in volatile WebSocket memory channels and are never recorded to database disk storage.
              </p>
            </div>
          </Card>
        </div>

        {/* Footer info */}
        <div className="text-center pt-4 pb-8 text-xs text-gray-400 dark:text-zinc-500">
          <p>HomiesOnly • Vanishing Friends Chat</p>
          <p className="mt-1">All policies are enforced at both the client layer and PostgreSQL engine.</p>
        </div>
      </div>
    </div>
  );
};
