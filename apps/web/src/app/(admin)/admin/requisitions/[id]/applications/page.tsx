'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchApi } from '@/lib/api';
import { AdminApplicationListItem, ApplicationStatus } from '@/types/application';
import { Requisition } from '@/types/requisition';
import {
  ArrowLeft,
  Search,
  Filter,
  Download,
  Eye,
  FileText,
  Briefcase,
  MapPin,
  Calendar,
  Mail,
  Phone,
  User,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
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
    label: 'New',
    bg: 'bg-blue-50 dark:bg-blue-950/60',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
    icon: SparklesIcon,
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

function SparklesIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  );
}

export default function RequisitionApplicationsPage() {
  const params = useParams();
  const router = useRouter();
  const requisitionId = params?.id as string;

  const [requisition, setRequisition] = useState<Requisition | null>(null);
  const [applications, setApplications] = useState<AdminApplicationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Resume preview modal
  const [previewResumeApp, setPreviewResumeApp] = useState<AdminApplicationListItem | null>(null);

  const loadData = useCallback(async () => {
    if (!requisitionId) return;
    setIsLoading(true);
    try {
      const [reqRes, appsRes] = await Promise.all([
        fetchApi<Requisition>(`/api/v1/admin/requisitions/${requisitionId}`),
        fetchApi<AdminApplicationListItem[]>(`/api/v1/admin/requisitions/${requisitionId}/applications`),
      ]);

      if (reqRes.data) {
        setRequisition(reqRes.data);
      }
      if (appsRes.data) {
        setApplications(appsRes.data);
      }
    } catch (err) {
      console.error('Failed to load requisition applications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [requisitionId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStatusChange = async (appId: string, newStatus: ApplicationStatus) => {
    setIsUpdatingStatus(appId);
    setFeedbackMsg(null);
    try {
      const res = await fetchApi(`/api/v1/admin/applications/${appId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.error) {
        setFeedbackMsg({
          type: 'error',
          text: res.error.message || 'Failed to update application status',
        });
      } else {
        setApplications((prev) =>
          prev.map((app) => (app.id === appId ? { ...app, status: newStatus } : app))
        );
        setFeedbackMsg({
          type: 'success',
          text: `Status updated to ${STATUS_CONFIG[newStatus].label}`,
        });
        setTimeout(() => setFeedbackMsg(null), 4000);
      }
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: 'Network error updating status' });
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  const handleExportCSV = () => {
    const params = new URLSearchParams();
    params.append('requisition_id', requisitionId);
    if (statusFilter !== 'all') params.append('status', statusFilter);
    if (searchQuery.trim()) params.append('q', searchQuery.trim());

    const url = `/api/v1/admin/applications/export?${params.toString()}`;
    window.open(url, '_blank');
  };

  // Filter applications by search query and status
  const filteredApplications = applications.filter((app) => {
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      app.candidate_name.toLowerCase().includes(q) ||
      app.candidate_email.toLowerCase().includes(q) ||
      app.application_code.toLowerCase().includes(q) ||
      (app.candidate_location && app.candidate_location.toLowerCase().includes(q));

    return matchesStatus && matchesSearch;
  });

  const counts = {
    all: applications.length,
    new: applications.filter((a) => a.status === 'new').length,
    reviewed: applications.filter((a) => a.status === 'reviewed').length,
    shortlisted: applications.filter((a) => a.status === 'shortlisted').length,
    rejected: applications.filter((a) => a.status === 'rejected').length,
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/requisitions"
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition active:scale-95"
            title="Back to Requisitions"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {requisition ? requisition.title : 'Applicant Review Grid'}
              </h1>
              {requisition && (
                <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {requisition.requisition_code}
                </span>
              )}
            </div>
            {requisition && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-3 flex-wrap">
                <span>{requisition.department}</span>
                <span>&bull;</span>
                <span>{requisition.location}</span>
                <span>&bull;</span>
                <span className="capitalize">{requisition.employment_type.replace('_', ' ')}</span>
                <span>&bull;</span>
                <span>{requisition.openings} Openings</span>
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm active:scale-95"
            title="Refresh list"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={applications.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/60 transition shadow-sm disabled:opacity-50 disabled:pointer-events-none active:scale-95"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast Banner */}
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

      {/* Filters and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-sm p-4 space-y-3">
        {/* Status Pill Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All Candidates ({counts.all})
          </button>
          <button
            onClick={() => setStatusFilter('new')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition whitespace-nowrap ${
              statusFilter === 'new'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60'
            }`}
          >
            New ({counts.new})
          </button>
          <button
            onClick={() => setStatusFilter('reviewed')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition whitespace-nowrap ${
              statusFilter === 'reviewed'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60'
            }`}
          >
            Under Review ({counts.reviewed})
          </button>
          <button
            onClick={() => setStatusFilter('shortlisted')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition whitespace-nowrap ${
              statusFilter === 'shortlisted'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
            }`}
          >
            Shortlisted ({counts.shortlisted})
          </button>
          <button
            onClick={() => setStatusFilter('rejected')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition whitespace-nowrap ${
              statusFilter === 'rejected'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60'
            }`}
          >
            Rejected ({counts.rejected})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by candidate name, email, application ID, or location..."
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Applications Grid Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800/90 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <RefreshCw className="h-8 w-8 animate-spin mb-3 text-blue-600 dark:text-blue-400" />
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Loading applicant data...</p>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="py-16 text-center px-4 space-y-3">
            <div className="h-14 w-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto border border-blue-100 dark:border-blue-800 shadow-inner">
              <User className="h-7 w-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No applicants found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              {applications.length === 0
                ? 'No candidates have submitted an application for this requisition yet.'
                : 'No candidate applications matched your current search or status filters.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-5">Candidate</th>
                  <th className="py-4 px-5">Experience</th>
                  <th className="py-4 px-5">Location</th>
                  <th className="py-4 px-5">Applied On</th>
                  <th className="py-4 px-5">Resume</th>
                  <th className="py-4 px-5">Status</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                {filteredApplications.map((app) => {
                  const statusInfo = STATUS_CONFIG[app.status] || STATUS_CONFIG.new;
                  const isPending = isUpdatingStatus === app.id;

                  return (
                    <tr
                      key={app.id}
                      className="hover:bg-blue-50/30 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Candidate Name & Info */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
                            {app.candidate_name.charAt(0).toUpperCase() || 'C'}
                          </div>
                          <div>
                            <Link
                              href={`/admin/applications/${app.id}`}
                              className="font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition block text-sm"
                            >
                              {app.candidate_name}
                            </Link>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                              <span>{app.candidate_email}</span>
                              <span>&bull;</span>
                              <span className="font-mono">{app.application_code}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Experience */}
                      <td className="py-4 px-5">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {app.total_experience_years > 0
                            ? `${app.total_experience_years} yrs`
                            : 'Fresher'}
                        </span>
                      </td>

                      {/* Location */}
                      <td className="py-4 px-5 text-slate-600 dark:text-slate-400">
                        {app.candidate_location || 'Not specified'}
                      </td>

                      {/* Applied On */}
                      <td className="py-4 px-5 text-slate-500 dark:text-slate-400">
                        {app.submitted_at
                          ? new Date(app.submitted_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : new Date(app.created_at).toLocaleDateString()}
                      </td>

                      {/* Resume Action */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setPreviewResumeApp(app)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition"
                            title="Preview Resume"
                          >
                            <Eye className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                            <span>View</span>
                          </button>
                          <a
                            href={app.resume_url}
                            download={app.resume_filename || 'resume.pdf'}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            title="Download Resume file"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      </td>

                      {/* Status Selector */}
                      <td className="py-4 px-5">
                        <div className="relative inline-block">
                          <select
                            value={app.status}
                            disabled={isPending}
                            onChange={(e) =>
                              handleStatusChange(app.id, e.target.value as ApplicationStatus)
                            }
                            className={`appearance-none text-xs font-bold pl-2.5 pr-7 py-1 rounded-full border cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                              statusInfo.bg
                            } ${statusInfo.text} ${statusInfo.border} ${
                              isPending ? 'opacity-50 animate-pulse' : ''
                            }`}
                          >
                            <option value="new">New</option>
                            <option value="reviewed">Under Review</option>
                            <option value="shortlisted">Shortlisted</option>
                            <option value="rejected">Rejected</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronRight className="h-3 w-3 rotate-90 text-current opacity-70" />
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <Link
                          href={`/admin/applications/${app.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white font-semibold transition shadow-sm active:scale-95"
                        >
                          <span>Review</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Resume Preview Modal */}
      {previewResumeApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-800">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {previewResumeApp.candidate_name} &mdash; Resume
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    {previewResumeApp.resume_filename || 'Candidate Resume'} &bull; {previewResumeApp.application_code}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={previewResumeApp.resume_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm active:scale-95"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Open Tab</span>
                </a>
                <a
                  href={previewResumeApp.resume_url}
                  download={previewResumeApp.resume_filename || 'resume.pdf'}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition shadow-sm active:scale-95"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download</span>
                </a>
                <button
                  onClick={() => setPreviewResumeApp(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition ml-2"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Body / Viewer */}
            <div className="flex-1 bg-slate-100 dark:bg-slate-950 relative">
              <iframe
                src={`${previewResumeApp.resume_url}#toolbar=0`}
                className="w-full h-full border-0"
                title="Resume Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
