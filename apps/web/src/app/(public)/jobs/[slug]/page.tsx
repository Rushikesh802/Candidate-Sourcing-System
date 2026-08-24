'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { JobDetailSkeleton } from '@/components/JobSkeleton';
import { Job } from '@/types/job';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  formatEmploymentType,
  formatDate,
  formatRelativeDate,
  copyToClipboard,
} from '@/lib/formatters';
import {
  MapPin,
  Briefcase,
  Clock,
  Users,
  Building2,
  Calendar,
  Share2,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Check,
  AlertTriangle,
  UserCheck,
  CheckCircle2,
  Compass,
} from 'lucide-react';

export default function JobDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const router = useRouter();
  const { user } = useAuth();
  const { success } = useToast();

  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadJobDetail() {
      if (!slug) return;
      setIsLoading(true);
      setIsNotFound(false);

      try {
        const res = await fetchApi<Job>(`/api/v1/jobs/${slug}`);
        if (isMounted) {
          if (res.status === 404 || !res.data) {
            setIsNotFound(true);
            setJob(null);
          } else {
            setJob(res.data);
          }
        }
      } catch {
        if (isMounted) {
          setIsNotFound(true);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadJobDetail();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  const handleShare = async () => {
    if (!job) return;
    const publicUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${job.title} at TalentBridge`,
          text: `Check out the ${job.title} position at TalentBridge!`,
          url: publicUrl,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    const ok = await copyToClipboard(publicUrl);
    if (ok) {
      setCopied(true);
      success('Job link copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // 404 / Not Found Screen
  if (!isLoading && (isNotFound || !job)) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <Header />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-lg space-y-5">
            <div className="h-16 w-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-100 shadow-inner">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                Position Unavailable or Expired
              </h1>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                The role you requested may have been fulfilled, expired, or removed.
              </p>
            </div>
            <Link
              href="/jobs"
              className="w-full py-3 px-4 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition shadow-sm inline-flex items-center justify-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Browse All Open Roles</span>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (isLoading || !job) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header />
        <JobDetailSkeleton />
      </div>
    );
  }

  const applyUrl =
    user?.role === 'candidate'
      ? `/apply/${job.id}`
      : `/login?next=${encodeURIComponent(`/apply/${job.id}`)}`;

  const isRemote = job.location?.toLowerCase().includes('remote');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-500 selection:text-white">
      <Header />

      {/* Top Breadcrumb Header Bar */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-600 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to All Openings</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 hover:bg-blue-50 px-3.5 py-1.5 rounded-xl border border-slate-200 transition active:scale-95"
              title="Share this position"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-600">Link Copied</span>
                </>
              ) : (
                <>
                  <Share2 className="h-3.5 w-3.5 text-slate-500" />
                  <span>Share Position</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main Column: Header & Detailed Description (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Job Title Card */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                  <Building2 className="h-3 w-3 text-blue-500" />
                  {job.department}
                </span>
                {isRemote && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                    <Sparkles className="h-3 w-3 text-emerald-500" />
                    Remote Eligible
                  </span>
                )}
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200">
                  {job.requisition_code}
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                {job.title}
              </h1>

              <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs font-semibold text-slate-600 border-t border-slate-100 pt-4">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>{job.location}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>{formatEmploymentType(job.employment_type)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>{job.experience_range}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400 ml-auto">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Posted {formatRelativeDate(job.posted_at || job.created_at)}</span>
                </div>
              </div>
            </div>

            {/* Rich Sanitized Description Container */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-4">
              <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-100 flex items-center gap-2">
                <Compass className="h-4 w-4 text-blue-600" />
                <span>Role Overview & Specifications</span>
              </h2>

              {job.description_html ? (
                <div
                  className="job-description prose prose-slate max-w-none text-slate-700 text-sm leading-relaxed space-y-4 font-normal"
                  dangerouslySetInnerHTML={{ __html: job.description_html }}
                />
              ) : (
                <p className="text-xs text-slate-500 italic">No detailed description provided for this opening.</p>
              )}
            </div>

            {/* Candidate Bottom Prompt Card */}
            <div className="rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white p-7 sm:p-8 shadow-xl shadow-blue-600/20 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-xl font-black text-white">
                  Ready to take the next step?
                </h3>
                <p className="text-xs text-blue-100 mt-1 max-w-md font-medium leading-relaxed">
                  Submit your application in 4 straightforward steps using your verified candidate profile.
                </p>
              </div>
              <Link
                href={applyUrl}
                className="shrink-0 inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white text-blue-700 font-extrabold text-xs hover:bg-blue-50 shadow-md transition active:scale-95"
              >
                <span>Apply for this Role</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Sidebar Rail (1/3 width, sticky) */}
          <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-32">
            {/* Overview Card */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-6">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 pb-3 border-b border-slate-100">
                Position Snapshot
              </h2>

              <div className="space-y-4 text-xs font-medium">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-500">Department</span>
                  <span className="font-bold text-slate-900 text-right">{job.department}</span>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-500">Location</span>
                  <span className="font-bold text-slate-900 text-right">{job.location}</span>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-500">Employment Type</span>
                  <span className="font-bold text-slate-900 text-right">
                    {formatEmploymentType(job.employment_type)}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-500">Experience Target</span>
                  <span className="font-bold text-slate-900 text-right">{job.experience_range}</span>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-500">Open Headcount</span>
                  <span className="font-bold text-slate-900 text-right">{job.openings}</span>
                </div>

                {job.hiring_manager && (
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-slate-500">Hiring Lead</span>
                    <span className="font-bold text-slate-900 text-right">{job.hiring_manager}</span>
                  </div>
                )}

                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-500">Date Posted</span>
                  <span className="font-bold text-slate-900 text-right">
                    {formatDate(job.posted_at || job.created_at)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-3 border-t border-slate-100">
                <Link
                  href={applyUrl}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2 text-center active:scale-95"
                >
                  <span>Apply for this Role</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <button
                  type="button"
                  onClick={handleShare}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs transition flex items-center justify-center gap-2 active:scale-95"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-600" />
                      <span className="text-emerald-600">Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="h-3.5 w-3.5 text-slate-500" />
                      <span>Share Position</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Platform Guarantee Badge */}
            <div className="bg-slate-100/90 rounded-3xl p-5 border border-slate-200/80 text-xs text-slate-600 flex items-start gap-3.5 shadow-inner">
              <ShieldCheck className="h-6 w-6 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold text-slate-900 block mb-0.5">Verified Internal Requisition</span>
                <span className="text-slate-500 leading-relaxed font-medium">
                  Applications are routed directly to the hiring manager and recruitment team with zero third-party intermediaries.
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modern Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} TalentBridge Inc. Candidate Sourcing System. All rights reserved.</p>
      </footer>
    </div>
  );
}