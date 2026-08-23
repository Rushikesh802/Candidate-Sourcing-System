'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { fetchApi } from '@/lib/api';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const res = await fetchApi('/api/v1/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });

    setIsSubmitting(false);

    if (res.error) {
      setError(res.error.message || 'Failed to submit request.');
    } else {
      setIsSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Reset Password</h1>
            <p className="text-sm text-slate-500 mt-1">
              Enter your registered email address to receive reset instructions
            </p>
          </div>

          {isSubmitted ? (
            <div className="text-center py-4">
              <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-200">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">Check your email</h2>
              <p className="text-sm text-slate-600 mb-6">
                If an account exists with <span className="font-semibold text-slate-900">{email}</span>, a password reset link has been dispatched.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-100 text-slate-700 font-medium text-sm hover:bg-slate-200 transition"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Sign in
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

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-lg bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition disabled:opacity-50 shadow-sm"
              >
                {isSubmitting ? 'Sending instructions...' : 'Send Reset Link'}
              </button>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 transition"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
