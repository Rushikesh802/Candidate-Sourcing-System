'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Job } from '@/types/job';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { formatEmploymentType, formatRelativeDate, copyToClipboard } from '@/lib/formatters';
import {
  MapPin,
  Briefcase,
  Clock,
  Users,
  Share2,
  ArrowRight,
  Sparkles,
  Check,
  Building2,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

interface JobCardProps {
  job: Job;
}

export function JobCard({ job }: JobCardProps) {
  const { user } = useAuth();
  const { success } = useToast();
  const [copied, setCopied] = useState(false);

  // Compute apply URL based on auth status
  const applyUrl =
    user?.role === 'candidate'
      ? `/apply/${job.id}`
      : `/login?next=${encodeURIComponent(`/apply/${job.id}`)}`;

  const isRemote = job.location?.toLowerCase().includes('remote');

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const publicUrl = `${window.location.origin}/jobs/${job.slug}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${job.title} at TalentBridge`,
          text: `Check out this opening for ${job.title} (${job.department}) at TalentBridge!`,
          url: publicUrl,
        });
        return;
      } catch {
        // Fallback to clipboard copy
      }
    }

    const copiedOk = await copyToClipboard(publicUrl);
    if (copiedOk) {
      setCopied(true);
      success('Job link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/5">
      {/* Top Accent Line on Hover */}
      <div className="absolute inset-x-0 -top-px h-[2px] rounded-t-2xl bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div>
        {/* Badges Row */}
        <div className="flex flex-wrap items-center gap-2 mb-3.5">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100/80">
            <Building2 className="h-3 w-3 text-blue-500" />
            {job.department}
          </span>

          {isRemote && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
              <Sparkles className="h-3 w-3 text-emerald-500" />
              Remote
            </span>
          )}

          {job.openings > 1 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200/60">
              <Users className="h-3 w-3 text-slate-500" />
              {job.openings} Openings
            </span>
          )}

          <span className="ml-auto text-[11px] font-medium text-slate-400">
            {formatRelativeDate(job.posted_at || job.created_at)}
          </span>
        </div>

        {/* Job Title */}
        <h3 className="text-lg font-extrabold text-slate-900 tracking-tight leading-snug group-hover:text-blue-600 transition-colors">
          <Link href={`/jobs/${job.slug}`} className="focus:outline-none">
            {job.title}
          </Link>
        </h3>

        {/* Metadata Details */}
        <div className="mt-4 flex flex-wrap items-center gap-y-2 gap-x-4 text-xs font-medium text-slate-600">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-100" title="Location">
            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span>{job.location}</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-100" title="Employment Type">
            <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span>{formatEmploymentType(job.employment_type)}</span>
          </div>

          {job.experience_range && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-100" title="Experience Level">
              <Briefcase className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span>{job.experience_range}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 px-3 py-2 rounded-xl border border-slate-200/80 hover:bg-blue-50/50 transition active:scale-95"
          title="Share job opening"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-emerald-600">Copied</span>
            </>
          ) : (
            <>
              <Share2 className="h-3.5 w-3.5 text-slate-400" />
              <span>Share</span>
            </>
          )}
        </button>

        <div className="flex items-center gap-2">
          <Link
            href={`/jobs/${job.slug}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-slate-900 px-3 py-2 rounded-xl hover:bg-slate-100 transition active:scale-95"
          >
            <span>Details</span>
          </Link>

          <Link
            href={applyUrl}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 px-4 py-2 rounded-xl shadow-sm shadow-blue-500/20 transition-all hover:shadow-md hover:shadow-blue-500/30 active:scale-95"
          >
            <span>Apply Now</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
