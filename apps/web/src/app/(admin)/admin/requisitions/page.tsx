'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Requisition, RequisitionStatus, EMPLOYMENT_TYPE_LABELS } from '@/types/requisition';
import { fetchApi } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { formatDate, formatRelativeDate } from '@/lib/formatters';
import {
  Plus,
  Search,
  Layers,
  Edit,
  Send,
  XCircle,
  Copy,
  ExternalLink,
  Users,
  Building,
  MapPin,
  Clock,
  Briefcase,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  FileCheck,
} from 'lucide-react';

export default function AdminRequisitionsPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'all' | RequisitionStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadRequisitions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchApi<Requisition[] | { items: Requisition[] }>('/api/v1/admin/requisitions');
      if (res.data) {
        const list = Array.isArray(res.data)
          ? res.data
          : Array.isArray((res.data as any).items)
          ? (res.data as any).items
          : [];
        setRequisitions(list);
      } else if (res.error) {
        setError(res.error.message || 'Failed to load requisitions.');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRequisitions();
  }, []);

  // Filter requisitions based on active status tab and search query
  const filteredRequisitions = useMemo(() => {
    return requisitions.filter((req) => {
      if (activeTab !== 'all' && req.status !== activeTab) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = req.title?.toLowerCase().includes(q);
        const matchesCode = req.requisition_code?.toLowerCase().includes(q);
        const matchesDept = req.department?.toLowerCase().includes(q);
        const matchesLoc = req.location?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesCode && !matchesDept && !matchesLoc) {
          return false;
        }
      }
      return true;
    });
  }, [requisitions, activeTab, searchQuery]);

  // Status Counts
  const counts = useMemo(() => {
    return {
      all: requisitions.length,
      published: requisitions.filter((r) => r.status === 'published').length,
      draft: requisitions.filter((r) => r.status === 'draft').length,
      closed: requisitions.filter((r) => r.status === 'closed').length,
    };
  }, [requisitions]);

  // Actions
  const handlePublish = async (id: string) => {
    setActionLoadingId(id);
    try {
      const res = await fetchApi(`/api/v1/admin/requisitions/${id}/publish`, { method: 'POST' });
      if (res.error) {
        toastError(res.error.message || 'Failed to publish requisition');
      } else {
        success('Requisition published successfully!');
        loadRequisitions();
      }
    } catch {
      toastError('Publish action failed');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleClose = async (id: string, code: string) => {
    if (!window.confirm(`Are you sure you want to close requisition ${code}? It will be hidden from the public career portal.`)) {
      return;
    }

    setActionLoadingId(id);
    try {
      const res = await fetchApi(`/api/v1/admin/requisitions/${id}/close`, { method: 'POST' });
      if (res.error) {
        toastError(res.error.message || 'Failed to close requisition');
      } else {
        success('Requisition closed.');
        loadRequisitions();
      }
    } catch {
      toastError('Close action failed');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDuplicate = async (id: string) => {
    setActionLoadingId(id);
    try {
      const res = await fetchApi<Requisition>(`/api/v1/admin/requisitions/${id}/duplicate`, { method: 'POST' });
      if (res.error) {
        toastError(res.error.message || 'Failed to duplicate requisition');
      } else if (res.data) {
        success('Requisition duplicated into a new Draft!');
        loadRequisitions();
      }
    } catch {
      toastError('Duplicate action failed');
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadge = (status: RequisitionStatus) => {
    switch (status) {
      case 'published':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Published
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Draft
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Closed
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-800 shadow-sm">
              <Layers className="h-6 w-6" />
            </div>
            <span>Job Requisitions</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Manage headcount, publish requisitions, and track direct applicant volume.
          </p>
        </div>

        <Link
          href="/admin/requisitions/new"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 transition self-start sm:self-auto active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>Create Requisition</span>
        </Link>
      </div>

      {/* Metric Highlights Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Positions</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{counts.all}</div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Live &amp; Published</span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{counts.published}</div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Draft Headcount</span>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{counts.draft}</div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Archived / Closed</span>
          <div className="text-2xl font-black text-slate-600 dark:text-slate-300 mt-1">{counts.closed}</div>
        </div>
      </div>

      {/* Tabs & Search Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 dark:bg-slate-800/80 rounded-xl overflow-x-auto">
            {(
              [
                { id: 'all', label: 'All Jobs', count: counts.all },
                { id: 'published', label: 'Published', count: counts.published },
                { id: 'draft', label: 'Drafts', count: counts.draft },
                { id: 'closed', label: 'Closed', count: counts.closed },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full ${
                    activeTab === tab.id
                      ? 'bg-blue-50 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-extrabold'
                      : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search code, title, department..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-800 text-slate-900 dark:text-white transition"
            />
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 flex items-center gap-3 text-xs font-semibold">
          <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Requisitions Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800/90 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center">
            <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Loading requisitions...</p>
          </div>
        ) : filteredRequisitions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-4 px-5">Code</th>
                  <th className="py-4 px-5">Role Title &amp; Dept</th>
                  <th className="py-4 px-5">Location / Type</th>
                  <th className="py-4 px-5">Experience / Headcount</th>
                  <th className="py-4 px-5 text-center">Applicants</th>
                  <th className="py-4 px-5">Status</th>
                  <th className="py-4 px-5">Posted Date</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredRequisitions.map((req) => (
                  <tr key={req.id} className="hover:bg-blue-50/30 dark:hover:bg-slate-800/40 transition-colors">
                    {/* Code */}
                    <td className="py-4 px-5 font-mono font-bold text-slate-700 dark:text-slate-300">
                      <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        {req.requisition_code}
                      </span>
                    </td>

                    {/* Title & Dept */}
                    <td className="py-4 px-5">
                      <div className="font-extrabold text-slate-900 dark:text-white text-sm hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        <Link href={`/admin/requisitions/${req.id}/edit`}>
                          {req.title}
                        </Link>
                      </div>
                      <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                        {req.department} &middot; <span className="text-slate-400 dark:text-slate-500">Lead:</span> {req.hiring_manager}
                      </div>
                    </td>

                    {/* Location / Type */}
                    <td className="py-4 px-5 text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        <span>{req.location}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {EMPLOYMENT_TYPE_LABELS[req.employment_type] || req.employment_type}
                      </div>
                    </td>

                    {/* Experience / Openings */}
                    <td className="py-4 px-5 text-slate-600 dark:text-slate-300">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{req.experience_range}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {req.openings} {req.openings === 1 ? 'opening' : 'openings'}
                      </div>
                    </td>

                    {/* Application Count */}
                    <td className="py-4 px-5 text-center">
                      <Link
                        href={`/admin/requisitions/${req.id}/applications`}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition shadow-sm"
                        title="View Applicants"
                      >
                        <Users className="h-3 w-3" />
                        <span>{req.applications_count ?? 0}</span>
                      </Link>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-5">{getStatusBadge(req.status)}</td>

                    {/* Posted Date */}
                    <td className="py-4 px-5 text-slate-500 dark:text-slate-400 text-[11px]">
                      {req.posted_at ? formatDate(req.posted_at) : <span className="italic text-slate-400 dark:text-slate-500">Draft only</span>}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* View Applicants Grid */}
                        <Link
                          href={`/admin/requisitions/${req.id}/applications`}
                          className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition"
                          title="View applicants"
                        >
                          <Users className="h-4 w-4" />
                        </Link>

                        {/* View Public Page Link (if published) */}
                        {req.status === 'published' && (
                          <Link
                            href={`/jobs/${req.slug}`}
                            target="_blank"
                            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition"
                            title="View public posting"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        )}

                        {/* Edit */}
                        <Link
                          href={`/admin/requisitions/${req.id}/edit`}
                          className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title="Edit requisition"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>

                        {/* Publish (for Drafts) */}
                        {req.status === 'draft' && (
                          <button
                            onClick={() => handlePublish(req.id)}
                            disabled={actionLoadingId === req.id}
                            className="p-2 rounded-xl text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 transition disabled:opacity-50"
                            title="Publish immediately"
                          >
                            <Send className="h-4 w-4" />
                          </button>
                        )}

                        {/* Close (for Published) */}
                        {req.status === 'published' && (
                          <button
                            onClick={() => handleClose(req.id, req.requisition_code)}
                            disabled={actionLoadingId === req.id}
                            className="p-2 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/60 transition disabled:opacity-50"
                            title="Close requisition"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}

                        {/* Duplicate */}
                        <button
                          onClick={() => handleDuplicate(req.id)}
                          disabled={actionLoadingId === req.id}
                          className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/60 transition disabled:opacity-50"
                          title="Duplicate into new draft"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Empty State */
          <div className="p-16 text-center max-w-sm mx-auto space-y-3">
            <div className="h-14 w-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto border border-blue-100 dark:border-blue-800 shadow-inner">
              <Layers className="h-7 w-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No requisitions found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              {searchQuery || activeTab !== 'all'
                ? 'No requisitions match your filter criteria.'
                : 'Get started by creating your first job requisition.'}
            </p>
            <Link
              href="/admin/requisitions/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Create Requisition</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}