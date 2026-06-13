/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AttendanceRecord, UserProfile, NotificationRecord, AchievementBadge, AttendanceStatus } from '../types';
import { db } from '../utils/db';

interface Toast {
  id: string;
  title: string;
  message: string;
  type: 'general' | 'streak' | 'achievement' | 'reminder';
}

interface AppContextType {
  attendance: Record<string, AttendanceRecord>;
  profile: UserProfile;
  notifications: NotificationRecord[];
  badges: AchievementBadge[];
  currentStreak: number;
  longestStreak: number;
  toasts: Toast[];
  setTheme: (dark: boolean) => void;
  saveAttendance: (date: string, status: AttendanceStatus, note: string) => void;
  deleteAttendance: (date: string) => void;
  updateProfile: (profile: UserProfile) => void;
  clearAllData: () => void;
  importBackup: (jsonStr: string) => boolean;
  exportBackup: () => string;
  dismissToast: (id: string) => void;
  triggerLocalNotification: (title: string, message: string, type: 'general' | 'streak' | 'achievement' | 'reminder') => void;
  triggerSimulatedReminder: (type: 'daily' | 'missing' | 'monthly') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({});
  const [profile, setProfile] = useState<UserProfile>(() => db.getProfile());
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [badges, setBadges] = useState<AchievementBadge[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Initialize DB on mount
  useEffect(() => {
    const att = db.getAttendance();
    const prof = db.getProfile();
    const notifs = db.getNotifications();
    const b = db.getAchievementsList(att);
    
    setAttendance(att);
    setProfile(prof);
    setNotifications(notifs);
    setBadges(b);

    const streaks = db.calculateStreaks(att);
    setCurrentStreak(streaks.currentStreak);
    setLongestStreak(streaks.longestStreak);

    // Initial badge values synced
    localStorage.setItem('wt_cache_badges', JSON.stringify(b));
  }, []);

  // Update light/dark mode root class
  useEffect(() => {
    const root = window.document.documentElement;
    if (profile.darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [profile.darkMode]);

  const updateStreaksAndBadges = (currentAttendance: Record<string, AttendanceRecord>) => {
    const streaks = db.calculateStreaks(currentAttendance);
    setCurrentStreak(streaks.currentStreak);
    setLongestStreak(streaks.longestStreak);

    const b = db.getAchievementsList(currentAttendance);
    setBadges(b);

    // Save cache and trigger notifications for changes
    try {
      const cached = localStorage.getItem('wt_cache_badges');
      if (cached) {
        const oldBadges = JSON.parse(cached) as AchievementBadge[];
        b.forEach(nb => {
          const ob = oldBadges.find(x => x.id === nb.id);
          if (nb.unlocked && (!ob || !ob.unlocked)) {
            triggerNotificationWithToast(
              `Badge Unlocked ${nb.emoji}`,
              `You unlocked "${nb.title}": ${nb.description}`,
              'achievement'
            );
          }
        });
      }
      localStorage.setItem('wt_cache_badges', JSON.stringify(b));
    } catch {
      localStorage.setItem('wt_cache_badges', JSON.stringify(b));
    }
  };

  const triggerNotificationWithToast = (title: string, message: string, type: 'general' | 'streak' | 'achievement' | 'reminder') => {
    if (!profile.notificationsEnabled) return;

    // Create record in notification database
    db.createSystemNotification(title, message, type);
    setNotifications(db.getNotifications());

    // Trigger sliding visual toast
    const newToast: Toast = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      message,
      type
    };
    setToasts(prev => [...prev, newToast]);

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      dismissToast(newToast.id);
    }, 5000);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const saveAttendance = (date: string, status: AttendanceStatus, note: string) => {
    const newRecord: AttendanceRecord = {
      id: date,
      date,
      status,
      note,
      createdAt: new Date().toISOString()
    };
    const updated = db.saveAttendanceRecord(newRecord);
    setAttendance(updated);
    updateStreaksAndBadges(updated);

    // Check streak progression achievements and alert
    const streaks = db.calculateStreaks(updated);
    if (streaks.longestStreak === 7 && streaks.currentStreak === 7) {
      triggerNotificationWithToast(
        '🥉 7-Day Streak Achieved!',
        'You are on fire! Keep going to unlock the Silver streak.',
        'streak'
      );
    } else if (streaks.longestStreak === 30 && streaks.currentStreak === 30) {
      triggerNotificationWithToast(
        '🥈 30-Day Streak Achieved!',
        'Consistent and steady. You earned the Silver Streak badge.',
        'streak'
      );
    }
  };

  const deleteAttendance = (date: string) => {
    const updated = db.deleteAttendanceRecord(date);
    setAttendance(updated);
    updateStreaksAndBadges(updated);
  };

  const updateProfile = (p: UserProfile) => {
    db.saveProfile(p);
    setProfile(p);
  };

  const setTheme = (dark: boolean) => {
    const updated = { ...profile, darkMode: dark };
    db.saveProfile(updated);
    setProfile(updated);
  };

  const clearAllData = () => {
    db.clearAllData();
    const att = db.getAttendance();
    const prof = db.getProfile();
    const notifs = db.getNotifications();
    const b = db.getAchievementsList(att);

    setAttendance(att);
    setProfile(prof);
    setNotifications(notifs);
    setBadges(b);
    setCurrentStreak(0);
    setLongestStreak(0);
    setToasts([]);
    triggerNotificationWithToast('Reset Database Done', 'All logs and preferences have been cleared.', 'general');
  };

  const importBackup = (jsonStr: string): boolean => {
    const res = db.restoreBackup(jsonStr);
    if (res) {
      const att = db.getAttendance();
      const prof = db.getProfile();
      const notifs = db.getNotifications();
      const b = db.getAchievementsList(att);

      setAttendance(att);
      setProfile(prof);
      setNotifications(notifs);
      setBadges(b);

      const streaks = db.calculateStreaks(att);
      setCurrentStreak(streaks.currentStreak);
      setLongestStreak(streaks.longestStreak);
      
      triggerNotificationWithToast('Backup Restored', 'Your WorkTrack attendance history has been loaded.', 'general');
      return true;
    }
    return false;
  };

  const exportBackup = (): string => {
    return db.exportBackup();
  };

  const triggerLocalNotification = (title: string, message: string, type: 'general' | 'streak' | 'achievement' | 'reminder') => {
    triggerNotificationWithToast(title, message, type);
  };

  const triggerSimulatedReminder = (type: 'daily' | 'missing' | 'monthly') => {
    const today = new Date().toISOString().split('T')[0];
    const isTodayMarked = !!attendance[today];

    if (type === 'daily') {
      triggerNotificationWithToast(
        '⏰ Daily Attendance Reminder',
        isTodayMarked 
          ? 'Lovely! You have already marked your attendance for today.' 
          : 'Don\'t forget to mark today\'s attendance to maintain your active streak!',
        'reminder'
      );
    } else if (type === 'missing') {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      const isYesterdayMarked = !!attendance[yesterdayStr];

      if (!isYesterdayMarked) {
        triggerNotificationWithToast(
          '⚠️ Missing Attendance Alert',
          'We noticed yesterday\'s working attendance is still unmarked. Please log it now!',
          'reminder'
        );
      } else {
        triggerNotificationWithToast(
          '⏰ Missing Attendance Checked',
          'Good job! Yesterday\'s attendance is already marked.',
          'reminder'
        );
      }
    } else if (type === 'monthly') {
      // End of Month attendance calculations
      const allList = Object.values(attendance) as AttendanceRecord[];
      const currentMonth = new Date().toISOString().substring(0, 7); // e.g., "2026-06"
      const monthLogs = allList.filter(r => r.date.startsWith(currentMonth));
      const monthPresents = monthLogs.filter(r => r.status === 'Present').length;
      
      const percentage = monthLogs.length > 0 
        ? Math.round((monthPresents / monthLogs.length) * 100) 
        : 0;

      triggerNotificationWithToast(
        '📊 Monthly Attendance Summary',
        `Your attendance level for this month stands at ${percentage}% (${monthPresents} working / ${monthLogs.length} logged days).`,
        'reminder'
      );
    }
  };

  return (
    <AppContext.Provider
      value={{
        attendance,
        profile,
        notifications,
        badges,
        currentStreak,
        longestStreak,
        toasts,
        setTheme,
        saveAttendance,
        deleteAttendance,
        updateProfile,
        clearAllData,
        importBackup,
        exportBackup,
        dismissToast,
        triggerLocalNotification,
        triggerSimulatedReminder,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
