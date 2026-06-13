/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import ToastContainer from './components/ToastContainer';
import AttendanceModal from './components/AttendanceModal';
import DashboardScreen from './components/DashboardScreen';
import CalendarScreen from './components/CalendarScreen';
import AnalyticsScreen from './components/AnalyticsScreen';
import ReportsScreen from './components/ReportsScreen';
import ProfileScreen from './components/ProfileScreen';

// All icons imported strictly from 'lucide-react'
import { 
  Home, Calendar, BarChart3, FileSpreadsheet, 
  User, Sun, Moon, Sparkles, LogOut, Wifi, WifiOff, Battery
} from 'lucide-react';

function AppShell() {
  const { profile, setTheme } = useApp();
  const [activeTab, setActiveTab] = useState<string>('Home');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState('');

  // Real-time device clock and network state tracking
  const [deviceTime, setDeviceTime] = useState('');
  const [deviceDate, setDeviceDate] = useState('');
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setDeviceTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
      );
      setDeviceDate(
        now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
      );
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);

    // Online/offline event trackers
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleOpenModal = (dateStr: string) => {
    setModalDate(dateStr);
    setModalOpen(true);
  };

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'Home':
        return <DashboardScreen onMarkDateClick={handleOpenModal} onChangeTab={setActiveTab} />;
      case 'Calendar':
        return <CalendarScreen onMarkDateClick={handleOpenModal} />;
      case 'Analytics':
        return <AnalyticsScreen />;
      case 'Reports':
        return <ReportsScreen />;
      case 'Profile':
        return <ProfileScreen />;
      default:
        return <DashboardScreen onMarkDateClick={handleOpenModal} onChangeTab={setActiveTab} />;
    }
  };

  const navigationItems = [
    { name: 'Home', icon: Home, label: 'Home' },
    { name: 'Calendar', icon: Calendar, label: 'Calendar' },
    { name: 'Analytics', icon: BarChart3, label: 'Analytics' },
    { name: 'Reports', icon: FileSpreadsheet, label: 'Reports' },
    { name: 'Profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center sm:p-4 select-none animate-fade-in relative overflow-x-hidden transition-colors duration-300">
      
      {/* Decorative ambient lighting backdrops */}
      <div className="absolute top-1/4 -left-48 w-[40rem] h-[40rem] rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-48 w-[40rem] h-[40rem] rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />

      {/* Main mockup frame representing iOS / Android devices */}
      <div className="w-full max-w-md sm:rounded-[42px] shadow-2xl dark:shadow-slate-900/40 sm:border-[8px] sm:border-slate-800 dark:sm:border-slate-900 bg-slate-50 dark:bg-slate-950 flex flex-col h-screen sm:h-[840px] sm:max-h-[92vh] overflow-hidden relative border-t-0 border-x-0">
        
        {/* App Top Brand Header with Theme Toggler */}
        <div className="h-16 bg-white dark:bg-slate-900 px-6 flex items-center justify-between z-30 flex-shrink-0 border-b border-slate-100 dark:border-slate-800/85 shadow-sm">
          <div className="flex items-center space-x-2.5">
            <span className="bg-gradient-to-tr from-indigo-500 to-violet-600 text-white p-2.5 rounded-2xl text-base shadow-md shadow-indigo-500/15 font-black">
              📊
            </span>
            <div>
              <h1 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">WorkTrack</h1>
              <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Attendance Companion</p>
            </div>
          </div>

          {/* Colourful Theme Switcher Toggler */}
          <button
            onClick={() => setTheme(!profile.darkMode)}
            className="p-2.5 rounded-2xl bg-gradient-to-tr from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 border border-slate-150 dark:border-slate-800 shadow-sm text-slate-600 dark:text-amber-400 hover:scale-105 active:scale-95 transition-all select-none cursor-pointer"
            title={profile.darkMode ? "Switch to light theme" : "Switch to dark theme"}
          >
            {profile.darkMode ? (
              <Sun className="w-4 h-4 text-amber-500 hover:text-amber-400 animate-spin-slow" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
          </button>
        </div>

        {/* Floating App Notification Toasts slide-downs */}
        <ToastContainer />

        {/* Screen Scrollable Viewport Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-6 pt-3">
          {renderActiveScreen()}
        </div>

        {/* Global Attendance Entry dialog sheets */}
        <AttendanceModal 
          isOpen={modalOpen} 
          onClose={() => setModalOpen(false)} 
          selectedDate={modalDate} 
        />

        {/* Tab Navigation bottom bar matching Material 3 & Glassmorphism concepts */}
        <nav 
          id="worktrack-bottom-tabs"
          className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-lg border-t border-slate-100 dark:border-slate-900/80 px-4 py-2 flex items-center justify-between pb-5 sm:pb-3.5 z-30 flex-shrink-0"
        >
          {navigationItems.map((item) => {
            const IconComponent = item.icon;
            const isSelected = activeTab === item.name;

            return (
              <button
                key={item.name}
                type="button"
                onClick={() => setActiveTab(item.name)}
                className={`relative flex flex-col items-center justify-center flex-1 py-1.5 group select-none cursor-pointer transition-all duration-150 ${
                  isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-500'
                }`}
              >
                {/* Active feedback glow blob background */}
                {isSelected && (
                  <div className="absolute inset-0 bg-indigo-50 dark:bg-indigo-950/45 rounded-2xl w-14 mx-auto -z-10 animate-fade-in" />
                )}
                
                <IconComponent className="w-5.5 h-5.5 stroke-[2] transition-transform duration-200 group-active:scale-90" />
                
                <span className="text-[10px] font-extrabold tracking-tight mt-1">
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
