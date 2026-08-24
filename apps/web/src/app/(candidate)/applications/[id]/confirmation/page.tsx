'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchApi } from '@/lib/api';
import { ApplicationDetail } from '@/types/application';
import { formatDateTime } from '@/lib/formatters';
import {
  CheckCircle2,
  Briefcase,
  Calendar,
  Building,
  MapPin,
  FileText,
  ArrowRight,
  Loader2,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';

export default function ApplicationConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params?.id as string;

  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadApplication() {
      if (!applicationId) return;
      setIsLoading(true);
      try {
        const res = await fetchApi<ApplicationDetail>(`/api/v1/me/applications/${applicationId}`);
        if (res.error) {
          setError(res.error.message || 'Failed to load application confirmation');
        } else if (res.data) {
          setApplication(res.data);
        }
      } catch (err: any) {
        setError(err.message || 'Error loading confirmation');
      } finally {
        setIsLoading(false);
      }
    }

    loadApplication();
  }, [applicationId]);

  const handleCopyCode = () => {
    if (!application?.application_code) return;
    navigator.clipboard.writeText(application.application_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Retrieving application receipt...</p>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">Application Receipt Unavailable</h2>
          <p className="text-sm text-slate-600">{error || 'Could not find the requested application.'}</p>
          <Link
            href="/applications"
            className="inline-block px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition shadow-sm"
          >
            Go to My Applications
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 transition-colors duration-200">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Main Success Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-6">
          <div className="h-20 w-20 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 mb-3">
              Application Submitted Successfully
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Thank You For Applying!
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-lg mx-auto leading-relaxed">
              Your application has been received and logged into our recruiting system. We have sent a
              confirmation to your registered email address.
            </p>
          </div>

          {/* Application Code Badge */}
          <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="text-left">
              <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                Application Code
              </p>
              <p className="text-lg font-mono font-bold text-blue-600 dark:text-blue-400">
                {application.application_code}
              </p>
            </div>
            <button
              onClick={handleCopyCode}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700 transition active:scale-95"
              title="Copy Application Code"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>

          {/* Requisition Summary Box */}
          <div className="text-left bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Position</p>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{application.requisition_title}</h3>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 self-start sm:self-auto">
                Status: Received &mdash; Under Review
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1 text-xs text-slate-600 dark:text-slate-400">
              <div>
                <span className="text-slate-400 dark:text-slate-500 block font-medium">Requisition Code</span>
                <span className="font-bold text-slate-900 dark:text-white">{application.requisition_code}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block font-medium">Department</span>
                <span className="font-bold text-slate-900 dark:text-white">{application.department}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block font-medium">Submitted At</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {application.submitted_at ? formatDateTime(application.submitted_at) : 'Just now'}
                </span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/applications"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition shadow-md shadow-blue-500/20 active:scale-95"
            >
              <span>Go to My Applications</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/jobs"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm active:scale-95"
            >
              Browse More Jobs
            </Link>
          </div>
        </div>

        {/* What Happens Next Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">What Happens Next?</h4>
          <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-2 list-disc list-inside">
            <li>Our recruitment team will review your frozen profile and resume.</li>
            <li>You can track any real-time status updates from your &quot;My Applications&quot; dashboard.</li>
            <li>If shortlisted, our hiring coordinator will reach out directly to schedule next rounds.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
