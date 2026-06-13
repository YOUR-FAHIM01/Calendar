/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AttendanceStatus = 'Present' | 'Absent';

export interface AttendanceRecord {
  id: string; // Typically YYYY-MM-DD for straightforward local storage indexing
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  note: string;
  createdAt: string; // ISO timestamp
}

export interface UserProfile {
  name: string;
  companyName: string;
  officeStart: string; // e.g., "09:00"
  officeEnd: string; // e.g., "17:00"
  darkMode: boolean;
  notificationsEnabled: boolean;
}

export interface NotificationRecord {
  id: string;
  title: string;
  message: string;
  date: string; // YYYY-MM-DD or ISO
  read: boolean;
  type: 'general' | 'streak' | 'achievement' | 'reminder';
}

export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  emoji: string;
  category: 'streak' | 'attendance' | 'perfect_month';
  requirementText: string;
  unlocked: boolean;
  unlockedDate?: string;
}

export interface StatusConfig {
  label: AttendanceStatus;
  color: string;      // Tailwind class e.g., 'bg-emerald-500' or similar
  textColor: string;  // e.g., 'text-emerald-700'
  borderColor: string; // e.g., 'border-emerald-200'
  emoji: string;
  hexColor: string;   // Hex code for SVG charts
}

export const ATTENDANCE_STATUS_CONFIG: Record<AttendanceStatus, StatusConfig> = {
  'Present': {
    label: 'Present',
    color: 'bg-emerald-500',
    textColor: 'text-emerald-500',
    borderColor: 'border-emerald-500/20',
    emoji: '🟢',
    hexColor: '#10b981'
  },
  'Absent': {
    label: 'Absent',
    color: 'bg-rose-500',
    textColor: 'text-rose-500',
    borderColor: 'border-rose-500/20',
    emoji: '🔴',
    hexColor: '#f43f5e'
  }
};
