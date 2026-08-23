'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Requisition,
  RequisitionFormData,
  DEPARTMENT_OPTIONS,
  EMPLOYMENT_TYPE_LABELS,
  EXPERIENCE_RANGE_OPTIONS,
  EmploymentType,
} from '@/types/requisition';
import { RichTextEditor } from './RichTextEditor';
import { useToast } from '@/context/ToastContext';
import { fetchApi } from '@/lib/api';
import {
  Save,
  Send,
  X,
  AlertCircle,
  Building,
  MapPin,
  Clock,
  Briefcase,
  Users,
  UserCheck,
  DollarSign,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';

interface RequisitionFormProps {
  initialData?: Requisition;
  isEditing?: boolean;
}

export function RequisitionForm({ initialData, isEditing = false }: RequisitionFormProps) {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [formData, setFormData] = useState<RequisitionFormData>({
    title: initialData?.title || '',
    department: initialData?.department || 'Engineering',
    location: initialData?.location || '',
    employment_type: initialData?.employment_type || 'full_time',
    experience_range: initialData?.experience_range || '3-5 years (Mid-level)',
    openings: initialData?.openings || 1,
    hiring_manager: initialData?.hiring_manager || '',
    description_html:
      initialData?.description_html ||
      `<h3>About the Role</h3>\n<p>We are seeking a talented professional to join our expanding team.</p>\n\n<h4>Key Responsibilities:</h4>\n<ul>\n  <li>Drive impactful deliverables in collaboration with the team.</li>\n  <li>Ensure high quality, scalability, and performance standards.</li>\n</ul>\n\n<h4>Requirements:</h4>\n<ul>\n  <li>Strong proven track record in the respective domain.</li>\n  <li>Excellent communication and problem-solving abilities.</li>\n</ul>`,
    max_salary_budget: initialData?.max_salary_budget || '',
    hiring_complete_by: initialData?.hiring_complete_by || '',
    status: initialData?.status || 'draft',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!formData.title.trim()) {
      errs.title = 'Job title is required';
    } else if (formData.title.length > 100) {
      errs.title = 'Job title must be under 100 characters';
    }

    if (!formData.department.trim()) {
      errs.department = 'Department is required';
    }

    if (!formData.location.trim()) {
      errs.location = 'Location is required (e.g. Remote or City)';
    }

    if (!formData.experience_range.trim()) {
      errs.experience_range = 'Experience range is required';
    }

    if (!formData.openings || Number(formData.openings) <= 0) {
      errs.openings = 'Openings must be at least 1';
    }

    if (!formData.hiring_manager.trim()) {
      errs.hiring_manager = 'Hiring manager name is required';
    }

    if (!formData.description_html.trim()) {
      errs.description_html = 'Job description is required';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (submitStatus?: 'draft' | 'published') => {
    if (!validate()) {
      toastError('Please fix validation errors before saving.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: formData.title.trim(),
        department: formData.department.trim(),
        location: formData.location.trim(),
        employment_type: formData.employment_type,
        experience_range: formData.experience_range.trim(),
        openings: Number(formData.openings),
        hiring_manager: formData.hiring_manager.trim(),
        description_html: formData.description_html.trim(),
        max_salary_budget: formData.max_salary_budget
          ? Number(formData.max_salary_budget)
          : null,
        hiring_complete_by: formData.hiring_complete_by || null,
        status: submitStatus || formData.status || 'draft',
      };

      if (isEditing && initialData?.id) {
        // Edit Requisition (PATCH)
        const res = await fetchApi<Requisition>(`/api/v1/admin/requisitions/${initialData.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });

        if (res.error) {
          toastError(res.error.message || 'Failed to update requisition');
          return;
        }

        // If explicitly requested publish transition
        if (submitStatus === 'published' && initialData.status !== 'published') {
          await fetchApi(`/api/v1/admin/requisitions/${initialData.id}/publish`, {
            method: 'POST',
          });
        }

        success('Requisition updated successfully!');
        router.push('/admin/requisitions');
      } else {
        // Create Requisition (POST)
        const res = await fetchApi<Requisition>('/api/v1/admin/requisitions', {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        if (res.error) {
          toastError(res.error.message || 'Failed to create requisition');
          return;
        }

        success(
          submitStatus === 'published'
            ? 'Requisition created and published!'
            : 'Requisition saved as draft!'
        );
        router.push('/admin/requisitions');
      }
    } catch (err: any) {
      toastError(err?.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
      {/* Basic Info Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
          <Layers className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-bold text-slate-900">Requisition Overview</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Title */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Job Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Senior Full Stack Engineer, Product Marketing Lead"
              className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition ${
                errors.title
                  ? 'border-red-300 focus:ring-red-400 bg-red-50/20'
                  : 'border-slate-200 focus:ring-blue-500'
              }`}
            />
            {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title}</p>}
          </div>

          {/* Department */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Department <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {DEPARTMENT_OPTIONS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Location <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Remote, Bengaluru, India, New York, NY"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition ${
                  errors.location
                    ? 'border-red-300 focus:ring-red-400 bg-red-50/20'
                    : 'border-slate-200 focus:ring-blue-500'
                }`}
              />
            </div>
            {errors.location && <p className="text-xs text-red-600 mt-1">{errors.location}</p>}
          </div>

          {/* Employment Type */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Employment Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.employment_type}
              onChange={(e) =>
                setFormData({ ...formData, employment_type: e.target.value as EmploymentType })
              }
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {(Object.keys(EMPLOYMENT_TYPE_LABELS) as EmploymentType[]).map((type) => (
                <option key={type} value={type}>
                  {EMPLOYMENT_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </div>

          {/* Experience Range */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Experience Range <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.experience_range}
              onChange={(e) => setFormData({ ...formData, experience_range: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {EXPERIENCE_RANGE_OPTIONS.map((exp) => (
                <option key={exp} value={exp}>
                  {exp}
                </option>
              ))}
            </select>
          </div>

          {/* Openings */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Total Openings <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Users className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="number"
                min={1}
                max={100}
                value={formData.openings}
                onChange={(e) =>
                  setFormData({ ...formData, openings: parseInt(e.target.value) || 1 })
                }
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {errors.openings && <p className="text-xs text-red-600 mt-1">{errors.openings}</p>}
          </div>

          {/* Hiring Manager */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Hiring Manager <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <UserCheck className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={formData.hiring_manager}
                onChange={(e) => setFormData({ ...formData, hiring_manager: e.target.value })}
                placeholder="e.g. Sarah Connor (VP Engineering)"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition ${
                  errors.hiring_manager
                    ? 'border-red-300 focus:ring-red-400 bg-red-50/20'
                    : 'border-slate-200 focus:ring-blue-500'
                }`}
              />
            </div>
            {errors.hiring_manager && (
              <p className="text-xs text-red-600 mt-1">{errors.hiring_manager}</p>
            )}
          </div>
        </div>
      </div>

      {/* Budget and Timeline Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
          <DollarSign className="h-5 w-5 text-emerald-600" />
          <h2 className="text-lg font-bold text-slate-900">Budget & Target Timeline</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Max Salary Budget */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Maximum Salary Budget (Annual INR/USD)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="number"
                value={formData.max_salary_budget || ''}
                onChange={(e) => setFormData({ ...formData, max_salary_budget: e.target.value })}
                placeholder="e.g. 3500000"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Internal recruiter reference only. Not visible on public candidate postings.
            </p>
          </div>

          {/* Hiring Complete By */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Hiring Shall Be Completed By
            </label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="date"
                value={formData.hiring_complete_by || ''}
                onChange={(e) =>
                  setFormData({ ...formData, hiring_complete_by: e.target.value })
                }
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Target close date for talent acquisition metrics.
            </p>
          </div>
        </div>
      </div>

      {/* Description Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">
              Job Description <span className="text-red-500">*</span>
            </h2>
          </div>
          <span className="text-xs text-slate-500">HTML Sanitized on Save</span>
        </div>

        <RichTextEditor
          value={formData.description_html}
          onChange={(html) => setFormData({ ...formData, description_html: html })}
        />
        {errors.description_html && (
          <p className="text-xs text-red-600 mt-1">{errors.description_html}</p>
        )}
      </div>

      {/* Form Action Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200">
        <Link
          href="/admin/requisitions"
          className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-100 transition inline-flex items-center gap-1.5"
        >
          <X className="h-4 w-4" />
          <span>Cancel</span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSubmit('draft')}
            className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 font-semibold text-sm hover:bg-slate-50 transition shadow-sm inline-flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="h-4 w-4 text-slate-600" />
            <span>Save as Draft</span>
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSubmit('published')}
            className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition shadow-md inline-flex items-center gap-2 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            <span>{isEditing ? 'Save & Publish' : 'Publish Requisition'}</span>
          </button>
        </div>
      </div>
    </form>
  );
}
