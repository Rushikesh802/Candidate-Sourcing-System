'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { JobCard } from '@/components/JobCard';
import { JobFilters } from '@/components/JobFilters';
import { JobCardSkeleton } from '@/components/JobSkeleton';
import { Job } from '@/types/job';
import { fetchApi } from '@/lib/api';
import { Briefcase, Sparkles, AlertCircle } from 'lucide-react';

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
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-900 via-blue-950 to-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8 border-b border-blue-900/50">
        <div className="max-w-5xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="h-3.5 w-3.5 text-blue-400" />
            TalentBridge Careers Portal
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            Find Your Next Opportunity at TalentBridge
          </h1>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-normal">
            Join our mission to transform recruitment technology. Discover roles where your skills will make a measurable impact from day one.
          </p>
        </div>
      </section>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Filters Section */}
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

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="text-xs font-bold underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Job Listings Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <JobCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredJobs.map((job) => (
              <JobCard key={job.id || job.slug} job={job} />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto my-8 shadow-sm">
            <div className="h-14 w-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 border border-blue-100">
              <Briefcase className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              No matching positions found
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              {search || department || location || experience
                ? "We couldn't find any open positions matching your search filters. Try adjusting your keywords or clearing filters."
                : 'There are currently no published openings available. Please check back soon!'}
            </p>
            {(search || department || location || experience) && (
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 px-4 text-center text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} TalentBridge Inc. All rights reserved. Equal Opportunity Employer.</p>
      </footer>
    </div>
  );
}

export default function PublicJobsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col bg-slate-50">
          <Header />
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      }
    >
      <JobListingsContent />
    </Suspense>
  );
}
