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
        <p className="text-sm font-medium text-slate-500">Loading your candidate profile...</p>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-4">
          <AlertCircle className="h-6 w-6 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-base font-semibold">Failed to Load Profile</h3>
            <p className="text-sm mt-1">{error || 'Unable to retrieve your candidate profile.'}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 px-4 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Page Header */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full overflow-hidden bg-blue-100 text-blue-700 border-2 border-blue-200 flex items-center justify-center font-bold text-xl shrink-0">
              {profileData.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profileData.photo_url}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                `${profileData.first_name[0] || ''}${profileData.last_name[0] || ''}`
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {profileData.first_name} {profileData.last_name}
              </h1>
              <p className="text-sm text-slate-500">{profileData.email}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle className="h-3 w-3" /> Candidate Profile
                </span>
                {isFresher ? (
                  <span className="text-xs text-blue-700 font-medium px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200">
                    Fresher
                  </span>
                ) : (
                  <span className="text-xs text-slate-600 font-medium px-2 py-0.5 rounded-full bg-slate-100">
                    {totalYears.toFixed(1)} yrs experience
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 p-3 rounded-xl max-w-xs">
            <span className="font-semibold text-slate-700">Reusable Profile:</span> Data saved here
            will automatically pre-fill when you apply to any job opening.
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('bio')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition whitespace-nowrap ${
              activeTab === 'bio'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <User className="h-4 w-4" />
            1. Personal Bio & Contact
          </button>

          <button
            onClick={() => setActiveTab('education')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition whitespace-nowrap ${
              activeTab === 'education'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <GraduationCap className="h-4 w-4" />
            2. Education Qualifications
            {educations.length > 0 && (
              <span className="ml-1 text-[11px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded-full font-bold">
                {educations.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('experience')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition whitespace-nowrap ${
              activeTab === 'experience'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Briefcase className="h-4 w-4" />
            3. Work Experience
            {!isFresher && experiences.length > 0 && (
              <span className="ml-1 text-[11px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded-full font-bold">
                {experiences.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content Panels */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
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
