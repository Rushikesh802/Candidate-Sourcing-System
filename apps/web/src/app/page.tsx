'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import {
  Briefcase,
  Search,
  ArrowRight,
  ShieldCheck,
  Clock,
  Sparkles,
  Layers,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const { user } = useAuth();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/jobs?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/jobs');
    }
  };

  const popularRoles = [
    { label: 'Engineering', q: 'Engineering' },
    { label: 'Product & Design', q: 'Product' },
    { label: 'Remote Only', q: 'Remote' },
    { label: 'Marketing', q: 'Marketing' },
    { label: 'Operations', q: 'Operations' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-900 via-slate-900 to-slate-950 text-white pt-20 pb-24 px-4 sm:px-6 lg:px-8 border-b border-blue-900/40">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="h-3.5 w-3.5 text-blue-400" />
            Empowering Next-Gen Talent & Organizations
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
            Connecting exceptional talent with world-class teams
          </h1>

          <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Discover verified career opportunities with direct hiring manager reviews, streamlined candidate profiles, and real-time application tracking.
          </p>

          {/* Quick Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto pt-4">
            <div className="flex flex-col sm:flex-row items-center gap-2.5 p-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Job title, department, or keyword..."
                  className="w-full pl-11 pr-4 py-3 bg-white text-slate-900 placeholder-slate-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition shadow-lg shrink-0 flex items-center justify-center gap-2"
              >
                <span>Search Jobs</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>

          {/* Popular Categories */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs text-slate-400">
            <span>Popular searches:</span>
            {popularRoles.map((role) => (
              <Link
                key={role.label}
                href={`/jobs?q=${encodeURIComponent(role.q)}`}
                className="px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition"
              >
                {role.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 -mt-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition">
            <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 border border-blue-100">
              <Briefcase className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1.5">Direct Job Sourcing</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Browse published positions published directly by verified internal hiring managers with no third-party spam.
            </p>
            <Link
              href="/jobs"
              className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800"
            >
              <span>Explore open positions</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition">
            <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 border border-emerald-100">
              <Clock className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1.5">Streamlined 4-Step Apply</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Reusable candidate profile saves bio, education, and experience for instant 1-click apply across positions.
            </p>
            <Link
              href={user ? "/profile" : "/register"}
              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-800"
            >
              <span>{user ? "View your profile" : "Create candidate account"}</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition">
            <div className="h-12 w-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 border border-purple-100">
              <Shield className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1.5">Admin Management Console</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Create, draft, publish, edit, duplicate, and monitor job requisitions with comprehensive applicant tracking.
            </p>
            <Link
              href={user?.role === 'admin' ? "/admin/requisitions" : "/login"}
              className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 hover:text-purple-800"
            >
              <span>{user?.role === 'admin' ? "Open Admin Console" : "Recruiter Login"}</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-8 px-4 text-center text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} TalentBridge Inc. Candidate Sourcing System. All rights reserved.</p>
      </footer>
    </div>
  );
}
