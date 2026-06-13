/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ATTENDANCE_STATUS_CONFIG, AttendanceRecord, AttendanceStatus } from '../types';
import { FileDown, Share2, Printer, CheckCircle, FileSpreadsheet, Eye, ClipboardCheck } from 'lucide-react';

export default function ReportsScreen() {
  const { attendance, profile } = useApp();
  const [selectedMonthStr, setSelectedMonthStr] = useState(() => {
    // default to current month YYYY-MM
    return new Date().toISOString().substring(0, 7);
  });

  const monthsDropdown = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  const yearsDropdown = ['2026', '2025', '2024'];

  const [filterYear, setFilterYear] = useState(() => selectedMonthStr.split('-')[0]);
  const [filterMonth, setFilterMonth] = useState(() => selectedMonthStr.split('-')[1]);

  const activeMonthStr = `${filterYear}-${filterMonth}`;

  // Filter logs for selected month
  const monthLogs = useMemo(() => {
    const recordsList = Object.values(attendance) as AttendanceRecord[];
    return recordsList
      .filter(r => r.date.startsWith(activeMonthStr))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [attendance, activeMonthStr]);

  // Report details calculations
  const totalLogs = monthLogs.length;

  const countForStatus = (status: AttendanceStatus) => {
    return monthLogs.filter(r => r.status === status).length;
  };

  const presents = countForStatus('Present');
  const absents = countForStatus('Absent');

  const totalWorkingDays = presents;
  const attendanceRate = totalLogs > 0 ? Math.round((totalWorkingDays / totalLogs) * 100) : 100;

  const getMonthNameFriendly = (mStr: string) => {
    const [y, m] = mStr.split('-');
    const mIdx = parseInt(m, 10) - 1;
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${months[mIdx]} ${y}`;
  };

  // HTML Print Report Generator
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up blocked! Please allow popups to generate printable report.');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>WorkTrack Attendance Report - ${getMonthNameFriendly(activeMonthStr)}</title>
        <style>
          body { font-family: 'Segoe UI', system-ui, sans-serif; padding: 40px; color: #1e293b; background: white; }
          .header { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 24px; margin-bottom: 30px; }
          .header h1 { margin: 0; color: #4338ca; font-size: 28px; }
          .header p { margin: 6px 0 0 0; color: #64748b; font-size: 14px; }
          .profile-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; background: #f8fafc; padding: 20px; rounded: 8px; border: 1px solid #e2e8f0; }
          .profile-item { font-size: 14px; }
          .profile-item strong { color: #475569; }
          .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 30px; }
          .metric-card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; text-align: center; background: #fafafb; }
          .metric-num { font-size: 24px; font-weight: bold; color: #1e1b4b; margin-top: 5px; }
          .metric-label { font-size: 11px; font-weight: bold; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { padding: 12px 16px; border-bottom: 1px solid #e2e8f0; text-align: left; font-size: 13px; }
          th { background: #f1f5f9; color: #475569; font-weight: bold; }
          tr:hover { background: #f8fafc; }
          .badge { display: inline-block; font-size: 11px; font-weight: bold; padding: 3px 8px; border-radius: 4px; }
          .Present { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
          .WFH { background: #f0f9ff; color: #075985; border: 1px solid #bae6fd; }
          .Late { background: #fff7ed; color: #9a3412; border: 1px solid #ffedd5; }
          .Leave { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
          .Absent { background: #fff1f2; color: #9f1239; border: 1px solid #fecdd3; }
          .status-color { font-weight: bold; }
          .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>WorkTrack Attendance Statement</h1>
          <p>Generated via Offline Personal WorkTrack Assistant</p>
        </div>

        <div class="profile-grid">
          <div class="profile-item"><strong>Employee Name:</strong> ${profile.name || 'Alex Mercer'}</div>
          <div class="profile-item"><strong>Company:</strong> ${profile.companyName || 'Starlight Tech Inc.'}</div>
          <div class="profile-item"><strong>Report Period:</strong> ${getMonthNameFriendly(activeMonthStr)}</div>
          <div class="profile-item"><strong>Office Regular Time:</strong> ${profile.officeStart} - ${profile.officeEnd}</div>
        </div>

        <h3 style="margin-bottom:15px;color:#334155;">Monthly Attendance Performance</h3>
        <div class="metrics">
          <div class="metric-card">
            <div class="metric-label">Working Days Logged</div>
            <div class="metric-num">${totalLogs}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Actual Attended</div>
            <div class="metric-num">${totalWorkingDays}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Total Absences</div>
            <div class="metric-num">${absents}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Attribution Rate</div>
            <div class="metric-num">${attendanceRate}%</div>
          </div>
        </div>

        <h3 style="margin-bottom:10px;color:#334155;">Detailed Log Records</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Work status</th>
              <th>Optional logs Notes</th>
              <th>Logged Timestamp</th>
            </tr>
          </thead>
          <tbody>
            ${monthLogs.length === 0 ? `
              <tr>
                <td colspan="4" style="text-align:center;color:#94a3b8;padding:30px;">No daily listings matching this month.</td>
              </tr>
            ` : monthLogs.map(r => `
              <tr>
                <td><strong>${new Date(r.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</strong></td>
                <td><span class="badge ${r.status}">${r.status}</span></td>
                <td>${r.note || '<span style="color:#cbd5e1;font-style:italic;">No custom note.</span>'}</td>
                <td style="color:#94a3b8;font-size:12px;">${new Date(r.createdAt).toLocaleTimeString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>WorkTrack - Private Offline Attendance Application. All local variables encrypted.</p>
        </div>

        <script>
          window.print();
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Markdown share generator
  const [copied, setCopied] = useState(false);
  const handleShareReport = () => {
    const formattedMarkdown = `
📋 *WorkTrack Attendance Statement*
📅 *Period:* ${getMonthNameFriendly(activeMonthStr)}
👤 *Employee:* ${profile.name}
🏢 *Company:* ${profile.companyName}

📊 *Attendance Metrics:*
- Total Logged Days: ${totalLogs}
- Attended Working Days: ${totalWorkingDays} (Present: ${presents})
- Unexcused Absents: ${absents}
⭐ *Overall Attendance Rate:* ${attendanceRate}%

📝 *Daily Notes Summary:*
${monthLogs.map(l => `- *${l.date}:* ${l.status}${l.note ? ` ("${l.note}")` : ''}`).join('\n')}

_Generated via WorkTrack Personal Attendance App (100% Offline)_
    `;

    navigator.clipboard.writeText(formattedMarkdown).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };

  return (
    <div className="space-y-6 pb-20 animate-fade-in text-slate-800 dark:text-slate-100">
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-slate-50 tracking-tight">Statements & Reports</h2>
        <p className="text-xs text-slate-400 font-medium">Generate, export, and share regular logs</p>
      </div>

      {/* Month Filter Selector */}
      <div className="p-4.5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
        <div>
          <h3 className="font-bold text-xs uppercase text-slate-400 tracking-wider">Select Reporting Period</h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="month-select" className="sr-only">Select Month</label>
            <select
              id="month-select"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-xs font-bold focus:outline-none cursor-pointer text-slate-800 dark:text-slate-100"
            >
              {monthsDropdown.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="year-select" className="sr-only">Select Year</label>
            <select
              id="year-select"
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-xs font-bold focus:outline-none cursor-pointer text-slate-800 dark:text-slate-100"
            >
              {yearsDropdown.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary statement sheet card */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/85 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold tracking-widest uppercase text-indigo-600 dark:text-indigo-400">
              STATEMENT OVERVIEW
            </span>
            <h2 className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight mt-1">
              {getMonthNameFriendly(activeMonthStr)}
            </h2>
            <p className="text-[10px] text-slate-400 font-medium">Total logged entries: {totalLogs}</p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center justify-center space-x-1.5 p-2.5 px-3.5 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/45 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 transition-all cursor-pointer"
              title="Print Statement PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Export PDF / Print</span>
            </button>

            <button
              onClick={handleShareReport}
              className={`flex items-center justify-center space-x-1.5 p-2.5 px-3.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                copied
                  ? 'bg-emerald-500 border-emerald-500 text-white'
                  : 'bg-white dark:bg-slate-900 hover:bg-slate-50 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300'
              }`}
              title="Share report markdown to clipboard"
            >
              {copied ? (
                <>
                  <ClipboardCheck className="w-4 h-4 text-white" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span>Share Statement</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Breakdown counters inside report page */}
        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100 dark:border-slate-850">
          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-805 font-mono">
            <span className="text-[9px] uppercase font-bold text-slate-400">Attended Ratio</span>
            <p className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">{attendanceRate}%</p>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-805 font-mono">
            <span className="text-[9px] uppercase font-bold text-slate-400">Total Present</span>
            <p className="text-lg font-extrabold text-emerald-500 mt-1">{presents} days</p>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-805 font-mono">
            <span className="text-[9px] uppercase font-bold text-slate-400">Total Absent</span>
            <p className="text-lg font-extrabold text-rose-500 mt-1">{absents} days</p>
          </div>
        </div>

        {/* Complete listing table for report */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Log itemization Details
          </h4>

          <div className="space-y-2">
            {monthLogs.length === 0 ? (
              <div className="p-10 rounded-2xl text-center bg-slate-50 dark:bg-slate-950/40 text-slate-400 border border-dashed border-slate-200 dark:border-slate-800/80">
                <FileSpreadsheet className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
                <p className="text-xs mt-2 font-bold">No attendance log records recorded for {getMonthNameFriendly(activeMonthStr)}.</p>
                <p className="text-[10px] text-slate-400 mt-1">Please insert records or choose alternative dates.</p>
              </div>
            ) : (
              monthLogs.map(l => {
                const conf = ATTENDANCE_STATUS_CONFIG[l.status] || ATTENDANCE_STATUS_CONFIG['Present'];
                return (
                  <div
                    key={l.date}
                    className="p-3.5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-850/80 shadow-sm flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2.5">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {new Date(l.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${conf.color}/10 ${conf.textColor} ${conf.borderColor}`}>
                          {l.status}
                        </span>
                      </div>
                      
                      {l.note && (
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 italic">
                          "{l.note}"
                        </p>
                      )}
                    </div>

                    <span className="text-lg flex-shrink-0">{conf.emoji}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
