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
  Zap,
  Code2,
  Cpu,
  BarChart3,
  Users2,
  CheckCircle2,
  Building2,
  Terminal,
  Lock,
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

  const categoryCards = [
    { title: 'Engineering & Systems', count: '12 open roles', icon: Code2, q: 'Engineering' },
    { title: 'AI & Data Science', count: '8 open roles', icon: Cpu, q: 'AI' },
    { title: 'Product & Design', count: '6 open roles', icon: Sparkles, q: 'Product' },
    { title: 'Sales & Growth', count: '5 open roles', icon: BarChart3, q: 'Sales' },
    { title: 'People & Operations', count: '4 open roles', icon: Users2, q: 'Operations' },
    { title: 'Remote Anywhere', count: '15+ open roles', icon: Zap, q: 'Remote' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-blue-500 selection:text-white transition-colors duration-200">
      <Header />

      {/* Hero Viewport */}
      <section className="relative overflow-hidden bg-slate-950 text-white pt-24 pb-28 px-4 sm:px-6 lg:px-8 border-b border-slate-800/80">
        {/* Ambient Radial Mesh Gradients */}
        <div className="absolute inset-0 bg-mesh-dark opacity-90 pointer-events-none" />
        <div className="absolute inset-0 bg-grid-dark opacity-30 pointer-events-none" />
        
        <div className="relative max-w-5xl mx-auto text-center space-y-8">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 backdrop-blur-md text-blue-300 text-xs font-bold tracking-wide">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>TALENTBRIDGE • DIRECT CANDIDATE SOURCING OS</span>
          </div>

          {/* Core Thesis Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-4xl mx-auto leading-[1.08]">
            Direct sourcing for high-impact teams.{' '}
            <span className="gradient-text-brand">Zero black-box recruiting.</span>
          </h1>

          <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto font-medium leading-relaxed">
            Direct hiring manager reviews, standardized candidate profiles with instant application tracking, and verified company requisitions.
          </p>

          {/* Frosted Glass Search Dock */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto pt-2">
            <div className="flex flex-col sm:flex-row items-center gap-2.5 p-2 bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-white/15 shadow-2xl shadow-blue-950/50">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Job title, technical skill, or department..."
                  className="w-full pl-12 pr-4 py-3.5 bg-white/10 text-white placeholder-slate-400 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/40 border border-white/10"
                />
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-blue-600/30 shrink-0 flex items-center justify-center gap-2 active:scale-95"
              >
                <span>Find Positions</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-6 max-w-2xl mx-auto text-left">
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="text-xl font-black text-white">100%</div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Direct Manager Review</div>
            </div>
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="text-xl font-black text-blue-400">4-Step</div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Reusable Candidate Profile</div>
            </div>
            <div className="col-span-2 sm:col-span-1 p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="text-xl font-black text-emerald-400">&lt; 48 hrs</div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Average Status Feedback</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Job Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
              <Layers className="h-3.5 w-3.5" />
              <span>Explore Ecosystem</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Active Career Disciplines
            </h2>
          </div>
          <Link
            href="/jobs"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition"
          >
            <span>View all open requisitions</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoryCards.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.title}
                href={`/jobs?q=${encodeURIComponent(cat.q)}`}
                className="group flex items-center justify-between p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-sm hover:border-blue-300 dark:hover:border-blue-500/50 hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-800 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {cat.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{cat.count}</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
              </Link>
            );
          })}
        </div>
      </section>

      {/* 3 Pillars Architecture */}
      <section className="bg-slate-100/70 dark:bg-slate-900/50 border-y border-slate-200/80 dark:border-slate-800/80 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              A Purpose-Built Talent Infrastructure
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Designed with precision for seamless candidate applications and recruiter velocity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pillar 1 */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-7 shadow-sm flex flex-col justify-between">
              <div>
                <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-5 border border-blue-100 dark:border-blue-800">
                  <Briefcase className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Verified Requisitions</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Every position is directly linked to an internal requisition code, department headcount, and assigned hiring manager.
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
                <Link
                  href="/jobs"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                >
                  <span>Browse Jobs</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-7 shadow-sm flex flex-col justify-between">
              <div>
                <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-5 border border-emerald-100 dark:border-emerald-800">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">4-Step Express Apply</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Build your candidate profile once (bio, education, experience) and apply to multiple positions with one-click snapshot generation.
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
                <Link
                  href={user ? "/profile" : "/register"}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300"
                >
                  <span>{user ? "Manage Profile" : "Create Account"}</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-7 shadow-sm flex flex-col justify-between">
              <div>
                <div className="h-12 w-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-5 border border-indigo-100 dark:border-indigo-800">
                  <Shield className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Recruiter Control Center</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Hiring managers can draft, publish, duplicate, evaluate applicants, and trigger real-time candidate notifications.
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
                <Link
                  href={user?.role === 'admin' ? "/admin/requisitions" : "/login"}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                >
                  <span>{user?.role === 'admin' ? "Admin Portal" : "Recruiter Login"}</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
              <Briefcase className="h-4 w-4" />
            </div>
            <span className="font-bold text-slate-800 dark:text-slate-200">TalentBridge</span>
            <span>&copy; {new Date().getFullYear()} Candidate Sourcing Platform</span>
          </div>

          <div className="flex items-center gap-6 font-semibold">
            <Link href="/jobs" className="hover:text-blue-600 dark:hover:text-blue-400 transition">Careers Portal</Link>
            <Link href="/login" className="hover:text-blue-600 dark:hover:text-blue-400 transition">Candidate Sign In</Link>
            <Link href="/register" className="hover:text-blue-600 dark:hover:text-blue-400 transition">Register</Link>
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-800/60">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>All Systems Operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}