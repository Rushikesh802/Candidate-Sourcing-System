'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

import { useToast } from '@/context/ToastContext';
import { fetchApi } from '@/lib/api';
import { Job } from '@/types/job';
import {
  ProfileData,
  ProfileUpdatePayload,
  Education,
  Experience,
  ExperienceUpdatePayload,
} from '@/types/profile';
import { ApplicationItem, ApplicationDetail } from '@/types/application';
import { BioForm } from '@/components/profile/BioForm';
import { EducationForm } from '@/components/profile/EducationForm';
import { ExperienceForm } from '@/components/profile/ExperienceForm';
import {
  Briefcase,
  Building2,
  MapPin,
  Clock,
  User,
  GraduationCap,
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  X,
  FileCheck,
} from 'lucide-react';

const STEPS = [
  { id: 1, name: 'Bio-Data', icon: User },
  { id: 2, name: 'Education', icon: GraduationCap },
  { id: 3, name: 'Experience', icon: Briefcase },
  { id: 4, name: 'Resume & Submit', icon: FileText },
];

export default function ApplyWizardPage() {
  const params = useParams();
  const router = useRouter();
  const requisitionId = params?.requisitionId as string;
  const { user, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [job, setJob] = useState<Job | null>(null);
  const [alreadyApplied, setAlreadyApplied] = useState<ApplicationItem | null>(null);

  // Candidate Data State
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [educations, setEducations] = useState<Education[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [isFresher, setIsFresher] = useState(false);
  const [totalYears, setTotalYears] = useState(0.0);

  // Step 4 State
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [coverNote, setCoverNote] = useState('');
  const [consentAccuracy, setConsentAccuracy] = useState(false);
  const [consentPrivacy, setConsentPrivacy] = useState(false);
  const [step4Errors, setStep4Errors] = useState<Record<string, string>>({});
  const resumeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadApplyContext() {
      if (!requisitionId || !user) return;
      setIsLoading(true);

      try {
        // 1. Fetch Job details (via public or list)
        const jobRes = await fetchApi<Job>(`/api/v1/jobs`);
        let matchedJob: Job | null = null;
        if (jobRes.data && Array.isArray(jobRes.data)) {
          matchedJob = jobRes.data.find((j: Job) => j.id === requisitionId || j.slug === requisitionId) || null;
        }

        if (matchedJob) {
          setJob(matchedJob);
        }

        // 2. Check if candidate already applied or has draft
        const [profileRes, eduRes, expRes, myAppsRes] = await Promise.all([
          fetchApi<ProfileData>('/api/v1/me/profile'),
          fetchApi<{ educations: Education[] }>('/api/v1/me/education'),
          fetchApi<{
            is_fresher: boolean;
            total_experience_years: number;
            experiences: Experience[];
          }>('/api/v1/me/experience'),
          fetchApi<ApplicationItem[]>('/api/v1/me/applications'),
        ]);

        if (myAppsRes.data && Array.isArray(myAppsRes.data)) {
          const existing = myAppsRes.data.find(
            (app) => app.requisition_id === requisitionId && app.status !== 'draft'
          );
          if (existing) {
            setAlreadyApplied(existing);
            setIsLoading(false);
            return;
          }
        }

        if (profileRes.data) {
          setProfileData(profileRes.data);
          setIsFresher(profileRes.data.is_fresher);
          setTotalYears(profileRes.data.total_experience_years);
        }

        if (eduRes.data?.educations) {
          setEducations(eduRes.data.educations);
        }

        if (expRes.data) {
          setExperiences(expRes.data.experiences || []);
          setIsFresher(expRes.data.is_fresher);
          setTotalYears(expRes.data.total_experience_years);
        }

        // Check draft
        const draftRes = await fetchApi<ApplicationDetail>(
          `/api/v1/jobs/${requisitionId}/applications/draft`
        );
        if (draftRes.data?.cover_note) {
          setCoverNote(draftRes.data.cover_note);
        }
      } catch (err: any) {
        showToast(err.message || 'Failed to load application wizard data', 'error');
      } finally {
        setIsLoading(false);
      }
    }

    loadApplyContext();
  }, [requisitionId, user, showToast]);

  const handleSaveBio = async (payload: ProfileUpdatePayload) => {
    setIsSubmitting(true);
    try {
      const res = await fetchApi<ProfileData>('/api/v1/me/profile', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      if (res.error) {
        showToast(res.error.message || 'Failed to save bio data', 'error');
        return;
      }

      if (res.data) {
        setProfileData(res.data);
        // Persist draft progress
        await fetchApi(`/api/v1/jobs/${requisitionId}/applications/draft`, {
          method: 'POST',
          body: JSON.stringify({ cover_note: coverNote, last_active_step: 2 }),
        });
        showToast('Bio details saved!', 'success');
        setCurrentStep(2);
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating bio', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEducation = async (updatedEducations: Education[]) => {
    setIsSubmitting(true);
    try {
      const res = await fetchApi<{ educations: Education[] }>('/api/v1/me/education', {
        method: 'PUT',
        body: JSON.stringify({ educations: updatedEducations }),
      });

      if (res.error) {
        showToast(res.error.message || 'Failed to save education', 'error');
        return;
      }

      if (res.data?.educations) {
        setEducations(res.data.educations);
        await fetchApi(`/api/v1/jobs/${requisitionId}/applications/draft`, {
          method: 'POST',
          body: JSON.stringify({ cover_note: coverNote, last_active_step: 3 }),
        });
        showToast('Education details saved!', 'success');
        setCurrentStep(3);
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating education', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveExperience = async (payload: ExperienceUpdatePayload) => {
    setIsSubmitting(true);
    try {
      const res = await fetchApi<{
        is_fresher: boolean;
        total_experience_years: number;
        experiences: Experience[];
      }>('/api/v1/me/experience', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      if (res.error) {
        showToast(res.error.message || 'Failed to save experience', 'error');
        return;
      }

      if (res.data) {
        setIsFresher(res.data.is_fresher);
        setTotalYears(res.data.total_experience_years);
        setExperiences(res.data.experiences || []);
        await fetchApi(`/api/v1/jobs/${requisitionId}/applications/draft`, {
          method: 'POST',
          body: JSON.stringify({ cover_note: coverNote, last_active_step: 4 }),
        });
        showToast('Experience details saved!', 'success');
        setCurrentStep(4);
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating experience', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResumeFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const lowerName = file.name.toLowerCase();
    const isValidExt =
      lowerName.endsWith('.pdf') || lowerName.endsWith('.doc') || lowerName.endsWith('.docx');

    if (!isValidExt) {
      setStep4Errors((prev) => ({
        ...prev,
        resume: 'Resume must be a PDF, DOC, or DOCX document.',
      }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setStep4Errors((prev) => ({
        ...prev,
        resume: 'Resume file size cannot exceed 5 MB.',
      }));
      return;
    }

    setStep4Errors((prev) => {
      const next = { ...prev };
      delete next.resume;
      return next;
    });
    setResumeFile(file);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: Record<string, string> = {};
    if (!resumeFile) {
      errors.resume = 'Resume document is mandatory to complete application';
    }
    if (!consentAccuracy) {
      errors.consentAccuracy = 'You must confirm the accuracy declaration';
    }
    if (!consentPrivacy) {
      errors.consentPrivacy = 'You must consent to the privacy policy';
    }

    if (Object.keys(errors).length > 0) {
      setStep4Errors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('resume', resumeFile!);
      if (coverNote.trim()) {
        formData.append('cover_note', coverNote.trim());
      }
      formData.append('consent_accuracy', 'true');
      formData.append('consent_privacy', 'true');

      const res = await fetch(`/api/v1/jobs/${requisitionId}/applications`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data?.error?.message || data?.detail?.error?.message || 'Submission failed', 'error');
        return;
      }

      showToast('Application submitted successfully!', 'success');
      router.push(`/applications/${data.id}/confirmation`);
    } catch (err: any) {
      showToast(err.message || 'Error submitting application', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Preparing Application Wizard...</p>
      </div>
    );
  }

  // Already Applied State Guard
  if (alreadyApplied) {
    return (
      <div className="min-h-screen bg-slate-50 py-12">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-5">
            <div className="h-14 w-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Already Applied</h2>
              <p className="text-sm text-slate-600 mt-2">
                You have already submitted an application for{' '}
                <span className="font-semibold text-slate-800">
                  {alreadyApplied.requisition_title}
                </span>{' '}
                ({alreadyApplied.requisition_code}).
              </p>
              <div className="mt-4 inline-block px-4 py-2 rounded-lg bg-slate-100 text-xs font-mono font-semibold text-slate-700">
                Application Code: {alreadyApplied.application_code}
              </div>
            </div>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => router.push('/applications')}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition shadow-sm"
              >
                View My Applications
              </button>
              <button
                onClick={() => router.push('/jobs')}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition"
              >
                Browse Other Openings
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Top Navigation Back */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 font-medium transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Job Details
          </button>
          <span className="text-xs text-slate-400 font-mono">
            Position ID: {job?.requisition_code || requisitionId}
          </span>
        </div>

        {/* Job Header Card */}
        {job && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
                <span>Applying for</span>
                <span>•</span>
                <span>{job.department}</span>
              </div>
              <h1 className="text-xl font-bold text-slate-900">{job.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  {job.location}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  {job.employment_type?.replace('_', ' ')}
                </span>
                <span className="flex items-center gap-1">
                  <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                  {job.experience_range}
                </span>
              </div>
            </div>
            <div className="sm:text-right shrink-0">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Active Opening
              </span>
            </div>
          </div>
        )}

        {/* 4-Step Progress Indicator */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;

              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition ${
                    isCurrent
                      ? 'bg-blue-50/80 border-blue-300 ring-1 ring-blue-300 text-blue-900'
                      : isCompleted
                      ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  <div
                    className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                      isCurrent
                        ? 'bg-blue-600 text-white'
                        : isCompleted
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : step.id}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                      Step {step.id}
                    </p>
                    <p className="text-xs font-bold truncate">{step.name}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Panels */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
          {/* STEP 1: Bio Data */}
          {currentStep === 1 && profileData && (
            <div>
              <div className="mb-6 pb-4 border-b border-slate-200">
                <h3 className="text-lg font-bold text-slate-900">Step 1: Personal Bio-Data</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Review and verify your contact details and basic information.
                </p>
              </div>
              <BioForm
                initialData={profileData}
                onSave={handleSaveBio}
                onPhotoUploaded={(url) => setProfileData({ ...profileData, photo_url: url })}
                onPhotoDeleted={() => setProfileData({ ...profileData, photo_url: null })}
                isSaving={isSubmitting}
              />
            </div>
          )}

          {/* STEP 2: Education */}
          {currentStep === 2 && (
            <div>
              <div className="mb-6 pb-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Step 2: Educational Background</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Provide at least one educational qualification.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                >
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
              </div>
              <EducationForm
                initialEducations={educations}
                onSave={handleSaveEducation}
                isSaving={isSubmitting}
              />
            </div>
          )}

          {/* STEP 3: Work Experience */}
          {currentStep === 3 && (
            <div>
              <div className="mb-6 pb-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Step 3: Work Experience</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    List your professional work history or toggle Fresher status.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                >
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
              </div>
              <ExperienceForm
                initialExperiences={experiences}
                initialIsFresher={isFresher}
                initialTotalYears={totalYears}
                onSave={handleSaveExperience}
                isSaving={isSubmitting}
              />
            </div>
          )}

          {/* STEP 4: Resume & Submit */}
          {currentStep === 4 && (
            <form onSubmit={handleFinalSubmit} className="space-y-6">
              <div className="mb-6 pb-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Step 4: Resume & Submit</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Upload your mandatory resume file, add an optional cover note, and provide consents.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                >
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
              </div>

              {/* Resume File Upload Box */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">
                  Upload Resume / CV <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  ref={resumeInputRef}
                  onChange={handleResumeFileSelected}
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                />

                {resumeFile ? (
                  <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/60 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                        <FileCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 truncate max-w-sm">
                          {resumeFile.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {(resumeFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for submission
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setResumeFile(null)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-white transition"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => resumeInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition hover:bg-slate-50 ${
                      step4Errors.resume ? 'border-red-400 bg-red-50/40' : 'border-slate-300'
                    }`}
                  >
                    <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                      <Upload className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-800">
                      Click here to select your resume
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Supported: PDF, DOC, DOCX (Max 5 MB)</p>
                  </div>
                )}
                {step4Errors.resume && (
                  <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1 font-medium">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {step4Errors.resume}
                  </p>
                )}
              </div>

              {/* Cover Note Textarea */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1">
                  Cover Note <span className="text-slate-400 font-normal text-xs">(Optional)</span>
                </label>
                <textarea
                  rows={4}
                  value={coverNote}
                  onChange={(e) => setCoverNote(e.target.value)}
                  maxLength={3000}
                  placeholder="Introduce yourself, highlight specific qualifications, and mention why you are the ideal fit for this requisition..."
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <div className="text-right text-[11px] text-slate-400 mt-0.5">
                  {coverNote.length}/3000 characters
                </div>
              </div>

              {/* Consents & Declarations */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Mandatory Consents & Declarations
                </h4>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentAccuracy}
                    onChange={(e) => {
                      setConsentAccuracy(e.target.checked);
                      if (e.target.checked) {
                        setStep4Errors((prev) => {
                          const next = { ...prev };
                          delete next.consentAccuracy;
                          return next;
                        });
                      }
                    }}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-xs text-slate-700">
                    <span className="font-semibold text-slate-900">Accuracy Declaration:</span> I hereby
                    confirm that all information provided in this application, including education,
                    experience, and documents, is accurate and true. <span className="text-red-500">*</span>
                  </span>
                </label>
                {step4Errors.consentAccuracy && (
                  <p className="text-xs text-red-600 pl-7">{step4Errors.consentAccuracy}</p>
                )}

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentPrivacy}
                    onChange={(e) => {
                      setConsentPrivacy(e.target.checked);
                      if (e.target.checked) {
                        setStep4Errors((prev) => {
                          const next = { ...prev };
                          delete next.consentPrivacy;
                          return next;
                        });
                      }
                    }}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-xs text-slate-700">
                    <span className="font-semibold text-slate-900">Privacy Policy Consent:</span> I agree
                    to the processing and retention of my personal data for recruitment and evaluation
                    purposes. <span className="text-red-500">*</span>
                  </span>
                </label>
                {step4Errors.consentPrivacy && (
                  <p className="text-xs text-red-600 pl-7">{step4Errors.consentPrivacy}</p>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900"
                >
                  Previous Step
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || !resumeFile || !consentAccuracy || !consentPrivacy}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting Application...
                    </>
                  ) : (
                    <>
                      Submit Final Application
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
