/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../context/AppContext';
import { ATTENDANCE_STATUS_CONFIG, AttendanceStatus, AttendanceRecord } from '../types';
import { Flame, CheckCircle, HelpCircle, Briefcase, Clock, FileText, ArrowUpRight } from 'lucide-react';

interface DashboardScreenProps {
  onMarkDateClick: (date: string) => void;
  onChangeTab: (tab: string) => void;
}

export default function DashboardScreen({ onMarkDateClick, onChangeTab }: DashboardScreenProps) {
  const { attendance, profile, currentStreak, longestStreak } = useApp();

  // Get date in YYYY-MM-DD
  const todayObj = new Date();
  const todayStr = todayObj.toISOString().split('T')[0];

  const hasMarkedToday = !!attendance[todayStr];
  const todayRecord = attendance[todayStr];

  // Helper stats for "All-Time" or "This Month"
  // Let's calculate for ALL-TIME logs in the system to populate counts
  const allLogs = Object.values(attendance) as AttendanceRecord[];
  const totalLogsCount = allLogs.length;

  const countByStatus = (status: AttendanceStatus) => {
    return allLogs.filter(log => log.status === status).length;
  };

  const presentCount = countByStatus('Present');
  const absentCount = countByStatus('Absent');

  // Attendance rate calculation (Present = Working Days)
  const totalWorkingDays = presentCount;
  const attendanceRate = totalLogsCount > 0 
    ? Math.round((totalWorkingDays / totalLogsCount) * 100)
    : 100;

  // Formatting date nicely
  // e.g. "Friday, 12 June 2026"
  const getFormattedDate = () => {
    return todayObj.toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      {/* 1. Welcome section */}
      <div className="flex justify-between items-center bg-transparent">
        <div>
          <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">
            WORKTRACK DASHBOARD
          </p>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight mt-0.5">
            Hello, {profile.name || 'Alex Mercer'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
            <span className="font-semibold">{profile.companyName || 'Starlight Tech Inc.'}</span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span>Shift: {profile.officeStart} - {profile.officeEnd}</span>
          </p>
        </div>
        <div className="flex-shrink-0 w-11 h-11 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-full flex items-center justify-center text-white font-black text-sm shadow-md shadow-indigo-500/10 border-2 border-white dark:border-slate-800">
          {(profile.name || 'A').charAt(0).toUpperCase()}
        </div>
      </div>

      {/* Date Card & Quick Actions */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 to-indigo-950 p-6 text-white shadow-xl">
        <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
          <div>
            <span className="text-[10px] font-bold tracking-widest uppercase text-indigo-300 bg-indigo-500/20 px-2.5 py-1 rounded-full backdrop-blur-sm">
              Today's Status
            </span>
            <h2 className="text-lg font-bold mt-2.5">{getFormattedDate()}</h2>
          </div>

          <div className="flex items-center justify-between pt-2">
            {hasMarkedToday ? (
              <div className="flex items-center space-x-3.5 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/5 w-full">
                <span className="text-2xl">
                  {ATTENDANCE_STATUS_CONFIG[todayRecord.status]?.emoji || '🟢'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-indigo-200 uppercase tracking-wider font-semibold">Today's Log</p>
                  <p className="font-bold text-sm text-white">{todayRecord.status}</p>
                </div>
                <button
                  onClick={() => onMarkDateClick(todayStr)}
                  className="bg-white text-indigo-950 text-xs font-bold px-4 py-2 rounded-xl hover:bg-indigo-50 transition-colors"
                >
                  Edit Log
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/5 w-full gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                  <div>
                    <p className="font-bold text-sm">Attendance Unmarked</p>
                    <p className="text-xs text-indigo-200">Keep your streak going!</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onMarkDateClick(todayStr)}
                  className="w-full sm:w-auto text-center bg-white text-indigo-950 text-xs font-bold px-5 py-3 rounded-xl hover:bg-indigo-50 transition-colors cursor-pointer"
                >
                  Mark Today
                </button>
              </div>
            )}
          </div>
        </div>
        {/* Background visual graphics */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-56 h-56 rounded-full bg-violet-600/25 blur-3xl pointer-events-none" />
      </div>

      {/* Stats Section with Main Attendance rate and current streak */}
      <div className="grid grid-cols-2 gap-4">
        {/* Streak card */}
        <div className="flex flex-col justify-between p-5 rounded-3xl bg-amber-500/10 border border-amber-500/10 text-slate-800 dark:text-amber-50 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500">
              <Flame className="w-6 h-6 fill-current" />
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">Streak Record</span>
              <p className="text-[11px] text-slate-400 dark:text-slate-400">Max: {longestStreak} days</p>
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
              {currentStreak} <span className="text-sm font-medium">Days</span>
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
              Active consecutive logged working days
            </p>
          </div>
        </div>

        {/* Rate card */}
        <div className="flex flex-col justify-between p-5 rounded-3xl bg-indigo-500/10 border border-indigo-500/10 text-slate-800 dark:text-indigo-50 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400">Attendance</span>
              <p className="text-[11px] text-slate-400 dark:text-slate-400">Total logs: {totalLogsCount}</p>
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
              {attendanceRate}%
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
              Percentage of presents or equivalent working days
            </p>
          </div>
        </div>
      </div>

      {/* Grid of All Status Counts */}
      <div className="space-y-3">
        <div className="flex justify-between items-baseline">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Attendance Log Breakdowns
          </h3>
          <button 
            onClick={() => onChangeTab('Analytics')}
            className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            Analytics details <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Present */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium font-mono">
              <span>🟢</span>
              <span className="truncate">Present</span>
            </div>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-50 mt-2.5">{presentCount}</p>
          </div>

          {/* Absent */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium font-mono">
              <span>🔴</span>
              <span className="truncate">Absent</span>
            </div>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-50 mt-2.5">{absentCount}</p>
          </div>
        </div>
      </div>

      {/* Daily Notes & Logs Logged History */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Recent Log Details
        </h3>
        
        <div className="space-y-2.5">
          {allLogs.length === 0 ? (
            <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-900/30 text-center text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800">
              <p className="text-sm">No notes logged yet.</p>
              <p className="text-xs mt-1">Attendance records with notes will appear here.</p>
            </div>
          ) : (
            allLogs
              .sort((a, b) => b.date.localeCompare(a.date))
              .slice(0, 3)
              .map(record => {
                const conf = ATTENDANCE_STATUS_CONFIG[record.status] || ATTENDANCE_STATUS_CONFIG['Present'];
                return (
                  <div
                    key={record.date}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/85 shadow-sm flex justify-between items-start gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                          {new Date(record.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${conf.color}/10 ${conf.textColor} ${conf.borderColor}`}>
                          {record.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 font-medium flex items-center gap-1.5">
                        <FileText className="w-3 h-3 flex-shrink-0" />
                        {record.note ? (
                          <span className="truncate italic">"{record.note}"</span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-600">No notes written for this day.</span>
                        )}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => onMarkDateClick(record.date)}
                      className="p-1 px-2.5 text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg border border-indigo-100 dark:border-indigo-950 transition-all cursor-pointer"
                    >
                      Update
                    </button>
                  </div>
                );
              })
          )}
        </div>
      </div>
    </div>
  );
}
