/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ATTENDANCE_STATUS_CONFIG, AttendanceStatus, AttendanceRecord } from '../types';
import { 
  ChevronLeft, ChevronRight, Search, CalendarDays, 
  FileText, Sparkles, AlertCircle, CircleCheck, CheckCircle2, TrendingUp 
} from 'lucide-react';

interface CalendarScreenProps {
  onMarkDateClick: (date: string) => void;
}

export default function CalendarScreen({ onMarkDateClick }: CalendarScreenProps) {
  const { attendance } = useApp();
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth()); // 0-indexed
  
  // State for selected calendar cell date (YYYY-MM-DD)
  const [selectedDateStr, setSelectedDateStr] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // State for search query
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Calendar logic helpers
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay(); // 0 is Sunday
  };

  const handlePrevMonth = () => {
    setCurrentMonth(prev => {
      if (prev === 0) {
        setCurrentYear(y => y - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => {
      if (prev === 11) {
        setCurrentYear(y => y + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  // Generate calendar days array
  const calendarGrid = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const startOffset = getFirstDayOfMonth(currentYear, currentMonth);
    const cells: { dateStr: string | null; isCurrentMonth: boolean; dayNum: number | null }[] = [];

    // Fill offset with empty spaces but styled minimalistically for balance
    for (let i = 0; i < startOffset; i++) {
      cells.push({ dateStr: null, isCurrentMonth: false, dayNum: null });
    }

    // Fill actual month days
    for (let d = 1; d <= daysInMonth; d++) {
      const monthFormatted = String(currentMonth + 1).padStart(2, '0');
      const dayFormatted = String(d).padStart(2, '0');
      const dateStr = `${currentYear}-${monthFormatted}-${dayFormatted}`;
      cells.push({ dateStr, isCurrentMonth: true, dayNum: d });
    }

    return cells;
  }, [currentYear, currentMonth]);

  // Calculate real-time month specific stats
  const visibleMonthStats = useMemo(() => {
    const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    const allRecords = Object.values(attendance) as AttendanceRecord[];
    const monthRecords = allRecords.filter(r => r.date.startsWith(monthPrefix));
    
    const presents = monthRecords.filter(r => r.status === 'Present').length;
    const absents = monthRecords.filter(r => r.status === 'Absent').length;
    
    const totalDaysInMonth = getDaysInMonth(currentYear, currentMonth);
    // Ignore weekends for percentage if you want, or keep simple ratio of absolute logs
    const rate = monthRecords.length > 0 
      ? Math.round((presents / monthRecords.length) * 100) 
      : 0;

    return { presents, absents, totalLogged: monthRecords.length, rate };
  }, [attendance, currentYear, currentMonth]);

  // Selected date record details
  const selectedRecord = attendance[selectedDateStr];

  // Search Results
  const searchResults = useMemo(() => {
    if (!searchQuery && statusFilter === 'All') return [];
    
    const recordsList = Object.values(attendance) as AttendanceRecord[];
    return recordsList.filter(record => {
      const recordDate = new Date(record.date);
      const friendlyDate = recordDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
      
      const textMatches = searchQuery === '' || 
        record.date.includes(searchQuery) ||
        friendlyDate.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (record.note && record.note.toLowerCase().includes(searchQuery.toLowerCase())) ||
        record.status.toLowerCase().includes(searchQuery.toLowerCase());

      const statusMatches = statusFilter === 'All' || record.status === statusFilter;

      return textMatches && statusMatches;
    }).sort((a, b) => b.date.localeCompare(a.date)); // descending dates
  }, [attendance, searchQuery, statusFilter]);

  return (
    <div className="space-y-6 pb-20 animate-fade-in text-slate-800 dark:text-slate-100">
      
      {/* Search Header Container with colourful high-contrast accent ring */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-4 rounded-3xl shadow-md space-y-3 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-pink-500/5 rounded-full blur-xl pointer-events-none" />
        
        <label htmlFor="calendar-search-box" className="sr-only">Search Attendance</label>
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <input
            id="calendar-search-box"
            type="text"
            placeholder="Search keywords, logs, dates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-55 focus:border-indigo-500 transition-all font-medium"
          />
        </div>

        {/* Status Quick Filter Horizontal Scroller with beautifully colored tags */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {['All', 'Present', 'Absent'].map(f => {
            let activeClass = '';
            if (f === 'All') activeClass = 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-500/15 border-transparent';
            else if (f === 'Present') activeClass = 'bg-emerald-500 text-white shadow-md shadow-emerald-500/15 border-transparent';
            else if (f === 'Absent') activeClass = 'bg-rose-500 text-white shadow-md shadow-rose-500/15 border-transparent';

            const isActive = statusFilter === f;

            return (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold cursor-pointer border transition-all duration-200 ${
                  isActive
                    ? activeClass
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100'
                }`}
              >
                {f === 'Present' ? '🟢 Present' : f === 'Absent' ? '🔴 Absent' : '✨ All Logs'}
              </button>
            );
          })}
        </div>
      </div>

      {searchQuery || statusFilter !== 'All' ? (
        /* Search Query list view panel */
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
              Found {searchResults.length} Match{searchResults.length === 1 ? '' : 'es'}
            </h3>
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('All');
              }}
              className="text-xs text-indigo-500 dark:text-indigo-400 font-extrabold hover:underline"
            >
              Reset Filters
            </button>
          </div>

          <div className="space-y-2.5">
            {searchResults.length === 0 ? (
              <div className="p-12 rounded-3xl text-center text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 shadow-sm relative overflow-hidden">
                <CalendarDays className="w-10 h-10 mx-auto text-rose-400 dark:text-rose-500/70 mb-3" />
                <p className="text-sm font-bold text-slate-800 dark:text-slate-150">No results found</p>
                <p className="text-xs text-slate-400 dark:text-slate-600 mt-1">Try keywords or shift filters.</p>
              </div>
            ) : (
              searchResults.map(record => {
                const conf = ATTENDANCE_STATUS_CONFIG[record.status] || ATTENDANCE_STATUS_CONFIG['Present'];
                return (
                  <div
                    key={record.date}
                    onClick={() => {
                      setSelectedDateStr(record.date);
                      setSearchQuery('');
                      setStatusFilter('All');
                    }}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 shadow-sm flex items-center justify-between gap-3 cursor-pointer hover:border-indigo-500 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-all duration-200 active:scale-[0.99]"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                          {new Date(record.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <span className={`text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full border ${conf.color}/10 ${conf.textColor} ${conf.borderColor}`}>
                          {record.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1.5">
                        <FileText className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        <span className="truncate max-w-[200px]">{record.note ? `"${record.note}"` : 'No custom description.'}</span>
                      </p>
                    </div>
                    <span className="text-xl p-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">{conf.emoji}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* Unique Colorful Standard Monthly Calendar */
        <div className="space-y-4">
          
          {/* Main Calendar Body Card - High contrast, glowing gradient border offsets, colourful theme */}
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 rounded-3xl shadow-xl p-4.5 space-y-4 relative overflow-hidden group">
            
            {/* Embedded glowing colorful blobs underneath for premium depth */}
            <div className="absolute top-0 left-0 w-36 h-36 bg-gradient-to-tr from-pink-500/10 to-transparent rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-36 h-36 bg-gradient-to-tr from-emerald-500/10 to-transparent rounded-full blur-2xl pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            
            {/* Header control toolbar */}
            <div className="flex justify-between items-center px-1 z-10 relative">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-pink-500 animate-pulse" /> UNIQUE WORK PLANNER
                </span>
                <h2 className="font-extrabold text-xl text-slate-900 dark:text-slate-50 tracking-tight mt-0.5 bg-gradient-to-r from-indigo-600 via-pink-600 to-purple-600 dark:from-white dark:via-indigo-300 dark:to-violet-200 bg-clip-text text-transparent">
                  {months[currentMonth]} {currentYear}
                </h2>
              </div>
              <div className="flex items-center space-x-1 bg-slate-50 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-150 dark:border-slate-800/80 shadow-inner">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-900 hover:shadow-sm text-slate-500 dark:text-slate-300 transition-all cursor-pointer active:scale-90"
                  title="Previous month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="w-px h-4 bg-slate-200 dark:bg-slate-800" />
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-900 hover:shadow-sm text-slate-500 dark:text-slate-300 transition-all cursor-pointer active:scale-90"
                  title="Next month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Micro Dashboard Widget (Dynamic Colorful month breakdown bar) */}
            <div className="p-3 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5 dark:from-indigo-950/20 dark:via-purple-950/20 dark:to-pink-950/20 rounded-2xl border border-indigo-100/40 dark:border-indigo-900/45 flex items-center justify-between gap-2 z-10 relative text-[11px] shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-bold text-slate-700 dark:text-slate-300">Present</span>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-450 font-mono bg-emerald-100/40 dark:bg-emerald-950/40 px-2 py-0.5 rounded-lg border border-emerald-500/20">{visibleMonthStats.presents}d</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                  <span className="font-bold text-slate-700 dark:text-slate-300">Absent</span>
                  <span className="font-extrabold text-rose-600 dark:text-rose-450 font-mono bg-rose-100/40 dark:bg-rose-950/40 px-2 py-0.5 rounded-lg border border-rose-500/20">{visibleMonthStats.absents}d</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-1 px-2.5 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full font-black text-[10px] tracking-wide uppercase border border-indigo-500/10">
                <TrendingUp className="w-3.5 h-3.5 animate-bounce" />
                <span className="font-mono">{visibleMonthStats.rate}% Rate</span>
              </div>
            </div>

            {/* Grid structure */}
            <div className="space-y-2.5 z-10 relative">
              {/* Colorful Weekday head indicators with unique styling per day */}
              <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-black uppercase tracking-widest pb-1">
                <span className="p-1.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-500/10">Sun</span>
                <span className="p-1.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-500/10">Mon</span>
                <span className="p-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-500/10">Tue</span>
                <span className="p-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-500 rounded-xl border border-amber-500/10">Wed</span>
                <span className="p-1.5 bg-pink-500/10 text-pink-600 dark:text-pink-400 rounded-xl border border-pink-500/10">Thu</span>
                <span className="p-1.5 bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-xl border border-teal-500/10">Fri</span>
                <span className="p-1.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl border border-purple-500/10">Sat</span>
              </div>

              {/* Day cells grid */}
              <div className="grid grid-cols-7 gap-2 pt-1.5">
                {calendarGrid.map((cell, idx) => {
                  if (!cell.dateStr) {
                    // Preceding days are styled using subtle dotted borders for neat grid aesthetics
                    return (
                      <div 
                        key={`empty-${idx}`} 
                        className="aspect-square rounded-2xl border border-dashed border-slate-100 dark:border-slate-800/40 opacity-40" 
                      />
                    );
                  }

                  const dateRecord = attendance[cell.dateStr];
                  const isSelected = selectedDateStr === cell.dateStr;
                  const isTodayStr = cell.dateStr === new Date().toISOString().split('T')[0];

                  const cellDateObj = new Date(cell.dateStr);
                  const isWeekend = cellDateObj.getDay() === 0 || cellDateObj.getDay() === 6;

                  let cellClass = '';
                  let emojiBubble = null;

                  if (dateRecord) {
                    if (dateRecord.status === 'Present') {
                      cellClass = `
                        bg-gradient-to-br from-emerald-450/20 via-emerald-500/10 to-teal-500/10
                        border-emerald-500 text-emerald-700 dark:text-emerald-450 
                        shadow-md shadow-emerald-500/10 hover:from-emerald-500/25 hover:to-teal-500/20
                      `;
                      emojiBubble = '🔴'; // using dynamic glowing visual bullet indicators
                    } else if (dateRecord.status === 'Absent') {
                      cellClass = `
                        bg-gradient-to-br from-rose-450/20 via-rose-500/10 to-pink-500/10
                        border-rose-550 text-rose-700 dark:text-rose-450
                        shadow-md shadow-rose-500/10 hover:from-rose-500/25 hover:to-pink-500/20
                      `;
                      emojiBubble = '⚪';
                    }
                  } else {
                    // Clean glassy days with no logs - custom tints for weekends!
                    if (isWeekend) {
                      cellClass = `
                        bg-amber-50/40 dark:bg-amber-950/10 
                        border-amber-200/50 dark:border-amber-900/25 
                        text-slate-400 dark:text-slate-500 
                        hover:bg-amber-100/60 dark:hover:bg-amber-900/35 hover:scale-105 active:scale-95
                      `;
                    } else {
                      cellClass = `
                        bg-slate-50/60 dark:bg-slate-900/40 
                        border-slate-100 dark:border-slate-800 
                        text-slate-700 dark:text-slate-300 
                        hover:bg-slate-100/90 dark:hover:bg-slate-800/80 hover:scale-105 active:scale-95
                      `;
                    }
                  }

                  // Super selective overlay for active selected focus cell
                  if (isSelected) {
                    cellClass += `
                      !border-purple-600 dark:!border-purple-400 
                      ring-4 ring-purple-500/35 dark:ring-purple-400/35 
                      shadow-xl shadow-purple-500/20 scale-[1.08] z-20 font-black
                    `;
                  }

                  // Animated dynamic glowing border for today
                  const isTodayClass = isTodayStr 
                    ? 'after:absolute after:top-1 after:right-1 after:w-2 after:after:h-2 after:bg-indigo-600 dark:after:bg-indigo-400 after:rounded-full after:animate-bounce border-indigo-600 dark:border-indigo-400 shadow-md ring-2 ring-indigo-500/15' 
                    : '';

                  return (
                    <button
                      key={cell.dateStr}
                      onClick={() => setSelectedDateStr(cell.dateStr!)}
                      className={`relative aspect-square flex flex-col items-center justify-center rounded-2xl text-xs font-black border transition-all duration-250 ${cellClass} ${isTodayClass}`}
                    >
                      <span className={isTodayStr ? 'text-indigo-600 dark:text-indigo-400 font-extrabold' : ''}>
                        {cell.dayNum}
                      </span>
                      
                      {/* Attendance indicator point (Only renders if status exists in db) with colorful micro dots! */}
                      {dateRecord && (
                        <div className="absolute bottom-1.5 flex items-center justify-center space-x-0.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${dateRecord.status === 'Present' ? 'bg-emerald-500 shadow-sm shadow-emerald-400' : 'bg-rose-500 shadow-sm shadow-rose-450'}`} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Selected Date Details Card - highly immersive colors, dynamically responds to status! */}
          <div className={`p-5 rounded-3xl shadow-md border transition-all duration-300 relative overflow-hidden ${
            selectedRecord 
              ? selectedRecord.status === 'Present'
                ? 'bg-gradient-to-tr from-white to-emerald-50/15 dark:from-slate-900 dark:to-emerald-950/10 border-emerald-500/20 shadow-emerald-500/5'
                : 'bg-gradient-to-tr from-white to-rose-50/15 dark:from-slate-900 dark:to-rose-950/10 border-rose-500/20 shadow-rose-500/5'
              : 'bg-white dark:bg-slate-900 border-slate-150 dark:border-slate-800/80'
          }`}>
            
            {/* Embedded graphics */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

            <div className="flex justify-between items-start z-10 relative">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-indigo-400">Selected Date Details</span>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 mt-0.5">
                  {new Date(selectedDateStr).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </h3>
              </div>

              {selectedRecord && (
                <div className="p-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 font-mono text-base flex items-center justify-center">
                  {ATTENDANCE_STATUS_CONFIG[selectedRecord.status]?.emoji || '🟢'}
                </div>
              )}
            </div>

            <div className="mt-4 z-10 relative">
              {selectedRecord ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Status:</span>
                    <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${(ATTENDANCE_STATUS_CONFIG[selectedRecord.status] || ATTENDANCE_STATUS_CONFIG['Present']).color}/10 ${(ATTENDANCE_STATUS_CONFIG[selectedRecord.status] || ATTENDANCE_STATUS_CONFIG['Present']).textColor} ${(ATTENDANCE_STATUS_CONFIG[selectedRecord.status] || ATTENDANCE_STATUS_CONFIG['Present']).borderColor} flex items-center gap-1.5`}>
                      {selectedRecord.status === 'Present' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                      {selectedRecord.status}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Description / Notes:</span>
                    <div className="text-xs text-slate-700 dark:text-slate-200 bg-slate-50/80 dark:bg-slate-950/80 p-3.5 rounded-2xl min-h-[3.5rem] italic leading-relaxed border border-slate-100 dark:border-slate-800/80 shadow-sm">
                      {selectedRecord.note ? `"${selectedRecord.note}"` : 'No custom notes logged for this entry.'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-7 rounded-2xl bg-dashed border border-slate-200 dark:border-slate-800 text-center text-slate-400 dark:text-slate-500">
                  <CalendarDays className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2 animate-bounce" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No attendance logged</p>
                  <p className="text-[10px] mt-1 text-slate-400">Click the action button below to update this date.</p>
                </div>
              )}

              <button
                onClick={() => onMarkDateClick(selectedDateStr)}
                className="w-full mt-4 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-xs font-black shadow-md shadow-indigo-500/15 hover:from-indigo-600 hover:to-violet-700 transition-all duration-200 active:scale-[0.98] select-none cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {selectedRecord ? 'Update Daily Log' : 'Create Attendance Log'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
