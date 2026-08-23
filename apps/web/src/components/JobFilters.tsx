'use client';

import React from 'react';
import { Search, X, RotateCcw, Filter } from 'lucide-react';

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

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by job title, department, skills, or keywords..."
          className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-slate-50/50 hover:bg-white focus:bg-white"
        />
        {search && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 transition p-0.5 rounded"
            title="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filters Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Department Filter */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Department
          </label>
          <select
            value={department}
            onChange={(e) => onDepartmentChange(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
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
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Location
          </label>
          <select
            value={location}
            onChange={(e) => onLocationChange(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          >
            <option value="">All Locations</option>
            <option value="Remote">Remote</option>
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
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Experience Level
          </label>
          <select
            value={experience}
            onChange={(e) => onExperienceChange(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
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

      {/* Status bar and Reset */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 font-medium">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <span>
            Found <strong className="text-slate-800">{totalResults}</strong> open{' '}
            {totalResults === 1 ? 'position' : 'positions'}
          </span>
        </div>

        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline transition"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset filters</span>
          </button>
        )}
      </div>
    </div>
  );
}
