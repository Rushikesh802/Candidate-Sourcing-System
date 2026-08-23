'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Briefcase, LogOut, User as UserIcon, Shield } from 'lucide-react';

export function Header() {
  const { user, logout, isLoading } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <Briefcase className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              TalentBridge
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-4 text-sm font-medium text-slate-600">
            <Link href="/jobs" className="hover:text-blue-600 transition">
              Careers
            </Link>
            {user?.role === 'candidate' && (
              <>
                <Link href="/applications" className="hover:text-blue-600 transition">
                  My Applications
                </Link>
                <Link href="/profile" className="hover:text-blue-600 transition">
                  Profile
                </Link>
              </>
            )}
            {user?.role === 'admin' && (
              <Link href="/admin" className="hover:text-blue-600 transition flex items-center gap-1.5 text-blue-700 font-semibold">
                <Shield className="h-4 w-4" />
                Admin Console
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {isLoading ? (
            <div className="h-8 w-24 bg-slate-100 animate-pulse rounded-md"></div>
          ) : user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-700">
                <UserIcon className="h-3.5 w-3.5 text-slate-500" />
                <span className="font-medium">{user.first_name} {user.last_name}</span>
                <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-semibold text-[10px] uppercase">
                  {user.role}
                </span>
              </div>
              <button
                onClick={() => logout()}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-red-600 transition px-2.5 py-1.5 rounded-md hover:bg-slate-100"
                title="Log out"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3.5 py-1.5 text-sm font-medium text-slate-700 hover:text-blue-600 transition"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="px-4 py-1.5 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
