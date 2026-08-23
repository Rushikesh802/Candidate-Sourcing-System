'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { fetchApi } from '@/lib/api';
import { Lock, CheckCircle2, AlertCircle } from 'lucide-react';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('Missing reset token. Please request a new password reset link.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    const res = await fetchApi('/api/v1/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, new_password: newPassword }),
    });

    setIsSubmitting(false);

    if (res.error) {
      setError(res.error.message || 'Failed to reset password. The link may have expired.');
    } else {
      setIsSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    }
  };

  return (
    <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Set New Password</h1>
        <p className="text-sm text-slate-500 mt-1">
          Create a new secure password for your account
        </p>
      </div>

      {isSuccess ? (
        <div className="text-center py-4">
          <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-200">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-semibold text-slate-800 mb-2">Password Reset Successful</h2>
          <p className="text-sm text-slate-600 mb-6">
            Your password has been updated. Redirecting you to login...
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 transition"
          >
            Sign in now
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-2.5">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!token && (
            <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
              No reset token found in the URL. Please verify your link or request a new one from the forgot password page.
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              New Password (min 8 chars) *
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Confirm New Password *
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !token}
            className="w-full py-2.5 px-4 rounded-lg bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition disabled:opacity-50 shadow-sm"
          >
            {isSubmitting ? 'Updating Password...' : 'Reset Password'}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <Suspense fallback={<div className="p-8 bg-white rounded-xl shadow-sm">Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </main>
    </div>
  );
}
