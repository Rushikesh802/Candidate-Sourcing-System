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
          <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
            <div className="h-16 w-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-100">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Job Not Found or No Longer Available
            </h1>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              The position you are looking for has either expired, been closed, or does not exist.
            </p>
            <div className="flex flex-col gap-3">
              <Link
                href="/jobs"
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition shadow-sm inline-flex items-center justify-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Browse All Open Roles</span>
              </Link>
            </div>
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
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header />

      {/* Top Breadcrumbs & Action Bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <Link
            href="/jobs"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to All Openings</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-slate-200 transition"
              title="Share this position"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-600">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="h-3.5 w-3.5 text-slate-500" />
                  <span>Share</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main Column: Job Header + Description (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Header Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                  {job.department}
                </span>
                {isRemote && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                    <Sparkles className="h-3 w-3" />
                    Remote Eligible
                  </span>
                )}
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-mono font-medium bg-slate-100 text-slate-600">
                  {job.requisition_code}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-4">
                {job.title}
              </h1>

              <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-sm text-slate-600 border-t border-slate-100 pt-4">
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
                <div className="flex items-center gap-1.5 text-xs text-slate-400 ml-auto">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Posted {formatRelativeDate(job.posted_at || job.created_at)}</span>
                </div>
              </div>
            </div>

            {/* Rich Sanitized Description Container */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
                Position Description
              </h2>

              {job.description_html ? (
                <div
                  className="job-description prose prose-slate max-w-none text-slate-700 leading-relaxed space-y-4"
                  dangerouslySetInnerHTML={{ __html: job.description_html }}
                />
              ) : (
                <p className="text-slate-500 italic">No detailed description provided for this opening.</p>
              )}
            </div>

            {/* Candidate Bottom Prompt */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Ready to apply for this role?
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Submit your application in just a few quick steps with your resume and profile.
                </p>
              </div>
              <Link
                href={applyUrl}
                className="shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 shadow-sm transition"
              >
                <span>Apply for this Position</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Sidebar / Overview Rail (1/3 width, sticky) */}
          <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-20">
            {/* Overview Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
                Job Overview
              </h2>

              <div className="space-y-4 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Building2 className="h-4 w-4 text-slate-400" />
                    <span>Department</span>
                  </div>
                  <span className="font-semibold text-slate-800 text-right">{job.department}</span>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 text-slate-500">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span>Location</span>
                  </div>
                  <span className="font-semibold text-slate-800 text-right">{job.location}</span>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <span>Employment Type</span>
                  </div>
                  <span className="font-semibold text-slate-800 text-right">
                    {formatEmploymentType(job.employment_type)}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Briefcase className="h-4 w-4 text-slate-400" />
                    <span>Experience</span>
                  </div>
                  <span className="font-semibold text-slate-800 text-right">{job.experience_range}</span>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Users className="h-4 w-4 text-slate-400" />
                    <span>Total Openings</span>
                  </div>
                  <span className="font-semibold text-slate-800 text-right">{job.openings}</span>
                </div>

                {job.hiring_manager && (
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 text-slate-500">
                      <UserCheck className="h-4 w-4 text-slate-400" />
                      <span>Hiring Manager</span>
                    </div>
                    <span className="font-semibold text-slate-800 text-right">{job.hiring_manager}</span>
                  </div>
                )}

                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span>Posted Date</span>
                  </div>
                  <span className="font-semibold text-slate-800 text-right">
                    {formatDate(job.posted_at || job.created_at)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <Link
                  href={applyUrl}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 shadow-sm transition flex items-center justify-center gap-2 text-center"
                >
                  <span>Apply for this Position</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <button
                  type="button"
                  onClick={handleShare}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition flex items-center justify-center gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-600" />
                      <span className="text-emerald-600">Link Copied to Clipboard!</span>
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

            {/* Platform Guarantee badge */}
            <div className="bg-slate-100/80 rounded-2xl p-4 border border-slate-200 text-xs text-slate-600 flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-800 block mb-0.5">TalentBridge Verified</span>
                <span>Applications are directly submitted to the internal recruitment team.</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 px-4 text-center text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} TalentBridge Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}
