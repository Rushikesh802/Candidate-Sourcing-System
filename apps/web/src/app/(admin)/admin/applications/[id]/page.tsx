'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchApi } from '@/lib/api';
import { AdminApplicationDetail, ApplicationStatus } from '@/types/application';
import {
  ArrowLeft,
  Briefcase,
  GraduationCap,
  FileText,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  Download,
  ExternalLink,
  ShieldCheck,
  User,
  Sparkles,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  X,
} from 'lucide-react';

const STATUS_CONFIG: Record<
  ApplicationStatus,
  { label: string; bg: string; text: string; border: string; icon: any }
> = {
  draft: {
    label: 'Draft',
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-300 dark:border-slate-700',
    icon: Clock,
  },
  new: {
    label: 'New Application',
    bg: 'bg-blue-50 dark:bg-blue-950/60',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
    icon: Sparkles,
  },
  reviewed: {
    label: 'Under Review',
    bg: 'bg-purple-50 dark:bg-purple-950/60',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800',
    icon: Clock,
  },
  shortlisted: {
    label: 'Shortlisted',
    bg: 'bg-emerald-50 dark:bg-emerald-950/60',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
    icon: CheckCircle2,
  },
  rejected: {
    label: 'Rejected',
    bg: 'bg-rose-50 dark:bg-rose-950/60',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-800',
    icon: XCircle,
  },
};

