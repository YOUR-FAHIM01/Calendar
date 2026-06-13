/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AttendanceRecord, UserProfile, NotificationRecord, AchievementBadge, AttendanceStatus } from '../types';

const STORAGE_KEYS = {
  ATTENDANCE: 'worktrack_attendance_v1',
  PROFILE: 'worktrack_profile_v1',
  NOTIFICATIONS: 'worktrack_notifications_v1',
};

// Default profile values
const DEFAULT_PROFILE: UserProfile = {
  name: 'Alex Mercer',
  companyName: 'Starlight Tech Inc.',
  officeStart: '09:00',
  officeEnd: '17:00',
  darkMode: false,
  notificationsEnabled: true
};

// Seed historical attendance records - disabled (returns empty) to start fresh without demo.
function generateSeedData(): Record<string, AttendanceRecord> {
  return {};
}

export const db = {
  // --- Profile Operations ---
  getProfile(): UserProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Error reading profile', e);
    }
    // Set default if not exists
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(DEFAULT_PROFILE));
    return DEFAULT_PROFILE;
  },

  saveProfile(profile: UserProfile): void {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  },

  // --- Attendance Records Operations ---
  getAttendance(): Record<string, AttendanceRecord> {
    try {
      // One-time automatic database purge on first load to solve browser cache containing old demo data.
      if (localStorage.getItem('worktrack_clean_v1_purged_final') !== 'true') {
        localStorage.removeItem(STORAGE_KEYS.ATTENDANCE);
        localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
        localStorage.removeItem('wt_cache_badges');
        localStorage.setItem('worktrack_clean_v1_purged_final', 'true');
      }

      const data = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
      if (data) {
        const parsed = JSON.parse(data) as Record<string, any>;
        const sanitized: Record<string, AttendanceRecord> = {};
        let needsResave = false;

        Object.entries(parsed).forEach(([dateKey, record]) => {
          if (record && typeof record === 'object') {
            let status = record.status;
            
            // Map legacy statuses to standard types if found
            if (status === 'Work From Home' || status === 'Late') {
              status = 'Present';
              needsResave = true;
            } else if (status === 'Leave') {
              status = 'Absent';
              needsResave = true;
            }

            // Standardize to valid types
            if (status === 'Present' || status === 'Absent') {
              sanitized[dateKey] = {
                id: record.id || dateKey,
                date: record.date || dateKey,
                status: status as AttendanceStatus,
                note: record.note || '',
                createdAt: record.createdAt || new Date().toISOString()
              };
            } else {
              // Non-matching garbage statuses default to Present
              sanitized[dateKey] = {
                id: record.id || dateKey,
                date: record.date || dateKey,
                status: 'Present',
                note: record.note || '',
                createdAt: record.createdAt || new Date().toISOString()
              };
              needsResave = true;
            }
          }
        });

        if (needsResave) {
          localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(sanitized));
        }

        return sanitized;
      }
    } catch (e) {
      console.error('Error reading attendance', e);
    }
    // Initialize with seeed data on first load
    const seed = generateSeedData();
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(seed));
    
    // Seed notifications for first start
    this.createSystemNotification(
      'Welcome to WorkTrack!',
      'Your clean attendance tracker is ready. Mark dates as Present or Absent to begin!',
      'general'
    );

    return seed;
  },

  saveAttendanceRecord(record: AttendanceRecord): Record<string, AttendanceRecord> {
    const all = this.getAttendance();
    all[record.date] = record;
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(all));
    this.checkAndUpdateAchievements();
    return all;
  },

  deleteAttendanceRecord(dateString: string): Record<string, AttendanceRecord> {
    const all = this.getAttendance();
    if (all[dateString]) {
      delete all[dateString];
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(all));
      this.checkAndUpdateAchievements();
    }
    return all;
  },

  // --- Notification Operations ---
  getNotifications(): NotificationRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Error reading notifications', e);
    }
    return [];
  },

  saveNotifications(notifs: NotificationRecord[]): void {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
  },

  createSystemNotification(title: string, message: string, type: 'general' | 'streak' | 'achievement' | 'reminder'): void {
    const notifs = this.getNotifications();
    const newNotif: NotificationRecord = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      message,
      date: new Date().toISOString().split('T')[0],
      read: false,
      type
    };
    notifs.unshift(newNotif); // latest first
    this.saveNotifications(notifs);
  },

  markNotificationsAsRead(): void {
    const notifs = this.getNotifications();
    notifs.forEach(n => n.read = true);
    this.saveNotifications(notifs);
  },

  // --- Streak & Calculation Utilities ---
  calculateStreaks(records: Record<string, AttendanceRecord>): { currentStreak: number; longestStreak: number } {
    const dates = Object.keys(records).sort();
    if (dates.length === 0) return { currentStreak: 0, longestStreak: 0 };

    let maxStreak = 0;
    let currStreak = 0;
    
    // Create map for efficient lookup
    const attendanceMap = new Map<string, AttendanceStatus>();
    dates.forEach(d => {
      attendanceMap.set(d, records[d].status);
    });

    // We count: 'Present' as working streaks.
    // Absent breaks a streak.
    const isWorkingStatus = (status: AttendanceStatus) => {
      return status === 'Present';
    };

    // Calculate historical longest streak
    let tempStreak = 0;
    let lastDate: Date | null = null;

    // To check consecutive calendar days (ignoring weekends is optional, but usually streaks are strictly calendar days or consecutive recorded work days. 
    // Let's do consecutive calendar days where work was marked, BUT allow skipping weekends if no work marked to make it fair, 
    // OR we analyze strictly consecutive calendar dates that were marked positive. 
    // Let's do consecutive days of *any* sequence of positive markings)
    const sortedWorkingDates = dates
      .filter(d => isWorkingStatus(records[d].status))
      .map(d => new Date(d));

    if (sortedWorkingDates.length === 0) return { currentStreak: 0, longestStreak: 0 };

    // Standard calendar streak calculation
    let maxLen = 0;
    let runningLen = 0;
    
    // We build a list of all distinct calendar dates that are marked.
    // If we want a strict calendar day streak (allowing weekend gaps OR strict consecutive days):
    // Let's implement consecutive chronological calendar dates. 
    // If consecutive working days have no more than 1 (or 2) days of gap (e.g. weekend), the streak can stay alive.
    // Let's calculate strict calendar daily streak of "attended" days, with a 2-day grace for weekends! 
    // That means if you work Friday and Monday, the streak maintains. That is the gold standard for office trackers!
    const sortedAllDates = dates.sort();
    let currentStreakCount = 0;

    // Chronological analysis
    let longestStreakCount = 0;
    let activeStreakCount = 0;
    let previousMarkedDate: Date | null = null;

    const MS_PER_DAY = 24 * 60 * 60 * 1000;

    // Sort marked attendance records (only positive work statuses)
    const workRecords = Object.values(records)
      .filter(r => isWorkingStatus(r.status))
      .sort((a, b) => a.date.localeCompare(b.date));

    if (workRecords.length > 0) {
      let run = 1;
      let maxRun = 1;

      for (let i = 1; i < workRecords.length; i++) {
        const prev = new Date(workRecords[i - 1].date);
        const curr = new Date(workRecords[i].date);
        const diffTime = Math.abs(curr.getTime() - prev.getTime());
        const diffDays = Math.ceil(diffTime / MS_PER_DAY);

        // Gap <= 1 day means consecutive days.
        // If it's a gap of 2 or 3 days, let's look if it spans a weekend (prev was Friday/Sat, curr is Sunday/Mon)
        const isWeekendGap = (diffDays <= 3 && (prev.getDay() === 5 || prev.getDay() === 6 || prev.getDay() === 0));

        if (diffDays === 1 || isWeekendGap) {
          run++;
        } else if (diffDays > 1) {
          run = 1;
        }

        if (run > maxRun) maxRun = run;
      }
      longestStreakCount = maxRun;

      // Calculate CURRENT streak ending today or yesterday
      const todayStr = new Date().toISOString().split('T')[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // Grab the latest work recording
      const hasWorkToday = workRecords.some(r => r.date === todayStr);
      const hasWorkYesterday = workRecords.some(r => r.date === yesterdayStr);

      if (hasWorkToday || hasWorkYesterday) {
        // Calculate backwards from the latest positive work date
        let tempCurr = 1;
        const revWorkRecords = [...workRecords].reverse();
        
        for (let i = 1; i < revWorkRecords.length; i++) {
          const curr = new Date(revWorkRecords[i - 1].date);
          const prev = new Date(revWorkRecords[i].date);
          const diffTime = Math.abs(curr.getTime() - prev.getTime());
          const diffDays = Math.ceil(diffTime / MS_PER_DAY);
          const isWeekendGap = (diffDays <= 3 && (prev.getDay() === 5 || prev.getDay() === 6 || prev.getDay() === 0));

          if (diffDays === 1 || isWeekendGap) {
            tempCurr++;
          } else {
            break;
          }
        }
        activeStreakCount = tempCurr;
      } else {
        activeStreakCount = 0;
      }
    }

    return {
      currentStreak: activeStreakCount,
      longestStreak: longestStreakCount
    };
  },

  // --- Achievements Checker ---
  getAchievementsList(records: Record<string, AttendanceRecord>): AchievementBadge[] {
    const { currentStreak, longestStreak } = this.calculateStreaks(records);
    const allRecordsList = Object.values(records);
    const presentCount = allRecordsList.filter(r => r.status === 'Present').length;
    const totalWorkingMarked = presentCount;

    // Group records by Month (YYYY-MM)
    const recordsByMonth: Record<string, AttendanceRecord[]> = {};
    allRecordsList.forEach(r => {
      const monthStr = r.date.substring(0, 7); // "2026-06"
      if (!recordsByMonth[monthStr]) recordsByMonth[monthStr] = [];
      recordsByMonth[monthStr].push(r);
    });

    // Check for a perfect month: some records exist, and there are NO Absents
    let hasPerfectMonth = false;
    Object.keys(recordsByMonth).forEach(m => {
      const monthRecs = recordsByMonth[m];
      if (monthRecs.length >= 15) { // Needs a reasonable number of log entries to prevent cheating on empty/new months
        const absents = monthRecs.filter(r => r.status === 'Absent').length;
        if (absents === 0) {
          hasPerfectMonth = true;
        }
      }
    });

    const attendanceRate = allRecordsList.length > 0
      ? (totalWorkingMarked / allRecordsList.length) * 100
      : 0;

    const badges: AchievementBadge[] = [
      {
        id: 'streak_7',
        title: 'Bronze Streak',
        description: 'Achieve a 7-day attendance streak.',
        emoji: '🥉',
        category: 'streak',
        requirementText: '7 Days Stream',
        unlocked: longestStreak >= 7
      },
      {
        id: 'streak_30',
        title: 'Silver Streak',
        description: 'Achieve a 30-day attendance streak.',
        emoji: '🥈',
        category: 'streak',
        requirementText: '30 Days Streak',
        unlocked: longestStreak >= 30
      },
      {
        id: 'streak_90',
        title: 'Gold Streak',
        description: 'Achieve an elite 90-day attendance streak.',
        emoji: '🥇',
        category: 'streak',
        requirementText: '90 Days Streak',
        unlocked: longestStreak >= 90
      },
      {
        id: 'perfect_month',
        title: 'Impeccable Month',
        description: 'Complete a month with 15+ logs and zero absences.',
        emoji: '🏆',
        category: 'perfect_month',
        requirementText: '0 Absents in a month (min 15 days logged)',
        unlocked: hasPerfectMonth
      },
      {
        id: 'attendance_100',
        title: 'Star Employee',
        description: 'Keep your historical attendance rate at a absolute 100% (minimum 10 records).',
        emoji: '⭐',
        category: 'attendance',
        requirementText: '100% Attendance rate (min 10 days logged)',
        unlocked: allRecordsList.length >= 10 && attendanceRate === 100
      }
    ];

    return badges;
  },

  checkAndUpdateAchievements(): void {
    const records = this.getAttendance();
    const currentBadges = this.getAchievementsList(records);
    
    // Check if key badges were newly unlocked since before (we can check if we should push system notifications)
    try {
      const storedBadgesJson = localStorage.getItem('wt_cache_badges');
      if (storedBadgesJson) {
        const oldBadges = JSON.parse(storedBadgesJson) as AchievementBadge[];
        currentBadges.forEach(nb => {
          const ob = oldBadges.find(x => x.id === nb.id);
          if (nb.unlocked && (!ob || !ob.unlocked)) {
            // Newly unlocked!
            this.createSystemNotification(
              `Badge Unlocked: ${nb.emoji} ${nb.title}!`,
              `Outstanding! You unlocked the "${nb.title}" badge: ${nb.description}`,
              'achievement'
            );
          }
        });
      }
      localStorage.setItem('wt_cache_badges', JSON.stringify(currentBadges));
    } catch {
      localStorage.setItem('wt_cache_badges', JSON.stringify(currentBadges));
    }
  },

  // --- Reset DB ---
  clearAllData(): void {
    localStorage.removeItem(STORAGE_KEYS.ATTENDANCE);
    localStorage.removeItem(STORAGE_KEYS.PROFILE);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    localStorage.removeItem('wt_cache_badges');
    // Reload local variables
    this.getAttendance();
    this.getProfile();
  },

  // --- Import / Restore ---
  restoreBackup(backupJsonString: string): boolean {
    try {
      const parsed = JSON.parse(backupJsonString);
      
      // Basic validation of fields
      if (parsed.attendance && typeof parsed.attendance === 'object') {
        localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(parsed.attendance));
      } else {
        return false;
      }

      if (parsed.profile && typeof parsed.profile === 'object') {
        localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(parsed.profile));
      }

      if (parsed.notifications && Array.isArray(parsed.notifications)) {
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(parsed.notifications));
      }

      this.checkAndUpdateAchievements();
      this.createSystemNotification(
        'Database Restored Success',
        'Your local database backup file was loaded and parsed successfully.',
        'general'
      );
      return true;
    } catch (e) {
      console.error('Failed to parse backup JSON', e);
      return false;
    }
  },

  exportBackup(): string {
    const backupObj = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      attendance: this.getAttendance(),
      profile: this.getProfile(),
      notifications: this.getNotifications()
    };
    return JSON.stringify(backupObj, null, 2);
  }
};
