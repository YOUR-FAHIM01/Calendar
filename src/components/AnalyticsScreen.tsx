/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ATTENDANCE_STATUS_CONFIG, AttendanceStatus } from '../types';
import { TrendingUp, Award, Calendar, Percent, CalendarRange, Clock } from 'lucide-react';

export default function AnalyticsScreen() {
  const { attendance, currentStreak, longestStreak } = useApp();
  const [activeYear, setActiveYear] = useState(() => new Date().getFullYear());

  const monthsList = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  // Helper arrays for calculating dates and stats
  const allRecords = useMemo(() => Object.values(attendance), [attendance]);

  const yearRecords = useMemo(() => {
    return allRecords.filter(r => r.date.startsWith(String(activeYear)));
  }, [allRecords, activeYear]);

  // Overall Statistics calculations
  const totalLogs = yearRecords.length;
  const presentCount = yearRecords.filter(r => r.status === 'Present').length;
  const absentCount = yearRecords.filter(r => r.status === 'Absent').length;

  const totalWorkingDays = presentCount;
  const attendanceRate = totalLogs > 0 ? Math.round((totalWorkingDays / totalLogs) * 100) : 100;

  // Monthly stats for the year
  const monthlyStats = useMemo(() => {
    const stats = Array.from({ length: 12 }, (_, i) => {
      const monthPrefix = `${activeYear}-${String(i + 1).padStart(2, '0')}`;
      const recordsForMonth = yearRecords.filter(r => r.date.startsWith(monthPrefix));
      
      const presents = recordsForMonth.filter(r => r.status === 'Present').length;
      const absents = recordsForMonth.filter(r => r.status === 'Absent').length;
      const total = recordsForMonth.length;

      const working = presents;
      const rate = total > 0 ? Math.round((working / total) * 100) : 0;

      return {
        monthIndex: i,
        monthName: monthsList[i],
        presents, absents, total, rate, working
      };
    });

    return stats;
  }, [yearRecords, activeYear]);

  // Insights Calculations: Best & Worst Months, Perfect Months
  const insights = useMemo(() => {
    const loggedMonths = monthlyStats.filter(m => m.total > 0);
    if (loggedMonths.length === 0) {
      return {
        bestMonth: 'None',
        worstMonth: 'None',
        perfectMonths: [] as string[]
      };
    }

    const sortedByRate = [...loggedMonths].sort((a, b) => b.rate - a.rate);
    const bestMonth = `${sortedByRate[0].monthName} (${sortedByRate[0].rate}%)`;
    const worstMonth = `${sortedByRate[sortedByRate.length - 1].monthName} (${sortedByRate[sortedByRate.length - 1].rate}%)`;

    // A perfect month has 0 absents AND some log entries (e.g. 10+)
    const perfectMonths = loggedMonths
      .filter(m => m.absents === 0 && m.working > 0)
      .map(m => m.monthName);

    return { bestMonth, worstMonth, perfectMonths };
  }, [monthlyStats]);

  // --- Year Heatmap (GitHub Contribution Graph style) ---
  // Calculates columns of weeks. Each column is an array of 7 days (Sunday - Saturday)
  const heatmapData = useMemo(() => {
    const data: { dateStr: string; dayIndex: number; record?: any }[][] = [];
    
    // Start of the active year
    const startOfYear = new Date(activeYear, 0, 1);
    const firstDayOfWeek = startOfYear.getDay(); // 0 is Sunday, 6 is Saturday

    // Calculate backward to the beginning of the first Sunday
    const firstSunday = new Date(startOfYear);
    firstSunday.setDate(startOfYear.getDate() - firstDayOfWeek);

    // End of active year
    const endOfYear = new Date(activeYear, 11, 31);
    const lastDayOfWeek = endOfYear.getDay();

    const lastSaturday = new Date(endOfYear);
    lastSaturday.setDate(endOfYear.getDate() + (6 - lastDayOfWeek));

    // Fill days
    let current = new Date(firstSunday);
    let currentWeek: { dateStr: string; dayIndex: number; record?: any }[] = [];

    while (current <= lastSaturday) {
      const dateStr = current.toISOString().split('T')[0];
      const isInYear = current.getFullYear() === activeYear;
      
      currentWeek.push({
        dateStr,
        dayIndex: current.getDay(),
        record: isInYear ? attendance[dateStr] : undefined
      });

      if (current.getDay() === 6) {
        data.push(currentWeek);
        currentWeek = [];
      }

      current.setDate(current.getDate() + 1);
    }

    if (currentWeek.length > 0) {
      data.push(currentWeek);
    }

    return data;
  }, [attendance, activeYear]);

  // SVG Chart Helper calculations (Pie Ratio slices)
  const pieSlices = useMemo(() => {
    const totalWorkingForRatios = presentCount + absentCount;
    if (totalWorkingForRatios === 0) return [];

    let accumulatedAngle = 0;
    const slices = [
      { label: 'Present', count: presentCount, color: '#10b981' },
      { label: 'Absent', count: absentCount, color: '#f43f5e' }
    ].filter(s => s.count > 0);

    return slices.map(s => {
      const percentage = (s.count / totalWorkingForRatios) * 100;
      const angle = (s.count / totalWorkingForRatios) * 360;
      const currentStart = accumulatedAngle;
      accumulatedAngle += angle;
      return {
        ...s,
        percentage: Math.round(percentage),
        startAngle: currentStart,
        endAngle: accumulatedAngle
      };
    });
  }, [presentCount, absentCount]);

  // Render SVG Path for Donut Slice
  const getDonutSlicePath = (startAngle: number, endAngle: number, radius: number, innerRadius: number, cx: number, cy: number) => {
    const rad = Math.PI / 180;
    
    const x1 = cx + radius * Math.cos(startAngle * rad);
    const y1 = cy + radius * Math.sin(startAngle * rad);
    const x2 = cx + radius * Math.cos(endAngle * rad);
    const y2 = cy + radius * Math.sin(endAngle * rad);
    
    const ix1 = cx + innerRadius * Math.cos(endAngle * rad);
    const iy1 = cy + innerRadius * Math.sin(endAngle * rad);
    const ix2 = cx + innerRadius * Math.cos(startAngle * rad);
    const iy2 = cy + innerRadius * Math.sin(startAngle * rad);
    
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
    
    return [
      `M ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      `L ${ix1} ${iy1}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${ix2} ${iy2}`,
      'Z'
    ].join(' ');
  };

  return (
    <div className="space-y-6 pb-20 animate-fade-in text-slate-800 dark:text-slate-100">
      {/* Year Selector */}
      <div className="flex justify-between items-center bg-transparent">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-50 tracking-tight">Analytics Dashboard</h2>
          <p className="text-xs text-slate-400 font-medium">Yearly metrics & charts</p>
        </div>
        <select
          aria-label="Select Year"
          value={activeYear}
          onChange={(e) => setActiveYear(Number(e.target.value))}
          className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-xs font-bold shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/30 cursor-pointer"
        >
          <option value="2026">2026</option>
          <option value="2025">2025</option>
          <option value="2024">2024</option>
        </select>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Year logs */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center space-x-2 text-indigo-500">
            <CalendarRange className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Marked Days</span>
          </div>
          <p className="text-2xl font-black text-slate-950 dark:text-slate-100 tracking-tight mt-1">{totalLogs}</p>
        </div>

        {/* Attendance Rate */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center space-x-2 text-emerald-500">
            <Percent className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Attended Rate</span>
          </div>
          <p className="text-2xl font-black text-slate-950 dark:text-slate-100 tracking-tight mt-1">{attendanceRate}%</p>
        </div>

        {/* Streaks */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center space-x-2 text-amber-500">
            <Clock className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Streak</span>
          </div>
          <p className="text-2xl font-black text-slate-950 dark:text-slate-100 tracking-tight mt-1">{currentStreak}d</p>
        </div>

        {/* Longest Streaks */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 shadow-sm col-span-1">
          <div className="flex items-center space-x-2 text-yellow-500">
            <Award className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Max Streak</span>
          </div>
          <p className="text-2xl font-black text-slate-950 dark:text-slate-100 tracking-tight mt-1">{longestStreak}d</p>
        </div>
      </div>

      {/* GitHub Heatmap Grid Card */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/85 shadow-sm space-y-4">
        <div>
          <h3 className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-slate-50">Yearly Attendance Grid Heatmap</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">365-day contribution style map formatted for {activeYear}</p>
        </div>

        <div className="overflow-x-auto no-scrollbar pt-1">
          <div className="inline-grid grid-rows-7 grid-flow-col gap-[3px] min-w-max pb-2.5">
            {heatmapData.map((week, colIdx) => (
              <React.Fragment key={`week-${colIdx}`}>
                {week.map((cell, rowIdx) => {
                  let colorClass = 'bg-slate-100 dark:bg-slate-800/60';
                  let titleTip = `${new Date(cell.dateStr).toLocaleDateString()}: No log`;

                  if (cell.record) {
                    const statusVal = cell.record.status;
                    titleTip = `${new Date(cell.dateStr).toLocaleDateString()}: ${statusVal}`;
                    colorClass = (ATTENDANCE_STATUS_CONFIG[statusVal] || ATTENDANCE_STATUS_CONFIG['Present']).color;
                  }

                  return (
                    <div
                      key={`day-${colIdx}-${rowIdx}`}
                      className={`w-[11px] h-[11px] rounded-[3px] transition-colors relative group border border-black/[0.02] dark:border-white/[0.01] ${colorClass}`}
                      title={titleTip}
                    >
                      {/* Tooltip on hover */}
                      <span className="pointer-events-none absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] p-2 leading-none whitespace-nowrap rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-20">
                        {titleTip}
                      </span>
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Heatmap Legend */}
        <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-1.5 border-t border-slate-100 dark:border-slate-800/70 gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center space-x-1.5">
              <div className="w-2.5 h-2.5 rounded bg-emerald-500" />
              <span>Present</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <div className="w-2.5 h-2.5 rounded bg-rose-500" />
              <span>Absent</span>
            </div>
            <div className="flex items-center space-x-1.5 font-medium">
              <div className="w-2.5 h-2.5 rounded bg-slate-100 dark:bg-slate-800" />
              <span>Unmarked</span>
            </div>
          </div>
        </div>
      </div>

      {/* Productivity Insights Card */}
      <div className="p-5 rounded-3xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-950/40 shadow-sm space-y-4">
        <div className="flex items-center space-x-2.5">
          <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="font-extrabold text-sm text-indigo-950 dark:text-indigo-200 uppercase tracking-wider">
            Productivity & Insights
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2.5 text-xs text-slate-600 dark:text-indigo-200/80">
            <div className="flex justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
              <span className="font-semibold text-slate-500">Best Attendance Month:</span>
              <span className="font-bold text-slate-800 dark:text-slate-100 text-right">{insights.bestMonth}</span>
            </div>
            <div className="flex justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
              <span className="font-semibold text-slate-500">Worst Attendance Month:</span>
              <span className="font-bold text-slate-800 dark:text-slate-100 text-right">{insights.worstMonth}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-center">
            <span className="font-semibold text-slate-400 text-xs">Perfect Attendance Months:</span>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {insights.perfectMonths.length === 0 ? (
                <span className="text-xs text-slate-400 italic">No perfect months logged this year.</span>
              ) : (
                insights.perfectMonths.map(month => (
                  <span
                    key={month}
                    className="text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-900 text-emerald-600 px-2 py-0.5 rounded-full"
                  >
                    🏆 {month}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Visual SVG Donut/Pie ratio + Monthly bar graph */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Pies Ratio */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 shadow-sm space-y-4">
          <div>
            <h3 className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-slate-50">Attendance Distribution Ratio</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Ratio distribution of logged work statuses</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-4.5">
            {pieSlices.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-8">Log data needed to load ratio chart.</p>
            ) : (
              <>
                {/* SVG Drawing of Donut */}
                <div className="relative w-36 h-36">
                  <svg width="144" height="144" viewBox="-72 -72 144 144" className="-rotate-90">
                    {pieSlices.map((slice, i) => {
                      const path = getDonutSlicePath(slice.startAngle, slice.endAngle, 65, 42, 0, 0);
                      return <path key={i} d={path} fill={slice.color} className="hover:opacity-90 transition-opacity" />;
                    })}
                  </svg>
                  {/* Center percentage rate */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xl font-black text-slate-900 dark:text-white leading-none">{attendanceRate}%</span>
                    <span className="text-[9px] text-slate-400 tracking-wider uppercase font-semibold mt-1">Working Rate</span>
                  </div>
                </div>

                {/* Slices legend */}
                <div className="space-y-1.5 flex-1 w-full text-xs">
                  {pieSlices.map((slice, i) => (
                    <div key={i} className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 p-1.5 px-3 rounded-xl border border-slate-100 dark:border-slate-805">
                      <div className="flex items-center space-x-2 font-medium">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: slice.color }} />
                        <span className="text-slate-500">{slice.label}</span>
                      </div>
                      <span className="font-bold text-slate-800 dark:text-slate-100">{slice.percentage}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Monthly comparative bars */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 shadow-sm space-y-4">
          <div>
            <h3 className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-slate-50">Monthly Comparison Graph</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Percentage level of attended working days by month</p>
          </div>

          <div className="flex items-end justify-between h-44 py-2 border-b border-l border-slate-100 dark:border-slate-800/70 pl-3 pr-2 select-none relative">
            {monthlyStats.map((ms, idx) => {
              const heightPercentage = ms.rate;
              return (
                <div key={idx} className="flex flex-col items-center flex-1 h-full justify-end group px-0.5 relative">
                  {/* Hover tooltip for percentage */}
                  <div className="absolute bottom-full mb-1 bg-slate-900 text-white text-[9px] p-1 px-1.5 leading-none rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-15 shadow-sm">
                    {ms.working} working / {ms.total} logs ({ms.rate}%)
                  </div>

                  {/* Visual Bar line */}
                  <div 
                    className="w-full max-w-[12px] rounded-t bg-indigo-500 hover:bg-slate-700 dark:hover:bg-slate-100 transition-all duration-300"
                    style={{ height: ms.total > 0 ? `${heightPercentage}%` : '5%' }}
                  />

                  {/* Label Month */}
                  <span className="text-[10px] font-bold text-slate-400 mt-2 select-none">
                    {ms.monthName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
