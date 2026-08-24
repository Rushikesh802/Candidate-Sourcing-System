'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { JobCard } from '@/components/JobCard';
import { JobFilters } from '@/components/JobFilters';
import { JobCardSkeleton } from '@/components/JobSkeleton';
import { Job } from '@/types/job';
import { fetchApi } from '@/lib/api';
import { Briefcase, Sparkles, AlertCircle, RefreshCw, Compass } from 'lucide-react';

function JobListingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search and filter state initialized from URL query params
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [department, setDepartment] = useState(searchParams.get('department') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [experience, setExperience] = useState(searchParams.get('experience') || '');

  // Fetch published jobs
  useEffect(() => {
    let isMounted = true;

    async function loadJobs() {
      setIsLoading(true);
      setError(null);
      try {
        const query = new URLSearchParams();
        if (search) query.set('q', search);
        if (department) query.set('department', department);
        if (location) query.set('location', location);
        if (experience) query.set('experience', experience);

        const queryString = query.toString() ? `?${query.toString()}` : '';
        const res = await fetchApi<Job[] | { items: Job[] }>(`/api/v1/jobs${queryString}`);

        if (isMounted) {
          if (res.data) {
            const jobList = Array.isArray(res.data)
              ? res.data
              : Array.isArray((res.data as any).items)
              ? (res.data as any).items
              : [];
            setJobs(jobList);
          } else if (res.error) {
            setJobs([]);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Failed to load open positions.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadJobs();

    return () => {
      isMounted = false;
    };
  }, [search, department, location, experience]);

  // Sync state changes with URL query string
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (department) params.set('department', department);
    if (location) params.set('location', location);
    if (experience) params.set('experience', experience);

    const qs = params.toString();
    const target = qs ? `/jobs?${qs}` : '/jobs';
    window.history.replaceState(null, '', target);
  }, [search, department, location, experience]);

  // Extract filter dropdown options
  const departmentsList = useMemo(() => {
    const depts = new Set<string>([
      'Engineering',
      'Product',
      'Design',
      'Sales',
      'Marketing',
      'Human Resources',
      'Finance',
      'Operations',
      'Customer Success',
    ]);
    jobs.forEach((j) => {
      if (j.department) depts.add(j.department);
    });
    return Array.from(depts).sort();
  }, [jobs]);

  const locationsList = useMemo(() => {
    const locs = new Set<string>(['Remote', 'San Francisco, CA', 'New York, NY', 'Austin, TX', 'Bengaluru, India', 'London, UK']);
    jobs.forEach((j) => {
      if (j.location) locs.add(j.location);
    });
    return Array.from(locs).sort();
  }, [jobs]);

  const experienceList = useMemo(() => {
    const exps = new Set<string>(['Fresher / Entry Level', '1-3 years', '3-5 years', '5-8 years', '8+ years']);
    jobs.forEach((j) => {
      if (j.experience_range) exps.add(j.experience_range);
    });
    return Array.from(exps).sort();
  }, [jobs]);

  // Client-side filtering as backup / instant filter
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (search) {
        const q = search.toLowerCase();
        const matchesTitle = job.title?.toLowerCase().includes(q);
        const matchesDept = job.department?.toLowerCase().includes(q);
        const matchesLoc = job.location?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDept && !matchesLoc) return false;
      }
      if (department && job.department?.toLowerCase() !== department.toLowerCase()) {
        return false;
      }
      if (location) {
        if (location.toLowerCase() === 'remote') {
          if (!job.location?.toLowerCase().includes('remote')) return false;
        } else if (job.location?.toLowerCase() !== location.toLowerCase()) {
          return false;
        }
      }
      if (experience && job.experience_range?.toLowerCase() !== experience.toLowerCase()) {
        return false;
      }
      return true;
    });
  }, [jobs, search, department, location, experience]);

  const handleResetFilters = () => {
    setSearch('');
    setDepartment('');
    setLocation('');
    setExperience('');
    router.push('/jobs');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-blue-500 selection:text-white transition-colors duration-200">
      <Header />

      {/* Hero Banner with Ambient Radial Mesh */}
      <section className="relative overflow-hidden bg-slate-950 text-white py-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="absolute inset-0 bg-mesh-dark opacity-90 pointer-events-none" />
        <div className="absolute inset-0 bg-grid-dark opacity-20 pointer-events-none" />
        
        <div className="relative max-w-5xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-bold tracking-wider uppercase backdrop-blur-md">
            <Compass className="h-3.5 w-3.5 text-blue-400" />
            <span>Open Career Opportunities</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            Explore Open Requisitions
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto font-medium">
            Browse verified openings, review direct compensation & team requirements, and apply instantly with your reusable candidate profile.
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        {/* Filters Dock */}
        <JobFilters
          search={search}
          onSearchChange={setSearch}
          department={department}
          onDepartmentChange={setDepartment}
          location={location}
          onLocationChange={setLocation}
          experience={experience}
          onExperienceChange={setExperience}
          onReset={handleResetFilters}
          departmentsList={departmentsList}
          locationsList={locationsList}
          experienceList={experienceList}
          totalResults={filteredJobs.length}
        />

        {/* Error Notification */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 flex items-center justify-between gap-3 text-xs font-semibold">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-1 text-red-700 dark:text-red-300 hover:underline font-bold"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Job Cards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <JobCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredJobs.map((job) => (
              <JobCard key={job.id || job.slug} job={job} />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center max-w-md mx-auto my-12 shadow-sm space-y-4">
            <div className="h-16 w-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto border border-blue-100 dark:border-blue-800 shadow-inner">
              <Briefcase className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              No matching positions found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              {search || department || location || experience
                ? "No open requisitions matched your selected filters. Try broadening your keywords or resetting filters."
                : 'There are currently no published positions available. Check back soon for new openings!'}
            </p>
            {(search || department || location || experience) && (
              <button
                onClick={handleResetFilters}
                className="px-5 py-2.5 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm"
              >
                Reset all filters
              </button>
            )}
          </div>
        )}
      </main>

      {/* Modern Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500 dark:text-slate-400">
        <p>&copy; {new Date().getFullYear()} TalentBridge Inc. Candidate Sourcing System. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default function PublicJobsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
          <Header />
          <div className="flex-1 flex items-center justify-center p-12">
            <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      }
    >
      <JobListingsContent />
    </Suspense>
  );
}