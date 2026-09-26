import React, { useState } from 'react';
import {
  CalendarCheck,
  Check,
  X,
  Clock,
  Send,
  Users,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { Student, AttendanceRecord } from '../types/erp';

interface AttendanceViewProps {
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  onSaveAttendance: (record: AttendanceRecord) => void;
  onSendAbsenteeAlert?: (studentName: string, parentEmail: string) => void;
  onExportToSheet?: (title: string, headers: string[], rows: (string | number)[][]) => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  students,
  attendanceRecords,
  onSaveAttendance,
  onSendAbsenteeAlert,
  onExportToSheet,
}) => {
  const [selectedDate, setSelectedDate] = useState('2026-09-24');
  const [selectedClass, setSelectedClass] = useState('Grade 10');
  const [selectedSection, setSelectedSection] = useState('A');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Filter students for current class & section
  const classStudents = students.filter(
    (s) => s.className.toLowerCase().includes(selectedClass.toLowerCase()) && s.section === selectedSection
  );

  // Local attendance status state per student
  const [statuses, setStatuses] = useState<Record<string, 'present' | 'absent' | 'late' | 'leave'>>({
    'stu-101': 'present',
    'stu-103': 'late',
  });

  const getStatus = (studentId: string) => statuses[studentId] || 'present';

  const setStatus = (studentId: string, status: 'present' | 'absent' | 'late' | 'leave') => {
    setStatuses((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleMarkAllPresent = () => {
    const updated: Record<string, 'present' | 'absent' | 'late' | 'leave'> = {};
    classStudents.forEach((s) => {
      updated[s.id] = 'present';
    });
    setStatuses(updated);
  };

  const presentCount = classStudents.filter((s) => getStatus(s.id) === 'present').length;
  const absentCount = classStudents.filter((s) => getStatus(s.id) === 'absent').length;
  const lateCount = classStudents.filter((s) => getStatus(s.id) === 'late').length;

  const handleSave = () => {
    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}`,
      date: selectedDate,
      className: selectedClass,
      section: selectedSection,
      campusId: classStudents[0]?.campusId || 'camp-1',
      totalStudents: classStudents.length,
      presentCount,
      absentCount,
      lateCount,
      markedBy: 'Current Faculty Session',
      timestamp: new Date().toLocaleString(),
      details: statuses,
    };

    onSaveAttendance(newRecord);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-indigo-500" />
            Class Attendance Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time daily roll call with automatic parent notifications and historical attendance archives.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {onExportToSheet && (
            <button
              onClick={() => {
                const headers = ['Record ID', 'Date', 'Class', 'Section', 'Total Students', 'Present', 'Absent', 'Late', 'Marked By', 'Timestamp'];
                const rows = attendanceRecords.map((a) => [
                  a.id,
                  a.date,
                  a.className,
                  a.section,
                  a.totalStudents,
                  a.presentCount,
                  a.absentCount,
                  a.lateCount,
                  a.markedBy,
                  a.timestamp,
                ]);
                onExportToSheet(`Oakridge Academy - Attendance Records (${selectedDate})`, headers, rows);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export Attendance to Sheets</span>
            </button>
          )}
          <button
            onClick={handleMarkAllPresent}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition-colors"
          >
            Mark All Present
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/20 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Save &amp; Lock Attendance</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Attendance recorded successfully in Cloud Firestore! Syncing with parent portal and notification dispatch.</span>
        </div>
      )}

      {/* Filter Row & Live Counters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Controls */}
        <div className="md:col-span-2 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center gap-3">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Session Date</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="block px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white font-medium"
            />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Grade</span>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="block px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white font-medium"
            >
              <option value="Grade 8">Grade 8</option>
              <option value="Grade 9">Grade 9</option>
              <option value="Grade 10">Grade 10</option>
              <option value="Grade 11">Grade 11</option>
              <option value="Grade 12">Grade 12</option>
            </select>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Section</span>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="block px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white font-medium"
            >
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="Science">Science Track</option>
            </select>
          </div>
        </div>

        {/* Counter: Present */}
        <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
              Present Today
            </div>
            <div className="text-2xl font-black text-emerald-900 dark:text-emerald-100 mt-1">
              {presentCount} / {classStudents.length}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center font-bold">
            <Check className="w-5 h-5" />
          </div>
        </div>

        {/* Counter: Absent / Late */}
        <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/60 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider">
              Absent / Late
            </div>
            <div className="text-2xl font-black text-rose-900 dark:text-rose-100 mt-1">
              {absentCount} Abs · {lateCount} Late
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 flex items-center justify-center font-bold">
            <X className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Roster Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Roll No</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Parent Phone</th>
                <th className="py-3 px-4">Attendance Status</th>
                <th className="py-3 px-4 text-right">Absentee Trigger</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {classStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No student enrolled in {selectedClass} ({selectedSection}).
                  </td>
                </tr>
              ) : (
                classStudents.map((student) => {
                  const status = getStatus(student.id);
                  return (
                    <tr key={student.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-600 dark:text-slate-300">
                        {student.rollNo}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {student.fullName}
                        </div>
                        <div className="text-[10px] text-slate-400">{student.admissionNo}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-mono">
                        {student.parentPhone}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setStatus(student.id, 'present')}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                              status === 'present'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            Present
                          </button>
                          <button
                            onClick={() => setStatus(student.id, 'absent')}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                              status === 'absent'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            Absent
                          </button>
                          <button
                            onClick={() => setStatus(student.id, 'late')}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                              status === 'late'
                                ? 'bg-amber-500 text-white shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            Late
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {status === 'absent' ? (
                          <button
                            onClick={() =>
                              onSendAbsenteeAlert &&
                              onSendAbsenteeAlert(student.fullName, student.parentEmail)
                            }
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 px-2.5 py-1 rounded-lg transition-colors"
                          >
                            <Send className="w-3 h-3" />
                            <span>Notify Guardian</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400">Normal</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
