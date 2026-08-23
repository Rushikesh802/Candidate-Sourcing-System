'use client';

import React from 'react';
import Link from 'next/link';
import { RequisitionForm } from '@/components/admin/RequisitionForm';
import { ArrowLeft, PlusCircle } from 'lucide-react';

export default function NewRequisitionPage() {
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
      </div>

      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <PlusCircle className="h-6 w-6 text-blue-600" />
          <span>Create New Job Requisition</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Specify opening details, hiring manager, description, budget, and publish or save as draft.
        </p>
      </div>

      {/* Form Container */}
      <RequisitionForm isEditing={false} />
    </div>
  );
}
