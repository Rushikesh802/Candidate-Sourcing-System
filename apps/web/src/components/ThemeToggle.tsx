'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { Sun, Moon, Monitor } from 'lucide-react';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className={`h-8 w-8 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse ${className}`} />;
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative p-2 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all active:scale-95 shadow-sm ${className}`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode (current: ${theme})`}
      aria-label="Toggle theme"
    >
      <div className="relative h-4 w-4">
        <Sun className={`h-4 w-4 transition-all duration-300 transform ${isDark ? 'scale-0 rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100 text-amber-500'}`} />
        <Moon className={`absolute inset-0 h-4 w-4 transition-all duration-300 transform ${isDark ? 'scale-100 rotate-0 opacity-100 text-blue-400' : 'scale-0 -rotate-90 opacity-0'}`} />
      </div>
    </button>
  );
}