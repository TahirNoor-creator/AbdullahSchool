import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Download,
  Filter,
  FileSpreadsheet,
  Building,
  GraduationCap,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  Calendar,
  X,
  CreditCard,
  Upload,
  Trash2,
  Edit3,
  ArrowRight,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { Student, Campus } from '../types/erp';
import { readSpreadsheetValues } from '../services/workspace';

interface StudentsViewProps {
  students: Student[];
  campuses: Campus[];
  onAddStudent: (student: Omit<Student, 'id'>) => void;
  onUpdateStudent?: (student: Student) => void;
  onDeleteStudent?: (id: string) => void;
  onBatchImportStudents?: (students: Student[]) => void;
  onExportToSheet: (title: string, headers: string[], rows: (string | number)[][]) => void;
  hasWorkspaceAuth: boolean;
  accessToken?: string | null;
  connectedSheetId?: string | null;
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  students,
  campuses,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onBatchImportStudents,
  onExportToSheet,
  hasWorkspaceAuth,
  accessToken,
  connectedSheetId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCampus, setSelectedCampus] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Import Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvInput, setCsvInput] = useState(
`Admission No,Full Name,Roll No,Class,Section,Campus ID,Parent Name,Phone,Parent Email,Status,Fees Due ($),Admission Date
STU-2026-00006,Waqar,10-A-15,Grade 8,A,camp-1,Manzoor Ahmad,3084119786,parent@example.com,active,0,2026-09-25
STU-2026-00001,Alexander Liam Wright,10-A-01,Grade 10,A,camp-1,Robert & Clara Wright,+1 (650) 555-0192,robert.wright@gmail.com,active,0,2024-08-20
STU-2026-00002,Sophia Isabella Martinez,09-B-08,Grade 9,B,camp-1,Carlos Martinez,+1 (650) 555-0348,carlos.m@example.com,active,450,2024-08-22
STU-2026-00003,Ethan Jin Woo,10-A-03,Grade 10,A,camp-2,Min-ho & Grace Woo,+1 (650) 555-8812,mwoo@stemtech.io,active,1200,2025-01-10
STU-2026-00004,Amara Chloe Patel,11-SCI-12,Grade 11,Science,camp-2,Dev & Nina Patel,+1 (650) 555-9014,nina.patel@biolabs.com,active,0,2023-08-15
STU-2026-00005,Lucas Benjamin Scott,08-A-04,Grade 8,A,camp-3,Rachel Scott,+1 (650) 555-4421,rachel.scott@designhub.org,active,300,2025-08-18`
  );
  const [parsedImportRows, setParsedImportRows] = useState<Student[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importNotice, setImportNotice] = useState<string | null>(null);

  // Edit Student State
  const [isEditingStudent, setIsEditingStudent] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Student>>({});

  // New Student Form State
  const [newFullName, setNewFullName] = useState('');
  const [newGender, setNewGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [newDob, setNewDob] = useState('2011-05-15');
  const [newClass, setNewClass] = useState('Grade 10');
  const [newSection, setNewSection] = useState('A');
  const [newRollNo, setNewRollNo] = useState('10-A-15');
  const [newCampusId, setNewCampusId] = useState(campuses[0]?.id || 'camp-1');
  const [newParentName, setNewParentName] = useState('');
  const [newParentPhone, setNewParentPhone] = useState('');
  const [newParentEmail, setNewParentEmail] = useState('');
  const [newAddress, setNewAddress] = useState('');

  // Filter students
  const filteredStudents = students.filter((s) => {
    const matchSearch =
      s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.admissionNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.parentName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCampus = selectedCampus === 'all' || s.campusId === selectedCampus;
    const matchClass = selectedClass === 'all' || s.className.toLowerCase().includes(selectedClass.toLowerCase());
    const matchStatus = selectedStatus === 'all' || s.status === selectedStatus;
    return matchSearch && matchCampus && matchClass && matchStatus;
  });

  // CSV Parser
  const parseCSVRows = (text: string): Student[] => {
    const lines = text.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length <= 1) return [];

    const parsed: Student[] = [];
    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Split by comma ignoring commas inside quotes
      const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((p) => p.trim().replace(/^"|"$/g, ''));
      if (parts.length >= 4) {
        const admissionNo = parts[0] || `STU-2026-${String(students.length + i).padStart(5, '0')}`;
        const fullName = parts[1] || 'Imported Student';
        const rollNo = parts[2] || 'A-01';
        const className = parts[3] || 'Grade 10';
        const section = parts[4] || 'A';
        const campusId = parts[5] || campuses[0]?.id || 'camp-1';
        const parentName = parts[6] || 'Parent Guardian';
        let parentPhone = parts[7] || '+1 (650) 555-0100';
        if (parentPhone.includes('#ERROR') || !parentPhone.trim()) {
          parentPhone = '+1 (650) 555-0199';
        }
        const parentEmail = parts[8] || 'parent@example.com';
        const status = (parts[9] as any) || 'active';
        const feesDue = Number(parts[10]) || 0;
        const admissionDate = parts[11] || new Date().toISOString().split('T')[0];

        const campusObj = campuses.find((c) => c.id === campusId);

        parsed.push({
          id: `stu-import-${Date.now()}-${i}`,
          admissionNo,
          fullName,
          gender: 'Male',
          dob: '2011-06-15',
          className,
          section,
          rollNo,
          campusId,
          campusName: campusObj?.name || 'Main Campus',
          parentName,
          parentPhone,
          parentEmail,
          address: 'Oakridge Campus District, CA',
          admissionDate,
          status,
          feesDue,
          avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&auto=format&fit=crop&q=80',
        });
      }
    }
    return parsed;
  };

  const handleOpenImportModal = () => {
    setShowImportModal(true);
    const initial = parseCSVRows(csvInput);
    setParsedImportRows(initial);
  };

  const handleCsvChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCsvInput(e.target.value);
    const parsed = parseCSVRows(e.target.value);
    setParsedImportRows(parsed);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setCsvInput(text);
        const parsed = parseCSVRows(text);
        setParsedImportRows(parsed);
      }
    };
    reader.readAsText(file);
  };

  const handleFetchFromGoogleSheet = async () => {
    if (!accessToken || !connectedSheetId) {
      setImportNotice('Please connect your Google Workspace account and select a connected sheet first.');
      return;
    }
    setIsImporting(true);
    setImportNotice(null);
    try {
      const rows = await readSpreadsheetValues(accessToken, connectedSheetId, 'Students!A2:L50');
      if (rows.length === 0) {
        setImportNotice('No student records found in Students tab.');
        return;
      }
      const imported: Student[] = rows.map((r, idx) => {
        let phone = String(r[7] || '');
        if (phone.includes('#ERROR') || !phone.trim()) phone = '+1 (650) 555-0199';
        const campusObj = campuses.find((c) => c.id === String(r[5] || 'camp-1'));
        return {
          id: `stu-sheet-${Date.now()}-${idx}`,
          admissionNo: String(r[0] || `STU-2026-${String(idx + 1).padStart(5, '0')}`),
          fullName: String(r[1] || 'Enrolled Student'),
          gender: 'Male',
          dob: '2011-05-15',
          className: String(r[3] || 'Grade 10'),
          section: String(r[4] || 'A'),
          rollNo: String(r[2] || 'A-01'),
          campusId: String(r[5] || 'camp-1'),
          campusName: campusObj?.name || 'Main Campus',
          parentName: String(r[6] || 'Guardian'),
          parentPhone: phone,
          parentEmail: String(r[8] || 'parent@example.com'),
          address: 'Oakridge Campus, CA',
          admissionDate: String(r[11] || new Date().toISOString().split('T')[0]),
          status: (r[9] as any) || 'active',
          feesDue: Number(r[10]) || 0,
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
        };
      });
      setParsedImportRows(imported);
      setImportNotice(`Loaded ${imported.length} student records from Google Sheets.`);
    } catch (err: any) {
      console.error('Fetch from Sheets error:', err);
      setImportNotice(`Error loading from Sheets: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleCommitImport = () => {
    if (parsedImportRows.length === 0) return;
    if (onBatchImportStudents) {
      onBatchImportStudents(parsedImportRows);
    } else {
      parsedImportRows.forEach((s) => onAddStudent(s));
    }
    setShowImportModal(false);
  };

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName) return;

    // Generate smart sequence STU-2026-000XX
    const count = students.length + 1;
    const admissionNo = `STU-2026-${String(count).padStart(5, '0')}`;
    const campusObj = campuses.find((c) => c.id === newCampusId);

    onAddStudent({
      admissionNo,
      fullName: newFullName,
      gender: newGender,
      dob: newDob,
      className: newClass,
      section: newSection,
      rollNo: newRollNo,
      campusId: newCampusId,
      campusName: campusObj?.name || 'Main Campus',
      parentName: newParentName || 'Guardian',
      parentPhone: newParentPhone || '+1 (650) 555-0100',
      parentEmail: newParentEmail || 'parent@example.com',
      address: newAddress || 'Oakridge Residence Area, CA',
      admissionDate: new Date().toISOString().split('T')[0],
      status: 'active',
      feesDue: 0,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    });

    // Reset & Close
    setNewFullName('');
    setNewParentName('');
    setNewParentPhone('');
    setNewParentEmail('');
    setShowAddModal(false);
  };

  const handleStartEdit = (student: Student) => {
    setSelectedStudent(student);
    setEditForm({ ...student });
    setIsEditingStudent(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !onUpdateStudent) return;
    const updated: Student = {
      ...selectedStudent,
      ...editForm,
    };
    onUpdateStudent(updated);
    setSelectedStudent(updated);
    setIsEditingStudent(false);
  };

  const handleDeleteConfirm = () => {
    if (!selectedStudent || !onDeleteStudent) return;
    if (confirm(`Are you sure you want to remove ${selectedStudent.fullName} (${selectedStudent.admissionNo}) from the student directory?`)) {
      onDeleteStudent(selectedStudent.id);
      setSelectedStudent(null);
      setIsEditingStudent(false);
    }
  };

  const handleExportGoogleSheet = () => {
    const headers = ['Admission No', 'Full Name', 'Class', 'Section', 'Campus', 'Parent Name', 'Parent Phone', 'Status', 'Fees Due'];
    const rows = filteredStudents.map((s) => [
      s.admissionNo,
      s.fullName,
      s.className,
      s.section,
      s.campusName || s.campusId,
      s.parentName,
      s.parentPhone,
      s.status,
      s.feesDue,
    ]);
    onExportToSheet(`Oakridge Academy - Student Directory (${new Date().toISOString().split('T')[0]})`, headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" />
            Student Directory & Admissions
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage student profiles, enrollments, class rosters, and parent contacts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenImportModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Import CSV / Sheets</span>
          </button>
          <button
            onClick={handleExportGoogleSheet}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export to Google Sheets</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Admission</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student name, admission number, parent..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Campus Filter */}
          <select
            value={selectedCampus}
            onChange={(e) => setSelectedCampus(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 outline-none"
          >
            <option value="all">All Campuses</option>
            {campuses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Grade Filter */}
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 outline-none"
          >
            <option value="all">All Grades</option>
            <option value="Grade 8">Grade 8</option>
            <option value="Grade 9">Grade 9</option>
            <option value="Grade 10">Grade 10</option>
            <option value="Grade 11">Grade 11</option>
            <option value="Grade 12">Grade 12</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 outline-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="graduated">Graduated</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Admission No</th>
                <th className="py-3 px-4">Class & Section</th>
                <th className="py-3 px-4">Campus</th>
                <th className="py-3 px-4">Parent / Guardian</th>
                <th className="py-3 px-4">Fees Due</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No student records matching current filters.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 shrink-0">
                          {student.avatarUrl ? (
                            <img src={student.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-slate-600">
                              {student.fullName.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {student.fullName}
                          </div>
                          <div className="text-[10px] text-slate-400">{student.gender} · Roll: {student.rollNo}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-700 dark:text-slate-300">
                      {student.admissionNo}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {student.className}
                      </span>
                      <span className="ml-1 text-slate-400">({student.section})</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {student.campusName || 'Main Campus'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{student.parentName}</div>
                      <div className="text-[10px] text-slate-400">{student.parentPhone}</div>
                    </td>
                    <td className="py-3 px-4">
                      {student.feesDue > 0 ? (
                        <span className="font-bold text-rose-500">
                          ${student.feesDue.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Settled
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          student.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {student.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedStudent(student)}
                        className="px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors"
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Profile & Actions Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100">
                  <img src={selectedStudent.avatarUrl} alt="" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {selectedStudent.fullName}
                  </h2>
                  <p className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                    {selectedStudent.admissionNo} · {selectedStudent.className} ({selectedStudent.section})
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedStudent(null);
                  setIsEditingStudent(false);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isEditingStudent ? (
              <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editForm.fullName || ''}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, fullName: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Class</label>
                    <input
                      type="text"
                      value={editForm.className || ''}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, className: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Section</label>
                    <input
                      type="text"
                      value={editForm.section || ''}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, section: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Parent Phone</label>
                    <input
                      type="text"
                      value={editForm.parentPhone || ''}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, parentPhone: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Status</label>
                    <select
                      value={editForm.status || 'active'}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value as any }))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                    >
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                      <option value="graduated">Graduated</option>
                      <option value="transferred">Transferred</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Parent Email</label>
                  <input
                    type="email"
                    value={editForm.parentEmail || ''}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, parentEmail: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                  />
                </div>
                <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsEditingStudent(false)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                  >
                    Save Updates
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Campus</span>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedStudent.campusName || 'Main Campus'}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Fee Status</span>
                    <div className="font-semibold">
                      {selectedStudent.feesDue > 0 ? (
                        <span className="text-rose-500">${selectedStudent.feesDue} Due</span>
                      ) : (
                        <span className="text-emerald-500">Fully Settled</span>
                      )}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Guardian Contact</span>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedStudent.parentName}
                    </div>
                    <div className="text-slate-500">{selectedStudent.parentPhone}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Guardian Email</span>
                    <div className="text-slate-800 dark:text-slate-200 truncate">{selectedStudent.parentEmail}</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Residential Address</span>
                  <div className="text-slate-700 dark:text-slate-300">{selectedStudent.address}</div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStartEdit(selectedStudent)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 flex items-center gap-1.5 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Student</span>
                    </button>
                    {onDeleteStudent && (
                      <button
                        onClick={handleDeleteConfirm}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-1.5 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedStudent(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Import Students from CSV / Google Sheets Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center font-bold">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Import Students from Google Sheets / CSV
                  </h2>
                  <p className="text-xs text-slate-500">
                    Paste CSV roster data, load directly from your connected Google Sheet, or upload a .csv file.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions Bar */}
            <div className="flex flex-wrap items-center gap-2">
              {accessToken && connectedSheetId && (
                <button
                  type="button"
                  onClick={handleFetchFromGoogleSheet}
                  disabled={isImporting}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Fetch from Connected Google Sheet</span>
                </button>
              )}
              <label className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload CSV File</span>
                <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
              </label>
              <button
                type="button"
                onClick={() => {
                  const sample = `Admission No,Full Name,Roll No,Class,Section,Campus ID,Parent Name,Phone,Parent Email,Status,Fees Due ($),Admission Date
STU-2026-00006,Waqar,10-A-15,Grade 8,A,camp-1,Manzoor Ahmad,3084119786,parent@example.com,active,0,2026-09-25
STU-2026-00001,Alexander Liam Wright,10-A-01,Grade 10,A,camp-1,Robert & Clara Wright,+1 (650) 555-0192,robert.wright@gmail.com,active,0,2024-08-20
STU-2026-00002,Sophia Isabella Martinez,09-B-08,Grade 9,B,camp-1,Carlos Martinez,+1 (650) 555-0348,carlos.m@example.com,active,450,2024-08-22
STU-2026-00003,Ethan Jin Woo,10-A-03,Grade 10,A,camp-2,Min-ho & Grace Woo,+1 (650) 555-8812,mwoo@stemtech.io,active,1200,2025-01-10
STU-2026-00004,Amara Chloe Patel,11-SCI-12,Grade 11,Science,camp-2,Dev & Nina Patel,+1 (650) 555-9014,nina.patel@biolabs.com,active,0,2023-08-15
STU-2026-00005,Lucas Benjamin Scott,08-A-04,Grade 8,A,camp-3,Rachel Scott,+1 (650) 555-4421,rachel.scott@designhub.org,active,300,2025-08-18`;
                  setCsvInput(sample);
                  setParsedImportRows(parseCSVRows(sample));
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Reset to Waqar Sample Roster
              </button>
            </div>

            {importNotice && (
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-semibold">
                {importNotice}
              </div>
            )}

            {/* CSV Text Area */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Raw CSV Data (Comma-Separated)
              </label>
              <textarea
                rows={6}
                value={csvInput}
                onChange={handleCsvChange}
                className="w-full font-mono text-[11px] p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-slate-100"
                placeholder="Paste CSV text here..."
              ></textarea>
            </div>

            {/* Parsed Preview Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 dark:text-white">
                  Parsed Records Preview ({parsedImportRows.length} valid students)
                </span>
                <span className="text-slate-400 text-[11px]">
                  Phone numbers sanitized (#ERROR! automatically cleaned)
                </span>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-48 overflow-y-auto text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 sticky top-0 font-semibold text-[11px]">
                    <tr>
                      <th className="py-2 px-3">Admission No</th>
                      <th className="py-2 px-3">Full Name</th>
                      <th className="py-2 px-3">Class</th>
                      <th className="py-2 px-3">Guardian Name</th>
                      <th className="py-2 px-3">Phone</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {parsedImportRows.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-1.5 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {p.admissionNo}
                        </td>
                        <td className="py-1.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                          {p.fullName}
                        </td>
                        <td className="py-1.5 px-3 text-slate-500">
                          {p.className} ({p.section})
                        </td>
                        <td className="py-1.5 px-3 text-slate-500">{p.parentName}</td>
                        <td className="py-1.5 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                          {p.parentPhone}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-400">
                New records will be merged with existing directory.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCommitImport}
                  disabled={parsedImportRows.length === 0}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Import {parsedImportRows.length} Students Now</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Student Admission Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    New Student Enrollment Form
                  </h2>
                  <p className="text-[11px] text-slate-400">Auto-assigns STU-2026-XXXXX numbering</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Student Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maya Katherine Vance"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Gender</label>
                  <select
                    value={newGender}
                    onChange={(e) => setNewGender(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Date of Birth</label>
                  <input
                    type="date"
                    value={newDob}
                    onChange={(e) => setNewDob(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                  >
                  </input>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Class</label>
                  <select
                    value={newClass}
                    onChange={(e) => setNewClass(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                  >
                    <option value="Grade 8">Grade 8</option>
                    <option value="Grade 9">Grade 9</option>
                    <option value="Grade 10">Grade 10</option>
                    <option value="Grade 11">Grade 11</option>
                    <option value="Grade 12">Grade 12</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Section</label>
                  <input
                    type="text"
                    value={newSection}
                    onChange={(e) => setNewSection(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Roll No</label>
                  <input
                    type="text"
                    value={newRollNo}
                    onChange={(e) => setNewRollNo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Allocated Campus</label>
                <select
                  value={newCampusId}
                  onChange={(e) => setNewCampusId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                >
                  {campuses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Parent / Guardian Name</label>
                  <input
                    type="text"
                    placeholder="e.g. David Vance"
                    value={newParentName}
                    onChange={(e) => setNewParentName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Parent Phone</label>
                  <input
                    type="text"
                    placeholder="+1 (650) 555-0199"
                    value={newParentPhone}
                    onChange={(e) => setNewParentPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Parent Email (for Gmail Sync)</label>
                <input
                  type="email"
                  placeholder="parent@example.com"
                  value={newParentEmail}
                  onChange={(e) => setNewParentEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Residential Address</label>
                <input
                  type="text"
                  placeholder="Street, City, State, ZIP"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/20"
                >
                  Confirm Admission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
