'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Briefcase,
  FileText,
  Users,
  Bell,
  LogOut,
  ExternalLink,
  Shield,
  Layers,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  interface NavItem {
    label: string;
    href: string;
    icon: any;
    badge?: string;
  }

  const navItems: NavItem[] = [
    { label: 'Requisitions', href: '/admin/requisitions', icon: Layers },
    { label: 'Applications', href: '/admin/applications', icon: Users },
    { label: 'Notifications', href: '/admin/notifications', icon: Bell },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/70 text-slate-900 selection:bg-blue-500 selection:text-white">
      {/* Admin Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-xl text-white border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Left: Brand + Badge */}
          <div className="flex items-center gap-6">
            <Link href="/admin/requisitions" className="flex items-center gap-3 group active:scale-95 transition-transform">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 ring-1 ring-white/10">
                <Briefcase className="h-5 w-5" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black tracking-tight text-white">TalentBridge</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-400/20 text-[10px] font-extrabold uppercase tracking-wider">
                  <Shield className="h-3 w-3 text-blue-400" />
                  Admin OS
                </span>
              </div>
            </Link>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-xl border border-slate-800 text-xs font-semibold text-slate-400">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href === '/admin/requisitions' && pathname.startsWith('/admin/requisitions'));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm font-bold'
                        : 'hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right: Public Site Link + User Details + Logout */}
          <div className="flex items-center gap-4">
            <Link
              href="/jobs"
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition px-3 py-1.5 rounded-xl border border-slate-800 hover:bg-slate-900"
              title="Open Public Career Portal"
            >
              <span>Public Portal</span>
              <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
            </Link>

            <div className="h-5 w-[1px] bg-slate-800 hidden sm:block" />

            {isLoading ? (
              <div className="h-8 w-24 bg-slate-800 animate-pulse rounded-xl" />
            ) : user ? (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <span className="text-xs font-bold text-white block">
                    {user.first_name} {user.last_name}
                  </span>
                  <span className="text-[10px] text-slate-400 block font-mono">{user.email}</span>
                </div>
                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs shadow">
                  {user.first_name?.[0] || 'A'}
                </div>
                <button
                  onClick={() => logout()}
                  className="p-2 text-slate-400 hover:text-red-400 rounded-xl hover:bg-slate-900 transition active:scale-95"
                  title="Sign out of Admin Console"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>

      {/* Admin Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="font-medium text-slate-600">TalentBridge Internal Recruitment Console &middot; v2.0 Modern OS</span>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-400 font-mono text-[11px]">System Live</span>
          </div>
        </div>
      </footer>
    </div>
  );
}