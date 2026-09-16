import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Input } from '../UI/Input';
import { Button } from '../UI/Button';
import { Card } from '../UI/Card';
import { Mail, Lock, AlertCircle, Users } from 'lucide-react';

export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!email.trim() || !password) {
      setFormError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    const result = await signIn({ email, password });
    setLoading(false);

    if (result.success) {
      navigate('/chat');
    } else {
      setFormError(result.error || 'Failed to sign in. Please try again.');
    }
  };

  return (
    <Card className="w-full max-w-md p-6 sm:p-8">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white mx-auto mb-3 shadow-lg shadow-indigo-600/30">
          <Users className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100 tracking-tight">
          HomiesOnly
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 mt-1">
          Private, 1-hour vanishing chat for the homies
        </p>
      </div>

      {/* Error Alert */}
      {formError && (
        <div className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 flex items-start gap-2.5 text-rose-700 dark:text-rose-300 text-xs font-medium animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{formError}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
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
          autoComplete="current-password"
        />

        <Button
          type="submit"
          loading={loading}
          disabled={loading}
          className="w-full mt-2"
          size="lg"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      {/* Register Link */}
      <div className="mt-6 text-center text-xs text-gray-500 dark:text-zinc-400">
        Have an invite code?{' '}
        <Link
          to="/register"
          className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          Register here
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
