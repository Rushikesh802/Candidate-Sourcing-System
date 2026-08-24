'use client';

import React from 'react';
import { Search, X, RotateCcw, Filter, Building2, MapPin, Briefcase, Sparkles } from 'lucide-react';

interface JobFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  department: string;
  onDepartmentChange: (value: string) => void;
  location: string;
  onLocationChange: (value: string) => void;
  experience: string;
  onExperienceChange: (value: string) => void;
  onReset: () => void;
  departmentsList: string[];
  locationsList: string[];
  experienceList: string[];
  totalResults: number;
}

export function JobFilters({
  search,
  onSearchChange,
  department,
  onDepartmentChange,
  location,
  onLocationChange,
  experience,
  onExperienceChange,
  onReset,
  departmentsList,
  locationsList,
  experienceList,
  totalResults,
}: JobFiltersProps) {
  const hasActiveFilters = Boolean(search || department || location || experience);

  const quickFilterPills = [
    { label: 'Engineering', action: () => onDepartmentChange(department === 'Engineering' ? '' : 'Engineering'), active: department === 'Engineering' },
    { label: 'Product', action: () => onDepartmentChange(department === 'Product' ? '' : 'Product'), active: department === 'Product' },
    { label: 'Remote Only', action: () => onLocationChange(location === 'Remote' ? '' : 'Remote'), active: location === 'Remote' },
  ];

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-4">
      {/* Primary Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by job title, department, skills, or keywords..."
          className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
        />
        {search && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-3 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
            title="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Quick Filter Tag Chips */}
      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Quick:</span>
        {quickFilterPills.map((pill) => (
          <button
            key={pill.label}
            type="button"
            onClick={pill.action}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              pill.active
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 border border-slate-200/60'
            }`}
          >
            {pill.label}
          </button>
        ))}
      </div>

      {/* Dropdown Filters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        {/* Department Filter */}
        <div>
          <label className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            <Building2 className="h-3 w-3 text-slate-400" />
            <span>Department</span>
          </label>
          <select
            value={department}
            onChange={(e) => onDepartmentChange(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition cursor-pointer"
          >
            <option value="">All Departments</option>
            {departmentsList.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        {/* Location Filter */}
        <div>
          <label className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            <MapPin className="h-3 w-3 text-slate-400" />
            <span>Location</span>
          </label>
          <select
            value={location}
            onChange={(e) => onLocationChange(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition cursor-pointer"
          >
            <option value="">All Locations</option>
            <option value="Remote">🌐 Remote</option>
            {locationsList
              .filter((loc) => loc.toLowerCase() !== 'remote')
              .map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
          </select>
        </div>

        {/* Experience Level Filter */}
        <div>
          <label className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            <Briefcase className="h-3 w-3 text-slate-400" />
            <span>Experience Level</span>
          </label>
          <select
            value={experience}
            onChange={(e) => onExperienceChange(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition cursor-pointer"
          >
            <option value="">All Experience Levels</option>
            {experienceList.map((exp) => (
              <option key={exp} value={exp}>
                {exp}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Counter and Reset Button */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-2 text-slate-600 font-medium">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>
            Found <strong className="text-slate-900 font-bold">{totalResults}</strong> open{' '}
            {totalResults === 1 ? 'position' : 'positions'}
          </span>
        </div>

        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition px-2.5 py-1 rounded-lg hover:bg-blue-50"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>
    </div>
  );
}
