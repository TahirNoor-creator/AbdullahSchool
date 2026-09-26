import React, { useState } from 'react';
import {
  GraduationCap,
  Plus,
  Printer,
  CheckCircle2,
  FileSpreadsheet,
  Award,
  BookOpen,
} from 'lucide-react';
import { Student } from '../types/erp';

interface ExamsViewProps {
  students: Student[];
  onPrintReportCard: (student: Student) => void;
}

export const ExamsView: React.FC<ExamsViewProps> = ({
  students,
  onPrintReportCard,
}) => {
  const [selectedTerm, setSelectedTerm] = useState('Fall Mid-Term Examinations 2026');
  const [selectedClass, setSelectedClass] = useState('Grade 10');

  const examRecords = [
    {
      studentId: 'stu-101',
      studentName: 'Alexander Liam Wright',
      className: 'Grade 10 - A',
      math: 96,
      science: 94,
      english: 91,
      history: 88,
      computerScience: 98,
      totalObtained: 467,
      percentage: 93.4,
      grade: 'A+',
    },
    {
      studentId: 'stu-102',
      studentName: 'Sophia Isabella Martinez',
      className: 'Grade 9 - B',
      math: 88,
      science: 90,
      english: 95,
      history: 92,
      computerScience: 86,
      totalObtained: 451,
      percentage: 90.2,
      grade: 'A',
    },
    {
      studentId: 'stu-103',
      studentName: 'Ethan Jin Woo',
      className: 'Grade 10 - A',
      math: 99,
      science: 97,
      english: 85,
      history: 84,
      computerScience: 100,
      totalObtained: 465,
      percentage: 93.0,
      grade: 'A+',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-500" />
            Examinations, Marks &amp; Report Cards
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Publish assessment terms, calculate weighted GPA scores, and generate official stamped student report cards.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold outline-none"
          >
            <option value="Fall Mid-Term Examinations 2026">Fall Mid-Term 2026</option>
            <option value="Annual Board Assessment 2026">Annual Assessment 2026</option>
          </select>
        </div>
      </div>

      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="text-xs font-bold text-slate-900 dark:text-white">
            Grade Roster &amp; Published Scores
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            Results Approved &amp; Published
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4">Mathematics</th>
                <th className="py-3 px-4">Sciences</th>
                <th className="py-3 px-4">English</th>
                <th className="py-3 px-4">History</th>
                <th className="py-3 px-4">Comp. Sci</th>
                <th className="py-3 px-4">Total (500)</th>
                <th className="py-3 px-4">Grade</th>
                <th className="py-3 px-4 text-right">Report Card</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {examRecords.map((r, i) => {
                const studentObj = students.find((s) => s.id === r.studentId) || students[0];
                return (
                  <tr key={i} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {r.studentName}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{r.className}</td>
                    <td className="py-3 px-4 font-mono">{r.math}</td>
                    <td className="py-3 px-4 font-mono">{r.science}</td>
                    <td className="py-3 px-4 font-mono">{r.english}</td>
                    <td className="py-3 px-4 font-mono">{r.history}</td>
                    <td className="py-3 px-4 font-mono">{r.computerScience}</td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {r.totalObtained} ({r.percentage}%)
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                        {r.grade}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onPrintReportCard(studentObj)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Report</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
