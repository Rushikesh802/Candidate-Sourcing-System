'use client';

import React, { useState } from 'react';
import { Experience, ExperienceUpdatePayload } from '@/types/profile';
import { Plus, Trash2, Briefcase, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';

interface ExperienceFormProps {
  initialExperiences: Experience[];
  initialIsFresher: boolean;
  initialTotalYears: number;
  onSave: (payload: ExperienceUpdatePayload) => Promise<void>;
  isSaving?: boolean;
}

export function ExperienceForm({
  initialExperiences,
  initialIsFresher,
  initialTotalYears,
  onSave,
  isSaving = false,
}: ExperienceFormProps) {
  const [isFresher, setIsFresher] = useState(initialIsFresher);
  const [experiences, setExperiences] = useState<Experience[]>(() => {
    if (initialExperiences.length > 0) return initialExperiences;
    return [
      {
        employer: '',
        job_title: '',
        start_date: '',
        end_date: '',
        is_current: false,
        responsibilities: '',
      },
    ];
  });

  const [errors, setErrors] = useState<Record<number, Record<string, string>>>({});

  const handleToggleFresher = (checked: boolean) => {
    setIsFresher(checked);
    if (checked) {
      setErrors({});
    }
  };

  const handleAdd = () => {
    setExperiences([
      ...experiences,
      {
        employer: '',
        job_title: '',
        start_date: '',
        end_date: '',
        is_current: false,
        responsibilities: '',
      },
    ]);
  };

  const handleRemove = (index: number) => {
    const updated = experiences.filter((_, i) => i !== index);
    setExperiences(updated);
  };

  const handleChange = (index: number, field: keyof Experience, value: any) => {
    const updated = [...experiences];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'is_current' && value === true) {
      updated[index].end_date = '';
    }
    setExperiences(updated);

    if (errors[index]?.[field]) {
      setErrors({
        ...errors,
        [index]: {
          ...errors[index],
          [field]: '',
        },
      });
    }
  };

  const validate = (): boolean => {
    if (isFresher) return true;

    const newErrors: Record<number, Record<string, string>> = {};
    let isValid = true;
    const today = new Date().toISOString().split('T')[0];

    experiences.forEach((exp, idx) => {
      const rowErr: Record<string, string> = {};
      if (!exp.employer?.trim()) {
        rowErr.employer = 'Employer / Company is required';
        isValid = false;
      }
      if (!exp.job_title?.trim()) {
        rowErr.job_title = 'Job title is required';
        isValid = false;
      }
      if (!exp.start_date) {
        rowErr.start_date = 'Start date is required';
        isValid = false;
      } else if (exp.start_date > today) {
        rowErr.start_date = 'Start date cannot be in the future';
        isValid = false;
      }

      if (!exp.is_current && exp.end_date) {
        if (exp.start_date && exp.end_date < exp.start_date) {
          rowErr.end_date = 'End date cannot be earlier than start date';
          isValid = false;
        }
      }

      if (Object.keys(rowErr).length > 0) {
        newErrors[idx] = rowErr;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSave({
      is_fresher: isFresher,
      experiences: isFresher ? [] : experiences,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header and Fresher Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-base font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Work Experience
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Document your professional employment background and tenure.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!isFresher && (
            <div className="px-3 py-1 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span>Total Experience: {initialTotalYears.toFixed(1)} yrs</span>
            </div>
          )}

          {!isFresher && (
            <button
              type="button"
              onClick={handleAdd}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition active:scale-95"
            >
              <Plus className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
              Add Experience
            </button>
          )}
        </div>
      </div>

      {/* Fresher Checkbox Card */}
      <div
        onClick={() => handleToggleFresher(!isFresher)}
        className={`p-4 sm:p-5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
          isFresher
            ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 shadow-sm'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
        }`}
      >
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={isFresher}
            onChange={(e) => handleToggleFresher(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              I am a Fresher / Recent Graduate
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select this if you have no prior full-time work experience. You will not be required to add employer details.
            </p>
          </div>
        </div>
        {isFresher && (
          <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-100/70 dark:bg-blue-900/60 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-800">
            <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            Fresher Profile Active
          </span>
        )}
      </div>

      {/* Work Experience List */}
      {!isFresher && (
        <div className="space-y-6">
          {experiences.length === 0 ? (
            <div className="text-center py-8 px-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400">
              <p className="text-sm">No work experience added yet.</p>
              <button
                type="button"
                onClick={handleAdd}
                className="mt-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                + Add your first work experience
              </button>
            </div>
          ) : (
            experiences.map((exp, idx) => (
              <div
                key={idx}
                className="p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-4 relative"
              >
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Experience #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-semibold inline-flex items-center gap-1 transition active:scale-95"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                      Employer / Organization Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={exp.employer}
                      onChange={(e) => handleChange(idx, 'employer', e.target.value)}
                      placeholder="e.g. Google India Pvt Ltd"
                      className={`w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border ${
                        errors[idx]?.employer
                          ? 'border-red-400 ring-1 ring-red-400 bg-red-50/20 dark:bg-red-950/20 text-slate-900 dark:text-white'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500 transition`}
                    />
                    {errors[idx]?.employer && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors[idx].employer}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                      Job Title / Role <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={exp.job_title}
                      onChange={(e) => handleChange(idx, 'job_title', e.target.value)}
                      placeholder="e.g. Senior Software Engineer"
                      className={`w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border ${
                        errors[idx]?.job_title
                          ? 'border-red-400 ring-1 ring-red-400 bg-red-50/20 dark:bg-red-950/20 text-slate-900 dark:text-white'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500 transition`}
                    />
                    {errors[idx]?.job_title && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors[idx].job_title}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                      Start Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={exp.start_date ? exp.start_date.split('T')[0] : ''}
                      onChange={(e) => handleChange(idx, 'start_date', e.target.value)}
                      className={`w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border ${
                        errors[idx]?.start_date
                          ? 'border-red-400 ring-1 ring-red-400 bg-red-50/20 dark:bg-red-950/20 text-slate-900 dark:text-white'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500 transition`}
                    />
                    {errors[idx]?.start_date && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors[idx].start_date}</p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">End Date</label>
                      <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={exp.is_current}
                          onChange={(e) => handleChange(idx, 'is_current', e.target.checked)}
                          className="h-3.5 w-3.5 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500"
                        />
                        Currently working here
                      </label>
                    </div>
                    <input
                      type="date"
                      disabled={exp.is_current}
                      value={
                        exp.is_current ? '' : exp.end_date ? exp.end_date.split('T')[0] : ''
                      }
                      onChange={(e) => handleChange(idx, 'end_date', e.target.value)}
                      className={`w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border ${
                        exp.is_current
                          ? 'bg-slate-100 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800 cursor-not-allowed'
                          : errors[idx]?.end_date
                          ? 'border-red-400 ring-1 ring-red-400 bg-red-50/20 dark:bg-red-950/20 text-slate-900 dark:text-white'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500 transition`}
                    />
                    {errors[idx]?.end_date && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors[idx].end_date}</p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                      Key Responsibilities &amp; Achievements
                    </label>
                    <textarea
                      rows={3}
                      value={exp.responsibilities || ''}
                      onChange={(e) => handleChange(idx, 'responsibilities', e.target.value)}
                      maxLength={1000}
                      placeholder="Describe your role, core responsibilities, key projects, and tools used..."
                      className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 resize-none transition"
                    />
                    <div className="text-right text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                      {(exp.responsibilities || '').length}/1000 characters
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition disabled:opacity-50 active:scale-95"
        >
          {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save Experience Details
        </button>
      </div>
    </form>
  );
}
