/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, Trophy, Bell, Calendar, X } from 'lucide-react';

export default function ToastContainer() {
  const { toasts, dismissToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4 space-y-2 pointer-events-none">
      {toasts.map((toast) => {
        let Icon = Bell;
        let colorClasses = 'bg-slate-900 border-slate-800 text-white';
        let accentLine = 'bg-indigo-500';

        if (toast.type === 'achievement') {
          Icon = Trophy;
          colorClasses = 'bg-white dark:bg-slate-900 border-yellow-200 dark:border-yellow-950/40 text-slate-800 dark:text-slate-100 shadow-xl';
          accentLine = 'bg-yellow-500';
        } else if (toast.type === 'streak') {
          Icon = Sparkles;
          colorClasses = 'bg-white dark:bg-slate-900 border-orange-200 dark:border-orange-950/40 text-slate-800 dark:text-slate-100 shadow-xl';
          accentLine = 'bg-orange-500';
        } else if (toast.type === 'reminder') {
          Icon = Calendar;
          colorClasses = 'bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-950/40 text-slate-800 dark:text-slate-100 shadow-xl';
          accentLine = 'bg-indigo-500';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto relative flex gap-3 p-4 rounded-2xl border ${colorClasses} shadow-lg transition-all duration-300 animate-slide-down overflow-hidden`}
          >
            {/* Left accent indicator */}
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${accentLine}`} />
            
            <div className="flex-1 flex gap-3 pl-1.5">
              <div className="flex-shrink-0 mt-0.5">
                <Icon className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-xs text-slate-950 dark:text-slate-50 line-clamp-1">
                  {toast.title}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">
                  {toast.message}
                </p>
              </div>
            </div>

            <button
              onClick={() => dismissToast(toast.id)}
              className="flex-shrink-0 p-0.5 self-start text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
