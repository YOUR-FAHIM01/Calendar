/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { UserProfile, AchievementBadge } from '../types';
import { 
  User, Building, Clock, Moon, Sun, Bell, 
  Trash2, Download, Upload, AlertTriangle, 
  CheckCircle, ShieldAlert, BadgeInfo, BellRing 
} from 'lucide-react';

export default function ProfileScreen() {
  const { 
    profile, updateProfile, badges, clearAllData, 
    importBackup, exportBackup, triggerSimulatedReminder 
  } = useApp();

  // Profile forms state
  const [name, setName] = useState(profile.name);
  const [companyName, setCompanyName] = useState(profile.companyName);
  const [officeStart, setOfficeStart] = useState(profile.officeStart);
  const [officeEnd, setOfficeEnd] = useState(profile.officeEnd);

  // Sync state if context loads late
  useEffect(() => {
    setName(profile.name);
    setCompanyName(profile.companyName);
    setOfficeStart(profile.officeStart);
    setOfficeEnd(profile.officeEnd);
  }, [profile]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Success states
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      ...profile,
      name,
      companyName,
      officeStart,
      officeEnd
    });
    setProfileSuccess(true);
    setTimeout(() => setProfileSuccess(false), 3000);
  };

  const handleExport = () => {
    const backupData = exportBackup();
    const blob = new Blob([backupData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `worktrack_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const txt = event.target?.result as string;
      const success = importBackup(txt);
      if (success) {
        setBackupSuccess(true);
        setTimeout(() => setBackupSuccess(false), 3000);
      } else {
        alert('Invalid backup file. Please make sure it is a valid WorkTrack JSON database file.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleReset = () => {
    const check = window.confirm('Are you absolutely sure you want to WIP OUT ALL your attendance logs? This action is offline-permanent and cannot be recovered.');
    if (check) {
      clearAllData();
      alert('All attendance records and configurations cleared successfully.');
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-fade-in text-slate-800 dark:text-slate-100">
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-slate-50 tracking-tight font-extrabold">Employee Profile & Settings</h2>
        <p className="text-xs text-slate-400 font-medium font-medium">Configure offline parameters, achievements, and backups</p>
      </div>

      {/* 1. Achievements Section */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 shadow-sm space-y-4">
        <div>
          <h3 className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-slate-50">Locked & Unlocked Badges</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">Your streak and logging achievements</p>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`p-3.5 rounded-2xl border flex items-center gap-3.5 transition-all ${
                badge.unlocked
                  ? 'bg-amber-500/5 border-amber-500/20'
                  : 'bg-slate-50/50 dark:bg-slate-950/30 border-slate-100 dark:border-slate-800 opacity-65'
              }`}
            >
              <div className="text-2xl flex-shrink-0">{badge.unlocked ? badge.emoji : '🔒'}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h4 className={`font-semibold text-xs leading-none ${badge.unlocked ? 'text-amber-800 dark:text-amber-400' : 'text-slate-600 dark:text-slate-400'}`}>
                    {badge.title}
                  </h4>
                  {badge.unlocked && (
                    <span className="text-[9px] font-black uppercase text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded-full leading-none">
                      Unlocked
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 leading-normal">
                  {badge.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Employee Profile Details Form */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 shadow-sm space-y-5">
        <div>
          <h3 className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-slate-50">Worktrack Profile Details</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">Your details are used in report sheets and welcome sections</p>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
          {profileSuccess && (
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 flex items-center space-x-2 font-semibold">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>Profile details updated locally!</span>
            </div>
          )}

          <div className="space-y-3">
            {/* Name */}
            <div>
              <label 
                htmlFor="profile-name-input"
                className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1.5"
              >
                Full Employee Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  id="profile-name-input"
                  type="text"
                  required
                  placeholder="e.g. Alex Mercer"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
                />
              </div>
            </div>

            {/* Company */}
            <div>
              <label 
                htmlFor="profile-company-input"
                className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1.5"
              >
                Office / Company Name
              </label>
              <div className="relative">
                <Building className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  id="profile-company-input"
                  type="text"
                  required
                  placeholder="e.g. Starlight Tech Inc."
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
                />
              </div>
            </div>

            {/* Office start/end hours */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label 
                  htmlFor="profile-start-input"
                  className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1.5"
                >
                  Office Start Hour
                </label>
                <div className="relative">
                  <Clock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    id="profile-start-input"
                    type="time"
                    required
                    value={officeStart}
                    onChange={(e) => setOfficeStart(e.target.value)}
                    className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
                  />
                </div>
              </div>
              <div>
                <label 
                  htmlFor="profile-end-input"
                  className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1.5"
                >
                  Office End Hour
                </label>
                <div className="relative">
                  <Clock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    id="profile-end-input"
                    type="time"
                    required
                    value={officeEnd}
                    onChange={(e) => setOfficeEnd(e.target.value)}
                    className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-indigo-600 dark:bg-indigo-500 text-white text-xs font-bold hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all select-none shadow-md shadow-indigo-500/5 cursor-pointer"
          >
            Save Profile Changes
          </button>
        </form>
      </div>

      {/* 3. Settings / Theme Controls */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 shadow-sm space-y-4">
        <div>
          <h3 className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-slate-50">Theme & Settings</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">Offline system indicators adjustments</p>
        </div>

        <div className="space-y-2.5 text-xs">
          {/* Light/Dark Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850">
            <div className="flex items-center space-x-3">
              <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-500">
                {profile.darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </div>
              <div>
                <span className="font-semibold block">Dark Interface Theme</span>
                <span className="text-[10px] text-slate-400">Reduce glare on screen</span>
              </div>
            </div>
            
            <button
              onClick={() => updateProfile({ ...profile, darkMode: !profile.darkMode })}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                profile.darkMode ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
              }`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                profile.darkMode ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Notifications Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850">
            <div className="flex items-center space-x-3">
              <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-500">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold block">Push Reminder Banners</span>
                <span className="text-[10px] text-slate-400">Trigger simulated sliding push warnings</span>
              </div>
            </div>

            <button
              onClick={() => updateProfile({ ...profile, notificationsEnabled: !profile.notificationsEnabled })}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                profile.notificationsEnabled ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
              }`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                profile.notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Notification Reminders Simulator Panel */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 shadow-sm space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-slate-50">Local Alerts Notification Simulator</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Trigger and test phone-style push warnings slide-downs</p>
          </div>
          <BellRing className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <button
            onClick={() => triggerSimulatedReminder('daily')}
            className="p-3 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/25 dark:hover:bg-indigo-950/45 text-indigo-600 dark:text-indigo-400 rounded-2xl text-left border border-indigo-100 dark:border-indigo-950/40 cursor-pointer transition-colors"
          >
            <span className="font-bold block text-[11px]">⏰ Daily Attendance</span>
            <span className="text-[9px] text-slate-400 dark:text-indigo-300 block mt-1">Prompt to mark today</span>
          </button>

          <button
            onClick={() => triggerSimulatedReminder('missing')}
            className="p-3 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/25 dark:hover:bg-indigo-950/45 text-indigo-600 dark:text-indigo-400 rounded-2xl text-left border border-indigo-100 dark:border-indigo-950/40 cursor-pointer transition-colors"
          >
            <span className="font-bold block text-[11px]">⚠️ Missing Log</span>
            <span className="text-[9px] text-slate-400 dark:text-indigo-300 block mt-1">Check yesterday's blanks</span>
          </button>

          <button
            onClick={() => triggerSimulatedReminder('monthly')}
            className="p-3 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/25 dark:hover:bg-indigo-950/45 text-indigo-600 dark:text-indigo-400 rounded-2xl text-left border border-indigo-100 dark:border-indigo-950/40 cursor-pointer transition-colors"
          >
            <span className="font-bold block text-[11px]">📊 Month Overview</span>
            <span className="text-[9px] text-slate-400 dark:text-indigo-300 block mt-1">Display current summary metrics</span>
          </button>
        </div>
      </div>

      {/* 5. Database Export/Import & Reset Backup Management */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 shadow-sm space-y-4">
        <div>
          <h3 className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-slate-50">Local SQL Backup & Database Restore</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">Export logs JSON file directly to device folders</p>
        </div>

        {backupSuccess && (
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 flex items-center space-x-2 text-xs font-semibold">
            <CheckCircle className="w-4 h-4" />
            <span>Database backup loaded successfully!</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Export */}
          <button
            onClick={handleExport}
            className="flex items-center justify-center space-x-2 p-3.5 border border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-950 font-bold hover:bg-slate-150 text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            <Download className="w-4 h-4 text-indigo-500" />
            <span>Export Database JSON</span>
          </button>

          {/* Import */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center space-x-2 p-3.5 border border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-950 font-bold hover:bg-slate-150 text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            <Upload className="w-4 h-4 text-indigo-500" />
            <span>Import / Restore Backup</span>
          </button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </div>

        {/* Clear Data Row */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <button
            onClick={handleReset}
            className="w-full py-3.5 rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-500 border border-rose-100 dark:border-rose-950/35 text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Wipe & Reset Database Records</span>
          </button>
        </div>
      </div>

      {/* 6. About Developer Section */}
      <div className="p-5 rounded-3xl bg-gradient-to-tr from-slate-900 to-indigo-950 text-white border border-slate-850 shadow-xl space-y-4 relative overflow-hidden group">
        {/* Glow Effects */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-indigo-500/15 transition-all duration-300" />
        <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-pink-500/10 rounded-full blur-xl pointer-events-none group-hover:bg-pink-500/15 transition-all duration-300" />

        <div className="flex items-center space-x-3.5 z-10 relative">
          <span className="bg-gradient-to-tr from-indigo-500 to-pink-500 text-white p-3 rounded-2xl text-lg shadow-lg font-black shrink-0">
            💻
          </span>
          <div>
            <h3 className="font-extrabold text-sm tracking-tight">About Developer</h3>
            <p className="text-[10px] text-indigo-200 mt-0.5 uppercase tracking-widest font-bold">Creator Profile</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 space-y-3 z-10 relative text-xs">
          <div className="flex justify-between items-center pb-2.5 border-b border-white/5">
            <span className="text-slate-400">Developer Name</span>
            <span className="font-bold text-slate-100">Imran Ahmed</span>
          </div>
          <div className="flex justify-between items-center pb-2.5 border-b border-white/5 font-medium">
            <span className="text-slate-400">Primary Contact</span>
            <a 
              href="https://www.facebook.com/YouR.ImRaN08" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-300 hover:text-indigo-200 hover:underline font-semibold"
            >
              www.facebook.com/YouR.ImRaN08
            </a>
          </div>
          <div className="flex justify-between items-center pb-1">
            <span className="text-slate-400">Application Version</span>
            <span className="font-mono text-[10px] bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-500/15">
              v1.5.0-clean
            </span>
          </div>
        </div>

        <p className="text-[10px] text-slate-450 leading-relaxed text-center italic z-10 relative px-2">
          "Crafting high-precision responsive companion apps that operate entirely offline, built for privacy compliance and maximum utility."
        </p>
      </div>
    </div>
  );
}
