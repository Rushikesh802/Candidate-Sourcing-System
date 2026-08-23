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
        // Fallback to clipboard copy if share canceled or not permitted
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
    <div className="group bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 flex flex-col justify-between gap-5">
      <div>
        {/* Top Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
            {job.department}
          </span>
          {isRemote && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
              <Sparkles className="h-3 w-3" />
              Remote
            </span>
          )}
          {job.openings > 1 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
              <Users className="h-3 w-3 text-slate-500" />
              {job.openings} Openings
            </span>
          )}
          <span className="ml-auto text-xs text-slate-400">
            {formatRelativeDate(job.posted_at || job.created_at)}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition tracking-tight">
          <Link href={`/jobs/${job.slug}`} className="hover:underline focus:outline-none">
            {job.title}
          </Link>
        </h3>

        {/* Meta Info Badges */}
        <div className="mt-3.5 flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-slate-600">
          <div className="flex items-center gap-1.5" title="Location">
            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span>{job.location}</span>
          </div>
          <div className="flex items-center gap-1.5" title="Employment Type">
            <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span>{formatEmploymentType(job.employment_type)}</span>
          </div>
          <div className="flex items-center gap-1.5" title="Experience Required">
            <Briefcase className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span>{job.experience_range}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50/60 px-3 py-2 rounded-lg border border-slate-200 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
          title="Share job opening"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-emerald-600 font-semibold">Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="h-3.5 w-3.5 text-slate-500" />
              <span>Share</span>
            </>
          )}
        </button>

        <div className="flex items-center gap-2">
          <Link
            href={`/jobs/${job.slug}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition"
          >
            Details
          </Link>

          <Link
            href={applyUrl}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg shadow-sm hover:shadow transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          >
            <span>Apply Now</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
