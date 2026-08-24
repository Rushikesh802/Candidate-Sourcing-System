'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { fetchApi } from '@/lib/api';
import {
  ProfileData,
  ProfileUpdatePayload,
  Education,
  Experience,
  ExperienceUpdatePayload,
} from '@/types/profile';
import { BioForm } from '@/components/profile/BioForm';
import { EducationForm } from '@/components/profile/EducationForm';
import { ExperienceForm } from '@/components/profile/ExperienceForm';
import {
  User,
  GraduationCap,
  Briefcase,
  CheckCircle,
  Loader2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  UserCircle2,
} from 'lucide-react';

type ActiveTab = 'bio' | 'education' | 'experience';

export default function CandidateProfilePage() {
  const { user, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<ActiveTab>('bio');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [educations, setEducations] = useState<Education[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [isFresher, setIsFresher] = useState(false);
  const [totalYears, setTotalYears] = useState(0.0);

  useEffect(() => {
    async function loadAllProfileData() {
      setIsLoading(true);
      setError(null);
      try {
        const [profileRes, eduRes, expRes] = await Promise.all([
          fetchApi<ProfileData>('/api/v1/me/profile'),
          fetchApi<{ educations: Education[] }>('/api/v1/me/education'),
          fetchApi<{
            is_fresher: boolean;
            total_experience_years: number;
            experiences: Experience[];
          }>('/api/v1/me/experience'),
        ]);

        if (profileRes.error) {
          setError(profileRes.error.message);
          return;
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
      } catch (err: any) {
        setError(err.message || 'Failed to load profile details');
      } finally {
        setIsLoading(false);
      }
    }

    if (user) {
      loadAllProfileData();
    }
  }, [user]);

  const handleSaveBio = async (payload: ProfileUpdatePayload) => {
    setIsSaving(true);
    try {
      const res = await fetchApi<ProfileData>('/api/v1/me/profile', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      if (res.error) {
        showToast(res.error.message || 'Failed to save bio details', 'error');
        return;
      }

      if (res.data) {
        setProfileData(res.data);
        showToast('Bio details saved successfully!', 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Error saving bio details', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveEducation = async (updatedEducations: Education[]) => {
    setIsSaving(true);
    try {
      const res = await fetchApi<{ educations: Education[] }>('/api/v1/me/education', {
        method: 'PUT',
        body: JSON.stringify({ educations: updatedEducations }),
      });

      if (res.error) {
        showToast(res.error.message || 'Failed to save education details', 'error');
        return;
      }

      if (res.data?.educations) {
        setEducations(res.data.educations);
        showToast('Education details updated successfully!', 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating education details', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveExperience = async (payload: ExperienceUpdatePayload) => {
    setIsSaving(true);
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
        showToast(res.error.message || 'Failed to save experience details', 'error');
        return;
      }

      if (res.data) {
        setIsFresher(res.data.is_fresher);
        setTotalYears(res.data.total_experience_years);
        setExperiences(res.data.experiences || []);
        showToast('Work experience updated successfully!', 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating work experience', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoUploaded = (photoUrl: string) => {
    if (profileData) {
      setProfileData({ ...profileData, photo_url: photoUrl });
    }
    showToast('Profile photo updated!', 'success');
  };

  const handlePhotoDeleted = () => {
    if (profileData) {
      setProfileData({ ...profileData, photo_url: null, photo_key: null });
    }
    showToast('Profile photo removed', 'info');
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Loading your candidate profile...</p>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="p-6 rounded-3xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-4">
          <AlertCircle className="h-6 w-6 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold">Failed to Load Profile</h3>
            <p className="text-xs mt-1">{error || 'Unable to retrieve your candidate profile.'}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 selection:bg-blue-500 selection:text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Profile Identity Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative h-20 w-20 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-600 text-white border-2 border-white shadow-md flex items-center justify-center font-black text-2xl shrink-0">
              {profileData.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profileData.photo_url}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                `${profileData.first_name?.[0] || ''}${profileData.last_name?.[0] || ''}`
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  {profileData.first_name} {profileData.last_name}
                </h1>
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle className="h-3 w-3 text-emerald-500" /> Verified
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">{profileData.email}</p>
              
              <div className="flex items-center gap-2 mt-2">
                {isFresher ? (
                  <span className="text-xs font-bold text-blue-700 px-2.5 py-0.5 rounded-md bg-blue-50 border border-blue-200">
                    Fresher / Entry Level
                  </span>
                ) : (
                  <span className="text-xs font-bold text-slate-700 px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200">
                    {totalYears.toFixed(1)} yrs total experience
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200/80 p-4 rounded-2xl max-w-xs shadow-inner space-y-1">
            <span className="font-extrabold text-slate-900 block">⚡ Instant Profile Pre-fill</span>
            <span className="text-slate-500 font-medium leading-relaxed block">
              Information saved here automatically pre-fills across all job applications.
            </span>
          </div>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 rounded-2xl overflow-x-auto border border-slate-200">
          <button
            onClick={() => setActiveTab('bio')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
              activeTab === 'bio'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <User className="h-4 w-4" />
            <span>1. Personal Bio &amp; Contact</span>
          </button>

          <button
            onClick={() => setActiveTab('education')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
              activeTab === 'education'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <GraduationCap className="h-4 w-4" />
            <span>2. Education</span>
            {educations.length > 0 && (
              <span className="ml-1 text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-bold">
                {educations.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('experience')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
              activeTab === 'experience'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Briefcase className="h-4 w-4" />
            <span>3. Work Experience</span>
            {!isFresher && experiences.length > 0 && (
              <span className="ml-1 text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-bold">
                {experiences.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content Panel */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm">
          {activeTab === 'bio' && (
            <BioForm
              initialData={profileData}
              onSave={handleSaveBio}
              onPhotoUploaded={handlePhotoUploaded}
              onPhotoDeleted={handlePhotoDeleted}
              isSaving={isSaving}
            />
          )}

          {activeTab === 'education' && (
            <EducationForm
              initialEducations={educations}
              onSave={handleSaveEducation}
              isSaving={isSaving}
            />
          )}

          {activeTab === 'experience' && (
            <ExperienceForm
              initialExperiences={experiences}
              initialIsFresher={isFresher}
              initialTotalYears={totalYears}
              onSave={handleSaveExperience}
              isSaving={isSaving}
            />
          )}
        </div>
      </div>
    </div>
  );
}