/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { AttendanceStatus, ATTENDANCE_STATUS_CONFIG } from '../types';
import { X, Calendar as CalendarIcon, Check, Trash2, FileText } from 'lucide-react';

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string; // YYYY-MM-DD
}

export default function AttendanceModal({ isOpen, onClose, selectedDate }: AttendanceModalProps) {
  const { attendance, saveAttendance, deleteAttendance } = useApp();
  const [status, setStatus] = useState<AttendanceStatus>('Present');
  const [note, setNote] = useState('');

  // Load existing values if editing
  useEffect(() => {
    if (isOpen) {
      const existing = attendance[selectedDate];
      if (existing) {
        setStatus(existing.status);
        setNote(existing.note || '');
      } else {
        setStatus('Present');
        setNote('');
      }
    }
  }, [isOpen, selectedDate, attendance]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveAttendance(selectedDate, status, note);
    onClose();
  };

  const handleDelete = () => {
    deleteAttendance(selectedDate);
    onClose();
  };

  // Helper to format date cleanly: "15 June 2026"
  const formatDateFriendly = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const d = new Date(year, month - 1, day);
      return d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const hasRecord = !!attendance[selectedDate];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div 
        id="attendance-modal-card"
        className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 shadow-2xl transition-all duration-300"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800/65">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-500">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                {hasRecord ? 'Update Attendance' : 'Mark Attendance'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {formatDateFriendly(selectedDate)}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSave} className="p-6 space-y-6">
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Select Status
            </label>
            <div className="grid grid-cols-1 gap-2.5">
              {(Object.keys(ATTENDANCE_STATUS_CONFIG) as AttendanceStatus[]).map((st) => {
                const conf = ATTENDANCE_STATUS_CONFIG[st];
                const isSelected = status === st;
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatus(st)}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? `${conf.borderColor} bg-slate-50 dark:bg-slate-800/50 border-slate-400/30 ring-2 ring-indigo-500/20`
                        : 'border-slate-100 dark:border-slate-800/70 hover:bg-slate-50 dark:hover:bg-slate-800/30'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-lg leading-none">{conf.emoji}</span>
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        {st}
                      </span>
                    </div>
                    {isSelected && (
                      <div className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 dark:bg-indigo-500 text-white">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label 
                htmlFor="note-input"
                className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                Optional Notes
              </label>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                {note.length}/80 chars
              </span>
            </div>
            <textarea
              id="note-input"
              rows={2}
              maxLength={80}
              placeholder="e.g. Client Meeting, Sick leave, Project submission..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/70"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3 pt-2">
            {hasRecord && (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center justify-center p-3.5 rounded-2xl border border-rose-100 dark:border-rose-950/30 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/10 active:scale-95 transition-all"
                title="Delete Attendance Entry"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button
              type="submit"
              className="flex-1 py-3.5 rounded-2xl bg-indigo-600 dark:bg-indigo-500 text-white font-medium hover:bg-indigo-700 dark:hover:bg-indigo-600 active:scale-98 transition-all shadow-lg shadow-indigo-600/10"
            >
              Save Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
