'use client';

import React, { useState, useRef } from 'react';
import { ProfileData, ProfileUpdatePayload, Gender, NoticePeriod } from '@/types/profile';
import { Camera, Trash2, Loader2, User, MapPin, Building, Calendar, Phone } from 'lucide-react';

interface BioFormProps {
  initialData: ProfileData;
  onSave: (payload: ProfileUpdatePayload) => Promise<void>;
  onPhotoUploaded: (newPhotoUrl: string) => void;
  onPhotoDeleted: () => void;
  isSaving?: boolean;
}

export function BioForm({
  initialData,
  onSave,
  onPhotoUploaded,
  onPhotoDeleted,
  isSaving = false,
}: BioFormProps) {
  const [formData, setFormData] = useState<ProfileUpdatePayload>({
    first_name: initialData.first_name || '',
    last_name: initialData.last_name || '',
    mobile: initialData.mobile || '',
    gender: initialData.gender || null,
    date_of_birth: initialData.date_of_birth ? initialData.date_of_birth.split('T')[0] : '',
    current_location: initialData.current_location || '',
    current_company: initialData.current_company || '',
    notice_period: initialData.notice_period || null,
    current_address: initialData.current_address || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photoUrl, setPhotoUrl] = useState<string | null>(initialData.photo_url || null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.first_name?.trim()) newErrors.first_name = 'First name is required';
    if (!formData.last_name?.trim()) newErrors.last_name = 'Last name is required';
    if (!formData.mobile?.trim()) newErrors.mobile = 'Mobile number is required';
    else if (!/^\+?[0-9\s\-()]{5,20}$/.test(formData.mobile.trim())) {
      newErrors.mobile = 'Enter a valid mobile number (with country code)';
    }

    if (formData.date_of_birth) {
      const dob = new Date(formData.date_of_birth);
      const today = new Date();
      if (dob > today) {
        newErrors.date_of_birth = 'Date of birth cannot be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSave(formData);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      alert('Only JPEG and PNG images are allowed.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Photo must be less than 2 MB.');
      return;
    }

    const uploadFormData = new FormData();
    uploadFormData.append('file', file);

    setIsUploadingPhoto(true);
    try {
      const res = await fetch('/api/v1/me/photo', {
        method: 'POST',
        body: uploadFormData,
      });
      const data = await res.json();
      if (res.ok && data.photo_url) {
        setPhotoUrl(data.photo_url);
        onPhotoUploaded(data.photo_url);
      } else {
        alert(data?.error?.message || 'Failed to upload photo');
      }
    } catch (err: any) {
      alert(err.message || 'Error uploading photo');
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeletePhoto = async () => {
    if (!confirm('Are you sure you want to remove your profile photo?')) return;
    setIsUploadingPhoto(true);
    try {
      const res = await fetch('/api/v1/me/photo', { method: 'DELETE' });
      if (res.ok) {
        setPhotoUrl(null);
        onPhotoDeleted();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Profile Photo Section */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="relative group">
          <div className="h-24 w-24 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 shadow-sm">
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoUrl}
                alt="Profile"
                className="h-full w-full object-cover"
                onError={() => setPhotoUrl(null)}
              />
            ) : (
              <User className="h-12 w-12 text-slate-300 dark:text-slate-600" />
            )}
          </div>
          {isUploadingPhoto && (
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
        </div>

        <div className="flex flex-col items-center sm:items-start gap-2">
          <h4 className="text-sm font-semibold text-slate-800 dark:text-white">Profile Photo</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">JPG or PNG, max 2 MB</p>
          <div className="flex items-center gap-2 mt-1">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png, image/jpeg, image/jpg"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingPhoto}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition active:scale-95"
            >
              <Camera className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
              Upload New Photo
            </button>
            {photoUrl && (
              <button
                type="button"
                onClick={handleDeletePhoto}
                disabled={isUploadingPhoto}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition active:scale-95"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid of inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.first_name || ''}
            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            className={`w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border ${
              errors.first_name
                ? 'border-red-400 ring-1 ring-red-400 bg-red-50/20 dark:bg-red-950/20 text-slate-900 dark:text-white'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white'
            } focus:outline-none focus:ring-2 focus:ring-blue-500 transition`}
            placeholder="John"
          />
          {errors.first_name && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.first_name}</p>}
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.last_name || ''}
            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            className={`w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border ${
              errors.last_name
                ? 'border-red-400 ring-1 ring-red-400 bg-red-50/20 dark:bg-red-950/20 text-slate-900 dark:text-white'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white'
            } focus:outline-none focus:ring-2 focus:ring-blue-500 transition`}
            placeholder="Doe"
          />
          {errors.last_name && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.last_name}</p>}
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
            Email Address (Login ID)
          </label>
          <input
            type="email"
            value={initialData.email}
            disabled
            className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 cursor-not-allowed"
          />
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Email cannot be changed.</p>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
            Mobile Number <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="tel"
              value={formData.mobile || ''}
              onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
              className={`w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border ${
                errors.mobile
                  ? 'border-red-400 ring-1 ring-red-400 bg-red-50/20 dark:bg-red-950/20 text-slate-900 dark:text-white'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white'
              } focus:outline-none focus:ring-2 focus:ring-blue-500 transition`}
              placeholder="+91 9876543210"
            />
          </div>
          {errors.mobile && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.mobile}</p>}
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Gender</label>
          <select
            value={formData.gender || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                gender: (e.target.value as Gender) || null,
              })
            }
            className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition"
          >
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
            <option value="prefer_not">Prefer not to say</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Date of Birth</label>
          <input
            type="date"
            value={formData.date_of_birth || ''}
            onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
            className={`w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border ${
              errors.date_of_birth
                ? 'border-red-400 ring-1 ring-red-400 bg-red-50/20 dark:bg-red-950/20 text-slate-900 dark:text-white'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white'
            } focus:outline-none focus:ring-2 focus:ring-blue-500 transition`}
          />
          {errors.date_of_birth && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.date_of_birth}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
            Current Location
          </label>
          <input
            type="text"
            value={formData.current_location || ''}
            onChange={(e) => setFormData({ ...formData, current_location: e.target.value })}
            className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            placeholder="e.g. Bengaluru, Karnataka"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Current Company</label>
          <input
            type="text"
            value={formData.current_company || ''}
            onChange={(e) => setFormData({ ...formData, current_company: e.target.value })}
            className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            placeholder="e.g. Acme Corp"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Notice Period</label>
          <select
            value={formData.notice_period || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                notice_period: (e.target.value as NoticePeriod) || null,
              })
            }
            className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          >
            <option value="">Select Notice Period</option>
            <option value="immediate">Immediate Joining</option>
            <option value="15">15 Days</option>
            <option value="30">30 Days (1 Month)</option>
            <option value="60">60 Days (2 Months)</option>
            <option value="90_plus">90+ Days (3+ Months)</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Current Address</label>
          <textarea
            rows={3}
            value={formData.current_address || ''}
            onChange={(e) => setFormData({ ...formData, current_address: e.target.value })}
            className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition"
            placeholder="Street address, City, Postal Code"
          />
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition disabled:opacity-50 active:scale-95"
        >
          {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save Bio Information
        </button>
      </div>
    </form>
  );
}