export default function AdminApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params?.id as string;

  const [application, setApplication] = useState<AdminApplicationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadApplication = useCallback(async () => {
    if (!applicationId) return;
    setIsLoading(true);
    try {
      const res = await fetchApi<AdminApplicationDetail>(`/api/v1/admin/applications/${applicationId}`);
      if (res.data) {
        setApplication(res.data);
      } else if (res.error) {
        setFeedbackMsg({ type: 'error', text: res.error.message || 'Application not found' });
      }
    } catch (err) {
      console.error('Error fetching application detail:', err);
    } finally {
      setIsLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    loadApplication();
  }, [loadApplication]);

  const handleStatusChange = async (newStatus: ApplicationStatus) => {
    if (!application || application.status === newStatus) return;
    setIsUpdatingStatus(true);
    setFeedbackMsg(null);
    try {
      const res = await fetchApi<AdminApplicationDetail>(
        `/api/v1/admin/applications/${applicationId}/status`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (res.data) {
        setApplication(res.data);
        setFeedbackMsg({
          type: 'success',
          text: `Application status updated to ${STATUS_CONFIG[newStatus].label}`,
        });
        setTimeout(() => setFeedbackMsg(null), 4000);
      } else if (res.error) {
        setFeedbackMsg({
          type: 'error',
          text: res.error.message || 'Failed to update status',
        });
      }
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: 'Network error updating status' });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-400">
        <RefreshCw className="h-8 w-8 animate-spin mb-3 text-blue-600" />
        <p className="text-xs font-semibold">Loading full application record...</p>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center max-w-lg mx-auto">
        <AlertCircle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900">Application Record Not Found</h2>
        <p className="text-xs text-slate-500 mt-1 mb-6">
          The requested application ID does not exist or has been removed.
        </p>
        <Link
          href="/admin/applications"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to All Applications</span>
        </Link>
      </div>
    );
  }

  const snapshot: any = application.snapshot_json || {};
  const candSnapshot: any = snapshot.candidate || {};
  const profSnapshot: any = snapshot.profile || {};
  const educations: any[] = snapshot.educations || [];
  const experiences: any[] = snapshot.experiences || [];
  const statusInfo = STATUS_CONFIG[application.status] || STATUS_CONFIG.new;
  const StatusIcon = statusInfo.icon;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition active:scale-95"
            title="Go Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {application.application_code}
              </span>
              <span className="text-slate-400 dark:text-slate-600">&bull;</span>
              <Link
                href={`/admin/requisitions/${application.requisition_id}/applications`}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <span>{application.requisition.title}</span>
                <span className="text-slate-400 dark:text-slate-500 font-mono">({application.requisition.requisition_code})</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <a
            href={application.resume_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm active:scale-95"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Open Resume</span>
          </a>
          <a
            href={application.resume_url}
            download={application.resume_filename || 'candidate_resume.pdf'}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition shadow-sm active:scale-95"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download Resume</span>
          </a>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between border ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
          }`}
        >
          <span>{feedbackMsg.text}</span>
          <button onClick={() => setFeedbackMsg(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Hero Candidate Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800/90 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Candidate Profile Summary */}
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
              {application.candidate_name.charAt(0).toUpperCase() || 'C'}
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {application.candidate_name}
              </h1>
              <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-300 mt-1 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                  <a href={`mailto:${application.candidate_email}`} className="hover:text-blue-600 dark:hover:text-blue-400 transition">
                    {application.candidate_email}
                  </a>
                </span>
                {application.candidate_mobile && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                    <a href={`tel:${application.candidate_mobile}`} className="hover:text-blue-600 dark:hover:text-blue-400 transition">
                      {application.candidate_mobile}
                    </a>
                  </span>
                )}
                {application.candidate_location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                    <span>{application.candidate_location}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Status Changer Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-slate-50 dark:bg-slate-800/70 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="text-xs">
              <span className="text-slate-400 dark:text-slate-400 font-semibold block text-[10px] uppercase tracking-wider">
                Application Status
              </span>
              <span className={`inline-flex items-center gap-1 font-bold ${statusInfo.text}`}>
                <StatusIcon className="h-3.5 w-3.5" />
                <span>{statusInfo.label}</span>
              </span>
            </div>

            <div className="h-6 w-[1px] bg-slate-300 dark:bg-slate-700 hidden sm:block" />

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                disabled={isUpdatingStatus || application.status === 'new'}
                onClick={() => handleStatusChange('new')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
                  application.status === 'new'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                New
              </button>
              <button
                disabled={isUpdatingStatus || application.status === 'reviewed'}
                onClick={() => handleStatusChange('reviewed')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
                  application.status === 'reviewed'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                Under Review
              </button>
              <button
                disabled={isUpdatingStatus || application.status === 'shortlisted'}
                onClick={() => handleStatusChange('shortlisted')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
                  application.status === 'shortlisted'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                Shortlist
              </button>
              <button
                disabled={isUpdatingStatus || application.status === 'rejected'}
                onClick={() => handleStatusChange('rejected')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
                  application.status === 'rejected'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Detailed Profile Snapshot */}
        <div className="lg:col-span-7 space-y-6">
          {/* Cover Note (if provided) */}
          {application.cover_note && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 p-5 sm:p-6 shadow-sm space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span>Candidate Cover Note</span>
              </h3>
              <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800 italic">
                &ldquo;{application.cover_note}&rdquo;
              </p>
            </div>
          )}

          {/* Personal & Professional Profile */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 p-5 sm:p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-3">
              <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>Personal & Contact Bio-Data</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400 dark:text-slate-500 text-[11px] block">Current Location</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {profSnapshot.current_location || 'Not provided'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 text-[11px] block">Notice Period</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                  {profSnapshot.notice_period
                    ? `${profSnapshot.notice_period.replace('_', ' ')} days`
                    : 'Not specified'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 text-[11px] block">Candidate Type</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {profSnapshot.is_fresher ? 'Fresher (Entry Level)' : 'Experienced Professional'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 text-[11px] block">Total Experience</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {application.total_experience_years > 0
                    ? `${application.total_experience_years} years`
                    : '0 years'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 text-[11px] block">Current Company</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {profSnapshot.current_company || 'None'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 text-[11px] block">Gender</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                  {profSnapshot.gender || 'Not specified'}
                </span>
              </div>
            </div>

            {profSnapshot.current_address && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                <span className="text-slate-400 dark:text-slate-500 text-[11px] block">Residential Address</span>
                <span className="text-slate-700 dark:text-slate-300">{profSnapshot.current_address}</span>
              </div>
            )}
          </div>

          {/* Education History */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 p-5 sm:p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-3">
              <GraduationCap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>Educational Qualifications ({educations.length})</span>
            </h3>

            {educations.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 italic">No education entries recorded.</p>
            ) : (
              <div className="space-y-3">
                {educations.map((edu: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 text-xs flex items-start justify-between gap-3"
                  >
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">{edu.degree}</h4>
                      {edu.specialization && (
                        <p className="text-slate-600 dark:text-slate-300 font-medium">{edu.specialization}</p>
                      )}
                      <p className="text-slate-500 dark:text-slate-400 mt-0.5">{edu.institution}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                        Class of {edu.year_of_passing}
                      </span>
                      {edu.grade && (
                        <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                          Grade: {edu.grade}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Work Experience */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 p-5 sm:p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Briefcase className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>Work Experience ({experiences.length})</span>
            </h3>

            {profSnapshot.is_fresher ? (
              <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-800 text-xs text-blue-800 dark:text-blue-300">
                Candidate registered as a <strong>Fresher</strong> without prior formal full-time experience.
              </div>
            ) : experiences.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 italic">No experience records found.</p>
            ) : (
              <div className="space-y-4">
                {experiences.map((exp: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 text-xs space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">{exp.job_title}</h4>
                        <p className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5 text-slate-400" />
                          <span>{exp.employer}</span>
                        </p>
                      </div>
                      <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                        {exp.start_date ? new Date(exp.start_date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : 'N/A'}
                        {' &ndash; '}
                        {exp.is_current ? (
                          <span className="text-emerald-700 dark:text-emerald-400 font-bold">Present</span>
                        ) : exp.end_date ? (
                          new Date(exp.end_date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
                        ) : (
                          'N/A'
                        )}
                      </span>
                    </div>

                    {exp.responsibilities && (
                      <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                        {exp.responsibilities}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Declarations & Snapshot Integrity */}
          <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 text-xs text-slate-600 dark:text-slate-400 space-y-2">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Application Integrity &amp; Consents</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Accuracy Declaration Confirmed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Privacy Consent Acknowledged</span>
              </div>
            </div>
            {snapshot.frozen_at && (
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono pt-1">
                Data snapshot frozen at: {new Date(snapshot.frozen_at).toLocaleString()}
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Embedded Resume Viewer & Requisition Context */}
        <div className="lg:col-span-5 space-y-6">
          {/* Resume Preview Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-sm overflow-hidden flex flex-col h-[650px]">
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {application.resume_filename || 'Resume Document'}
                </span>
              </div>
              <a
                href={application.resume_url}
                download={application.resume_filename || 'resume.pdf'}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                title="Download Resume"
              >
                <Download className="h-4 w-4" />
              </a>
            </div>

            <div className="flex-1 bg-slate-100 dark:bg-slate-950 relative">
              <iframe
                src={`${application.resume_url}#toolbar=0`}
                className="w-full h-full border-0"
                title="Resume Preview"
              />
            </div>
          </div>

          {/* Requisition Context Summary */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 p-5 sm:p-6 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <Briefcase className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>Associated Requisition</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div>
                <Link
                  href={`/admin/requisitions/${application.requisition_id}/applications`}
                  className="font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 block text-sm transition"
                >
                  {application.requisition.title}
                </Link>
                <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                  {application.requisition.requisition_code}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] text-slate-600 dark:text-slate-400">
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block">Department</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{application.requisition.department}</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block">Location</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{application.requisition.location}</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block">Type</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                    {application.requisition.employment_type.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block">Requisition Status</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                    {application.requisition.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <Link
                href={`/admin/requisitions/${application.requisition_id}/applications`}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition active:scale-95"
              >
                <span>View All Applicants for this Requisition</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
