'use client';

import React, { useState } from 'react';
import { Education, EducationLevel } from '@/types/profile';
import { Plus, Trash2, GraduationCap, Loader2 } from 'lucide-react';

interface EducationFormProps {
  initialEducations: Education[];
  onSave: (educations: Education[]) => Promise<void>;
  isSaving?: boolean;
}

const EDUCATION_LEVEL_LABELS: Record<EducationLevel, string> = {
  high_school: 'High School (10th / 12th)',
  diploma: 'Diploma / Vocational',
  bachelors: "Bachelor's Degree (e.g. B.Tech, B.Sc, B.Com)",
  masters: "Master's Degree (e.g. M.Tech, M.S, MBA)",
  doctorate: 'Doctorate / Ph.D.',
};

export function EducationForm({
  initialEducations,
  onSave,
  isSaving = false,
}: EducationFormProps) {
  const currentYear = new Date().getFullYear();

  const [educations, setEducations] = useState<Education[]>(() => {
    if (initialEducations.length > 0) return initialEducations;
    return [
      {
        degree: '',
        specialization: '',
        institution: '',
        year_of_passing: currentYear,
        grade: '',
        education_level: 'bachelors',
        sort_order: 0,
      },
    ];
  });

  const [errors, setErrors] = useState<Record<number, Record<string, string>>>({});

  const handleAdd = () => {
    setEducations([
      ...educations,
      {
        degree: '',
        specialization: '',
        institution: '',
        year_of_passing: currentYear,
        grade: '',
        education_level: 'bachelors',
        sort_order: educations.length,
      },
    ]);
  };

  const handleRemove = (index: number) => {
    if (educations.length === 1) {
      alert('You must provide at least one education record.');
      return;
    }
    const updated = educations.filter((_, i) => i !== index);
    setEducations(updated);
  };

  const handleChange = (index: number, field: keyof Education, value: any) => {
    const updated = [...educations];
    updated[index] = { ...updated[index], [field]: value };
    setEducations(updated);

    // Clear field error
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
    const newErrors: Record<number, Record<string, string>> = {};
    let isValid = true;

    educations.forEach((edu, idx) => {
      const rowErr: Record<string, string> = {};
      if (!edu.degree?.trim()) {
        rowErr.degree = 'Degree/qualification is required';
        isValid = false;
      }
      if (!edu.institution?.trim()) {
        rowErr.institution = 'Institution / University is required';
        isValid = false;
      }
      if (!edu.year_of_passing || edu.year_of_passing < 1950 || edu.year_of_passing > currentYear) {
        rowErr.year_of_passing = `Year must be between 1950 and ${currentYear}`;
        isValid = false;
      }
      if (!edu.education_level) {
        rowErr.education_level = 'Education level is required';
        isValid = false;
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
    await onSave(educations);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-base font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Education History
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Add your educational qualifications in chronological order.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition active:scale-95"
        >
          <Plus className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
          Add Qualification
        </button>
      </div>

      <div className="space-y-6">
        {educations.map((edu, idx) => (
          <div
            key={idx}
            className="p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-4 relative"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Qualification #{idx + 1}
              </span>
              {educations.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-semibold inline-flex items-center gap-1 transition active:scale-95"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Education Level <span className="text-red-500">*</span>
                </label>
                <select
                  value={edu.education_level}
                  onChange={(e) =>
                    handleChange(idx, 'education_level', e.target.value as EducationLevel)
                  }
                  className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition"
                >
                  {Object.entries(EDUCATION_LEVEL_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Degree / Course Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={edu.degree}
                  onChange={(e) => handleChange(idx, 'degree', e.target.value)}
                  placeholder="e.g. B.Tech Computer Science & Engineering"
                  className={`w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border ${
                    errors[idx]?.degree
                      ? 'border-red-400 ring-1 ring-red-400 bg-red-50/20 dark:bg-red-950/20 text-slate-900 dark:text-white'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 transition`}
                />
                {errors[idx]?.degree && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors[idx].degree}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Institution / School / University <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={edu.institution}
                  onChange={(e) => handleChange(idx, 'institution', e.target.value)}
                  placeholder="e.g. Delhi Technological University"
                  className={`w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border ${
                    errors[idx]?.institution
                      ? 'border-red-400 ring-1 ring-red-400 bg-red-50/20 dark:bg-red-950/20 text-slate-900 dark:text-white'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 transition`}
                />
                {errors[idx]?.institution && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors[idx].institution}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Specialization / Major
                </label>
                <input
                  type="text"
                  value={edu.specialization || ''}
                  onChange={(e) => handleChange(idx, 'specialization', e.target.value)}
                  placeholder="e.g. Data Science / Artificial Intelligence"
                  className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Year of Passing <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1950"
                  max={currentYear}
                  value={edu.year_of_passing || ''}
                  onChange={(e) =>
                    handleChange(idx, 'year_of_passing', parseInt(e.target.value, 10) || '')
                  }
                  className={`w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border ${
                    errors[idx]?.year_of_passing
                      ? 'border-red-400 ring-1 ring-red-400 bg-red-50/20 dark:bg-red-950/20 text-slate-900 dark:text-white'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 transition`}
                />
                {errors[idx]?.year_of_passing && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors[idx].year_of_passing}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Grade / Percentage / CGPA
                </label>
                <input
                  type="text"
                  value={edu.grade || ''}
                  onChange={(e) => handleChange(idx, 'grade', e.target.value)}
                  placeholder="e.g. 8.5 CGPA or 85%"
                  className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition disabled:opacity-50 active:scale-95"
        >
          {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save Education Details
        </button>
      </div>
    </form>
  );
}
