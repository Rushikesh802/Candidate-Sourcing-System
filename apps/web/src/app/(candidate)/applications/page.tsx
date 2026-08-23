'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { fetchApi } from '@/lib/api';
import { ApplicationItem, ApplicationDetail, ApplicationStatus } from '@/types/application';
import { formatDate, formatDateTime } from '@/lib/formatters';
import {
  Briefcase,
  MapPin,
  Calendar,
  Building,
  FileText,
  Download,
  ExternalLink,
  Loader2,
  AlertCircle,
  Clock,
  CheckCircle,
  Eye,
  X,
} from 'lucide-react';

const STATUS_BADGES: Record<ApplicationStatus, { label: string; bg: string; text: string }> = {
  draft: { label: 'Draft', bg: 'bg-slate-100', text: 'text-slate-700' },
  new: { label: 'Received — Under Review', bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
  reviewed: { label: 'Under Evaluation', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
  shortlisted: { label: 'Shortlisted', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
  rejected: { label: 'Not Selected', bg: 'bg-red-50 border-red-200', text: 'text-red-700' },
};

export default function MyApplicationsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Snapshot modal
  const [selectedApp, setSelectedApp] = useState<ApplicationDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  useEffect(() => {
    async function loadApplications() {
      if (!user) return;
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetchApi<ApplicationItem[]>('/api/v1/me/applications');
        if (res.error) {
          setError(res.error.message);
        } else if (res.data) {
          setApplications(res.data);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load applications');
      } finally {
        setIsLoading(false);
      }
    }

    loadApplications();
  }, [user]);

  const handleOpenDetail = async (appId: string) => {
    setIsLoadingDetail(true);
    try {
      const res = await fetchApi<ApplicationDetail>(`/api/v1/me/applications/${appId}`);
      if (res.data) {
        setSelectedApp(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Loading your applications...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              My Job Applications
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Track the progress, status, and frozen snapshot of your submitted applications.
            </p>
          </div>
          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition shadow-sm self-start sm:self-auto"
          >
            <Briefcase className="h-4 w-4" />
            Explore More Openings
          </Link>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Applications List */}
        {applications.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center space-y-4 shadow-sm">
            <div className="h-16 w-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <FileText className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">No Applications Submitted Yet</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                Explore our published job requisitions and submit your application with a single click.
              </p>
            </div>
            <Link
              href="/jobs"
              className="inline-block px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition shadow-sm"
            >
              Browse Active Jobs
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => {
              const statusCfg = STATUS_BADGES[app.status] || STATUS_BADGES.new;

              return (
                <div
                  key={app.id}
                  className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:border-blue-200 transition flex flex-col md:flex-row md:items-center justify-between gap-5"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
                        {app.application_code}
                      </span>
                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${statusCfg.bg} ${statusCfg.text}`}
                      >
                        {statusCfg.label}
                      </span>
                    </div>

                    <div>
                      <Link
                        href={`/jobs/${app.requisition_slug}`}
                        className="text-lg font-bold text-slate-900 hover:text-blue-600 transition inline-flex items-center gap-1.5"
                      >
                        {app.requisition_title}
                        <ExternalLink className="h-4 w-4 text-slate-400" />
                      </Link>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">
                        Job Code: {app.requisition_code}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                      <span className="flex items-center gap-1">
                        <Building className="h-3.5 w-3.5 text-slate-400" />
                        {app.department}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        {app.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        Applied on {app.submitted_at ? formatDate(app.submitted_at) : formatDate(app.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0">
                    <button
                      onClick={() => handleOpenDetail(app.id)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition shadow-sm"
                    >
                      <Eye className="h-3.5 w-3.5 text-slate-500" />
                      View Application
                    </button>

                    <a
                      href={`/api/v1/files/resumes/${app.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Resume
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Application Detail / Snapshot Modal */}
        {selectedApp && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {selectedApp.application_code}
                  </span>
                  <h2 className="text-xl font-bold text-slate-900 mt-1">
                    {selectedApp.requisition_title}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedApp(null)}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Status and Submission info */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Status</span>
                  <span className="font-bold text-blue-700">
                    {STATUS_BADGES[selectedApp.status]?.label || selectedApp.status}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Submitted At</span>
                  <span className="font-semibold text-slate-800">
                    {selectedApp.submitted_at
                      ? formatDateTime(selectedApp.submitted_at)
                      : formatDateTime(selectedApp.created_at)}
                  </span>
                </div>
                <div>
                  <a
                    href={`/api/v1/files/resumes/${selectedApp.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download Resume
                  </a>
                </div>
              </div>

              {/* Cover note if present */}
              {selectedApp.cover_note && (
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Cover Note
                  </h4>
                  <p className="text-xs text-slate-600 p-3.5 rounded-xl bg-slate-50 border border-slate-200 whitespace-pre-wrap">
                    {selectedApp.cover_note}
                  </p>
                </div>
              )}

              {/* Frozen Snapshot Details */}
              {selectedApp.snapshot_json && (
                <div className="space-y-4 pt-2 border-t border-slate-200">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Submitted Profile Snapshot (Frozen at Submission)
                  </h4>

                  {/* Candidate Bio */}
                  {selectedApp.snapshot_json.candidate && (
                    <div className="grid grid-cols-2 gap-3 text-xs p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <div>
                        <span className="text-slate-400 block">Name</span>
                        <span className="font-semibold text-slate-800">
                          {selectedApp.snapshot_json.candidate.first_name}{' '}
                          {selectedApp.snapshot_json.candidate.last_name}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Email</span>
                        <span className="font-semibold text-slate-800">
                          {selectedApp.snapshot_json.candidate.email}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Mobile</span>
                        <span className="font-semibold text-slate-800">
                          {selectedApp.snapshot_json.candidate.mobile}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Total Experience</span>
                        <span className="font-semibold text-slate-800">
                          {selectedApp.snapshot_json.profile?.is_fresher
                            ? 'Fresher'
                            : `${selectedApp.snapshot_json.total_experience_years || 0} Years`}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Educations */}
                  {selectedApp.snapshot_json.educations &&
                    selectedApp.snapshot_json.educations.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-slate-700">Education</p>
                        <div className="space-y-2">
                          {selectedApp.snapshot_json.educations.map((edu, idx) => (
                            <div
                              key={idx}
                              className="p-3 rounded-lg border border-slate-200 bg-white text-xs flex justify-between items-center"
                            >
                              <div>
                                <span className="font-bold text-slate-900">{edu.degree}</span>
                                <p className="text-slate-500">{edu.institution}</p>
                              </div>
                              <span className="font-medium text-slate-600">{edu.year_of_passing}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Experiences */}
                  {selectedApp.snapshot_json.experiences &&
                    selectedApp.snapshot_json.experiences.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-slate-700">Work Experience</p>
                        <div className="space-y-2">
                          {selectedApp.snapshot_json.experiences.map((exp, idx) => (
                            <div
                              key={idx}
                              className="p-3 rounded-lg border border-slate-200 bg-white text-xs flex justify-between items-center"
                            >
                              <div>
                                <span className="font-bold text-slate-900">{exp.job_title}</span>
                                <p className="text-slate-500">{exp.employer}</p>
                              </div>
                              <span className="font-medium text-slate-600">
                                {exp.start_date} → {exp.is_current ? 'Present' : exp.end_date}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 flex justify-end">
                <button
                  onClick={() => setSelectedApp(null)}
                  className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
