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

export function Header() {
  const { user, logout, isLoading } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isCareersActive = pathname === '/jobs' || pathname.startsWith('/jobs/');
  const isApplicationsActive = pathname.startsWith('/applications');
  const isProfileActive = pathname === '/profile';
  const isAdminActive = pathname.startsWith('/admin');

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-8">
          <Link href="/" className="group flex items-center gap-3 transition-transform duration-200 active:scale-95">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 text-white shadow-md shadow-blue-500/20 ring-1 ring-white/20 transition-all group-hover:shadow-blue-500/30">
              <Briefcase className="h-5 w-5 transition-transform group-hover:scale-110" />
              <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-extrabold tracking-tight text-slate-900 leading-none group-hover:text-blue-600 transition-colors">
                TalentBridge
              </span>
              <span className="text-[10px] font-semibold text-slate-600 tracking-wider uppercase mt-0.5">
                Candidate Sourcing OS
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200/60 text-xs font-semibold text-slate-600">
            <Link
              href="/jobs"
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
                isCareersActive
                  ? 'bg-white text-blue-600 shadow-sm font-bold'
                  : 'hover:text-slate-900 hover:bg-white/60'
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
                      ? 'bg-white text-blue-600 shadow-sm font-bold'
                      : 'hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <FileCheck2 className="h-3.5 w-3.5" />
                  <span>My Applications</span>
                </Link>

                <Link
                  href="/profile"
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
                    isProfileActive
                      ? 'bg-white text-blue-600 shadow-sm font-bold'
                      : 'hover:text-slate-900 hover:bg-white/60'
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
                    : 'text-indigo-700 hover:bg-blue-50'
                }`}
              >
                <Shield className="h-3.5 w-3.5" />
                <span>Admin Console</span>
              </Link>
            )}
          </nav>
        </div>

        {/* Right: Auth Controls & Profile */}
        <div className="flex items-center gap-3">
          {isLoading ? (
            <div className="h-8 w-28 bg-slate-200/60 animate-pulse rounded-xl" />
          ) : user ? (
            <div className="flex items-center gap-2.5">
              {user.role === 'admin' && <NotificationBell />}

              <div className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-slate-100/90 border border-slate-200/80 text-xs text-slate-800 shadow-inner">
                <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-[11px] uppercase shadow-sm">
                  {user.first_name?.[0] || 'U'}
                </div>
                <span className="font-semibold text-slate-800 hidden sm:inline">
                  {user.first_name} {user.last_name}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  user.role === 'admin'
                    ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                    : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                }`}>
                  {user.role}
                </span>
              </div>

              <button
                onClick={() => logout()}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-red-600 transition px-3 py-2 rounded-xl hover:bg-red-50 active:scale-95"
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
                className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-blue-600 rounded-xl hover:bg-slate-100 transition active:scale-95"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 transition shadow-sm shadow-blue-500/20 active:scale-95"
              >
                <span>Create Account</span>
                <Sparkles className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white/95 backdrop-blur-xl px-4 py-3 space-y-2 animate-in slide-in-from-top-2">
          <Link
            href="/jobs"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600"
          >
            <Compass className="h-4 w-4" />
            <span>Explore Roles</span>
          </Link>
          {user?.role === 'candidate' && (
            <>
              <Link
                href="/applications"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600"
              >
                <FileCheck2 className="h-4 w-4" />
                <span>My Applications</span>
              </Link>
              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600"
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
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-indigo-700 bg-indigo-50"
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
