'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { RequisitionForm } from '@/components/admin/RequisitionForm';
import { Requisition } from '@/types/requisition';
import { fetchApi } from '@/lib/api';
import { ArrowLeft, Edit, AlertCircle } from 'lucide-react';

export default function EditRequisitionPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [requisition, setRequisition] = useState<Requisition | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadRequisition() {
      if (!id) return;
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetchApi<Requisition>(`/api/v1/admin/requisitions/${id}`);
        if (isMounted) {
          if (res.data) {
            setRequisition(res.data);
          } else if (res.error) {
            setError(res.error.message || 'Failed to load requisition');
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Network error occurred');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadRequisition();

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center">
        <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs text-slate-500">Loading requisition details...</p>
      </div>
    );
  }

  if (error || !requisition) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Link
          href="/admin/requisitions"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Requisitions</span>
        </Link>
        <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-3">
          <AlertCircle className="h-6 w-6 text-red-500 shrink-0" />
          <div>
            <h3 className="font-bold text-sm">Error Loading Requisition</h3>
            <p className="text-xs mt-0.5">{error || 'Requisition not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Breadcrumbs */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/requisitions"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Requisitions</span>
        </Link>

        <span className="text-xs font-mono text-slate-500 bg-slate-200/70 px-2.5 py-1 rounded-md">
          {requisition.requisition_code}
        </span>
      </div>

      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Edit className="h-6 w-6 text-blue-600" />
          <span>Edit Requisition: {requisition.title}</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Update requisition metadata, description, salary budget, or transition status.
        </p>
      </div>

      {/* Form Container */}
      <RequisitionForm initialData={requisition} isEditing={true} />
    </div>
  );
}
