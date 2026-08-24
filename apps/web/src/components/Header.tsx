'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Briefcase,
  LogOut,
  User as UserIcon,
  Shield,
  Sparkles,
  Layers,
  Menu,
  X,
  FileCheck2,
  UserCircle2,
  Compass,
} from 'lucide-react';
import { NotificationBell } from '@/components/admin/NotificationBell';
import { ThemeToggle } from '@/components/ThemeToggle';

export function Header() {
  const { user, logout, isLoading } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isCareersActive = pathname === '/jobs' || pathname.startsWith('/jobs/');
  const isApplicationsActive = pathname.startsWith('/applications');
  const isProfileActive = pathname === '/profile';
  const isAdminActive = pathname.startsWith('/admin');

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-8">
          <Link href="/" className="group flex items-center gap-3 transition-transform duration-200 active:scale-95">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 text-white shadow-md shadow-blue-500/20 ring-1 ring-white/20 transition-all group-hover:shadow-blue-500/30">
              <Briefcase className="h-5 w-5 transition-transform group-hover:scale-110" />
              <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-950" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white leading-none group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                TalentBridge
              </span>
              <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 tracking-wider uppercase mt-0.5">
                Candidate Sourcing OS
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 p-1 bg-slate-100/80 dark:bg-slate-900/80 rounded-xl border border-slate-200/60 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <Link
              href="/jobs"
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
                isCareersActive
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm font-bold'
                  : 'hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Compass className="h-3.5 w-3.5" />
              <span>Explore Roles</span>
            </Link>

            {user?.role === 'candidate' && (
              <>
                <Link
                  href="/applications"
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
                    isApplicationsActive
                      ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm font-bold'
                      : 'hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <FileCheck2 className="h-3.5 w-3.5" />
                  <span>My Applications</span>
                </Link>

                <Link
                  href="/profile"
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
                    isProfileActive
                      ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm font-bold'
                      : 'hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <UserCircle2 className="h-3.5 w-3.5" />
                  <span>Candidate Profile</span>
                </Link>
              </>
            )}

            {user?.role === 'admin' && (
              <Link
                href="/admin"
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
                  isAdminActive
                    ? 'bg-blue-600 text-white shadow-sm font-bold'
                    : 'text-indigo-700 dark:text-indigo-400 hover:bg-blue-50 dark:hover:bg-slate-800'
                }`}
              >
                <Shield className="h-3.5 w-3.5" />
                <span>Admin Console</span>
              </Link>
            )}
          </nav>
        </div>

        {/* Right: Theme Toggle + Auth Controls & Profile */}
        <div className="flex items-center gap-2.5">
          {/* Theme Toggle Button */}
          <ThemeToggle />

          {isLoading ? (
            <div className="h-8 w-28 bg-slate-200/60 dark:bg-slate-800 animate-pulse rounded-xl" />
          ) : user ? (
            <div className="flex items-center gap-2">
              {user.role === 'admin' && <NotificationBell />}

              <div className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-slate-100/90 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 shadow-inner">
                <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-[11px] uppercase shadow-sm">
                  {user.first_name?.[0] || 'U'}
                </div>
                <span className="font-semibold text-slate-800 dark:text-slate-200 hidden sm:inline">
                  {user.first_name} {user.last_name}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  user.role === 'admin'
                    ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                    : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                }`}>
                  {user.role}
                </span>
              </div>

              <button
                onClick={() => logout()}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition px-2.5 py-1.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 active:scale-95"
                title="Log out"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 transition shadow-sm shadow-blue-500/20 active:scale-95"
              >
                <span>Sign Up</span>
                <Sparkles className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 transition"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl px-4 py-3 space-y-2 animate-in slide-in-from-top-2">
          <Link
            href="/jobs"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600"
          >
            <Compass className="h-4 w-4" />
            <span>Explore Roles</span>
          </Link>
          {user?.role === 'candidate' && (
            <>
              <Link
                href="/applications"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600"
              >
                <FileCheck2 className="h-4 w-4" />
                <span>My Applications</span>
              </Link>
              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600"
              >
                <UserCircle2 className="h-4 w-4" />
                <span>Candidate Profile</span>
              </Link>
            </>
          )}
          {user?.role === 'admin' && (
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50"
            >
              <Shield className="h-4 w-4" />
              <span>Admin Console</span>
            </Link>
          )}
        </div>
      )}
    </header>
  );
}