'use client';

import React from 'react';

export function JobCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm animate-pulse flex flex-col justify-between gap-6">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-5 w-24 bg-slate-200 rounded-full"></div>
          <div className="h-5 w-20 bg-slate-100 rounded-full"></div>
        </div>
        <div className="h-7 w-3/4 bg-slate-200 rounded-md"></div>
        <div className="flex flex-wrap gap-4 pt-1">
          <div className="h-4 w-28 bg-slate-100 rounded"></div>
          <div className="h-4 w-24 bg-slate-100 rounded"></div>
          <div className="h-4 w-20 bg-slate-100 rounded"></div>
        </div>
      </div>
      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <div className="h-8 w-20 bg-slate-100 rounded-lg"></div>
        <div className="h-8 w-24 bg-slate-200 rounded-lg"></div>
      </div>
    </div>
  );
}

export function JobDetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      <div className="h-4 w-40 bg-slate-200 rounded mb-6"></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 space-y-4">
            <div className="flex gap-2">
              <div className="h-6 w-28 bg-slate-200 rounded-full"></div>
              <div className="h-6 w-20 bg-slate-100 rounded-full"></div>
            </div>
            <div className="h-10 w-4/5 bg-slate-200 rounded-lg"></div>
            <div className="flex gap-4 pt-2">
              <div className="h-4 w-28 bg-slate-100 rounded"></div>
              <div className="h-4 w-24 bg-slate-100 rounded"></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-8 space-y-4">
            <div className="h-6 w-48 bg-slate-200 rounded"></div>
            <div className="h-4 w-full bg-slate-100 rounded"></div>
            <div className="h-4 w-full bg-slate-100 rounded"></div>
            <div className="h-4 w-3/4 bg-slate-100 rounded"></div>
            <div className="h-6 w-40 bg-slate-200 rounded pt-4"></div>
            <div className="h-4 w-full bg-slate-100 rounded"></div>
            <div className="h-4 w-5/6 bg-slate-100 rounded"></div>
          </div>
        </div>
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
            <div className="h-6 w-32 bg-slate-200 rounded"></div>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex justify-between">
                  <div className="h-4 w-24 bg-slate-100 rounded"></div>
                  <div className="h-4 w-28 bg-slate-200 rounded"></div>
                </div>
              ))}
            </div>
            <div className="h-11 w-full bg-slate-200 rounded-lg"></div>
            <div className="h-10 w-full bg-slate-100 rounded-lg"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
