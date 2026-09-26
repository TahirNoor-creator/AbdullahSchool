import React, { useState, useEffect } from 'react';
import {
  Search,
  X,
  Users,
  Receipt,
  Briefcase,
  Building,
  GraduationCap,
  Boxes,
  ArrowRight,
} from 'lucide-react';
import { Student, FeeInvoice, Employee } from '../types/erp';
import { ERPView } from './Sidebar';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  invoices: FeeInvoice[];
  employees: Employee[];
  onNavigate: (view: ERPView) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  students,
  invoices,
  employees,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        // Toggle handled by caller
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase();

  const matchingStudents = q
    ? students.filter(
        (s) =>
          s.fullName.toLowerCase().includes(q) ||
          s.admissionNo.toLowerCase().includes(q) ||
          s.parentName.toLowerCase().includes(q)
      )
    : [];

  const matchingInvoices = q
    ? invoices.filter(
        (inv) =>
          inv.invoiceNo.toLowerCase().includes(q) ||
          inv.studentName.toLowerCase().includes(q)
      )
    : [];

  const matchingEmployees = q
    ? employees.filter(
        (emp) =>
          emp.fullName.toLowerCase().includes(q) ||
          emp.empNo.toLowerCase().includes(q) ||
          emp.designation.toLowerCase().includes(q)
      )
    : [];

  const handleSelect = (view: ERPView) => {
    onNavigate(view);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-start justify-center p-4 pt-20 z-50 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-indigo-500 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Type a student name, invoice number, or staff member..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
          />
          <kbd className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 rounded border border-slate-200 dark:border-slate-700">
            ESC
          </kbd>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {!query ? (
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Quick Navigation
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleSelect('command-center')}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-left font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between transition-colors"
                >
                  <span>ERP Command Center</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  onClick={() => handleSelect('students')}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-left font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between transition-colors"
                >
                  <span>Student Directory</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  onClick={() => handleSelect('fees-invoicing')}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-left font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between transition-colors"
                >
                  <span>Fees &amp; Invoicing</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  onClick={() => handleSelect('workspace-hub')}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-left font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between transition-colors"
                >
                  <span>Google Workspace Hub</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Students */}
              {matchingStudents.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-indigo-500" /> Students ({matchingStudents.length})
                  </span>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {matchingStudents.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => handleSelect('students')}
                        className="py-2 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">{s.fullName}</div>
                          <div className="text-[10px] text-slate-400">
                            {s.admissionNo} · {s.className} ({s.section})
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                          View Student →
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Invoices */}
              {matchingInvoices.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-emerald-500" /> Invoices ({matchingInvoices.length})
                  </span>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {matchingInvoices.map((inv) => (
                      <div
                        key={inv.id}
                        onClick={() => handleSelect('fees-invoicing')}
                        className="py-2 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {inv.invoiceNo} · {inv.studentName}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Amount: ${inv.totalAmount} · Status: {inv.status}
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                          View Invoice →
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Staff */}
              {matchingEmployees.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-purple-500" /> Faculty &amp; Staff ({matchingEmployees.length})
                  </span>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {matchingEmployees.map((emp) => (
                      <div
                        key={emp.id}
                        onClick={() => handleSelect('hr-payroll')}
                        className="py-2 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">{emp.fullName}</div>
                          <div className="text-[10px] text-slate-400">
                            {emp.empNo} · {emp.designation} ({emp.department})
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400">
                          View Staff →
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {matchingStudents.length === 0 && matchingInvoices.length === 0 && matchingEmployees.length === 0 && (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No records matching &quot;{query}&quot;.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
