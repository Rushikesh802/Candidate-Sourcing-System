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
      draft: requisitions.filter((r) => r.status === 'draft').length,
      published: requisitions.filter((r) => r.status === 'published').length,
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
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Published
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Draft
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            Closed
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Layers className="h-7 w-7 text-blue-600" />
            <span>Job Requisitions</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Create, manage, publish, and monitor recruitment requisitions across departments.
          </p>
        </div>

        <Link
          href="/admin/requisitions/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition shadow-sm hover:shadow self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Create Requisition</span>
        </Link>
      </div>

      {/* Tabs & Search Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto">
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
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  activeTab === tab.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700 font-bold'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search code, title, department..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 hover:bg-white focus:bg-white transition"
            />
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-3 text-sm">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Requisitions Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs text-slate-500">Loading requisitions...</p>
          </div>
        ) : filteredRequisitions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">Code</th>
                  <th className="py-3.5 px-4">Role Title & Dept</th>
                  <th className="py-3.5 px-4">Location / Type</th>
                  <th className="py-3.5 px-4">Experience / Openings</th>
                  <th className="py-3.5 px-4 text-center">Applications</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Posted Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequisitions.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/80 transition">
                    {/* Code */}
                    <td className="py-4 px-4 font-mono font-bold text-slate-800">
                      {req.requisition_code}
                    </td>

                    {/* Title & Dept */}
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-900 text-sm hover:text-blue-600">
                        <Link href={`/admin/requisitions/${req.id}/edit`}>
                          {req.title}
                        </Link>
                      </div>
                      <div className="text-slate-500 text-[11px] mt-0.5">
                        {req.department} &middot; Manager: {req.hiring_manager}
                      </div>
                    </td>

                    {/* Location / Type */}
                    <td className="py-4 px-4 text-slate-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        <span>{req.location}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {EMPLOYMENT_TYPE_LABELS[req.employment_type] || req.employment_type}
                      </div>
                    </td>

                    {/* Experience / Openings */}
                    <td className="py-4 px-4 text-slate-600">
                      <div>{req.experience_range}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                        {req.openings} {req.openings === 1 ? 'opening' : 'openings'}
                      </div>
                    </td>

                    {/* Application Count */}
                    <td className="py-4 px-4 text-center">
                      <Link
                        href={`/admin/requisitions/${req.id}/applications`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition"
                        title="View Applicants"
                      >
                        <Users className="h-3 w-3" />
                        <span>{req.applications_count ?? 0}</span>
                      </Link>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">{getStatusBadge(req.status)}</td>

                    {/* Posted Date */}
                    <td className="py-4 px-4 text-slate-500">
                      {req.posted_at ? formatDate(req.posted_at) : <span className="italic">Not published</span>}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Applicants Grid */}
                        <Link
                          href={`/admin/requisitions/${req.id}/applications`}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                          title="View applicants grid"
                        >
                          <Users className="h-4 w-4" />
                        </Link>

                        {/* View Public Page Link (if published) */}
                        {req.status === 'published' && (
                          <Link
                            href={`/jobs/${req.slug}`}
                            target="_blank"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                            title="View public posting"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        )}

                        {/* Edit */}
                        <Link
                          href={`/admin/requisitions/${req.id}/edit`}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                          title="Edit requisition"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>

                        {/* Publish (for Drafts) */}
                        {req.status === 'draft' && (
                          <button
                            onClick={() => handlePublish(req.id)}
                            disabled={actionLoadingId === req.id}
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition disabled:opacity-50"
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
                            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                            title="Close requisition"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}

                        {/* Duplicate */}
                        <button
                          onClick={() => handleDuplicate(req.id)}
                          disabled={actionLoadingId === req.id}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 transition disabled:opacity-50"
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
          <div className="p-12 text-center max-w-sm mx-auto">
            <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 border border-blue-100">
              <Layers className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">No requisitions found</h3>
            <p className="text-xs text-slate-500 mb-4">
              {searchQuery || activeTab !== 'all'
                ? 'No requisitions match your filter criteria.'
                : 'No requisitions have been created yet. Create your first opening!'}
            </p>
            <Link
              href="/admin/requisitions/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Requisition</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
