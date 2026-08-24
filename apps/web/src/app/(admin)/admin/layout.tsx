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
    <div className="min-h-screen flex flex-col bg-slate-100/70 text-slate-900">
      {/* Admin Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Left: Brand + Badge */}
          <div className="flex items-center gap-6">
            <Link href="/admin/requisitions" className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow">
                <Briefcase className="h-5 w-5" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-white">TalentBridge</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[11px] font-bold uppercase tracking-wider">
                  <Shield className="h-3 w-3" />
                  Admin
                </span>
              </div>
            </Link>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href === '/admin/requisitions' && pathname.startsWith('/admin/requisitions'));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
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
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white transition px-2.5 py-1.5 rounded-lg hover:bg-slate-800"
              title="Open Public Career Portal"
            >
              <span>View Public Portal</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>

            <div className="h-5 w-[1px] bg-slate-700 hidden sm:block" />

            {isLoading ? (
              <div className="h-7 w-20 bg-slate-800 animate-pulse rounded"></div>
            ) : user ? (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <span className="text-xs font-bold text-white block">
                    {user.first_name} {user.last_name}
                  </span>
                  <span className="text-[11px] text-slate-400 block font-mono">{user.email}</span>
                </div>
                <button
                  onClick={() => logout()}
                  className="p-2 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition"
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
          <span>TalentBridge Internal Recruitment Console &middot; v1.0.0</span>
          <span className="text-slate-400 font-mono text-[11px]">Phase 3: Active</span>
        </div>
      </footer>
    </div>
  );
}
