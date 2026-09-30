import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Users,
  Building,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Edit2,
  Trash2,
  Printer,
  Download,
  Search,
  UserCheck,
  UserX,
  BellRing,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  ChevronDown,
  Layers,
  MapPin,
  X,
  Copy,
} from 'lucide-react';
import {
  TimetableSlot,
  SubstituteRecord,
  TimetableConflict,
  WeekDay,
  Employee,
} from '../types/erp';

interface TimetableViewProps {
  initialSlots?: TimetableSlot[];
  initialSubstitutes?: SubstituteRecord[];
  employees: Employee[];
  onShowToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
  onDispatchNotification?: (title: string, message: string, target: 'Teachers' | 'All Users' | 'Students') => void;
}

const DAYS: WeekDay[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const PERIODS = [
  { period: 1, name: 'Period 1', time: '08:30 - 09:15', isBreak: false },
  { period: 2, name: 'Period 2', time: '09:15 - 10:00', isBreak: false },
  { period: 0, name: 'Morning Recess', time: '10:00 - 10:15', isBreak: true },
  { period: 3, name: 'Period 3', time: '10:15 - 11:00', isBreak: false },
  { period: 4, name: 'Period 4', time: '11:00 - 11:45', isBreak: false },
  { period: 99, name: 'Lunch & Activity', time: '11:45 - 12:30', isBreak: true },
  { period: 5, name: 'Period 5', time: '12:30 - 13:15', isBreak: false },
  { period: 6, name: 'Period 6', time: '13:15 - 14:00', isBreak: false },
  { period: 7, name: 'Period 7', time: '14:00 - 14:45', isBreak: false },
  { period: 8, name: 'Period 8', time: '14:45 - 15:30', isBreak: false },
];

const ROOMS_LIST = [
  'Room 101',
  'Room 102',
  'Room 103',
  'Room 201',
  'Room 202',
  'Science Lab 1',
  'Science Lab 2',
  'Computer Lab 1',
  'Computer Lab 2',
  'Central Library',
  'Auditorium',
  'Sports Ground',
  'Music Studio',
  'Art & Design Lab',
];

const CLASSES_LIST = [
  { className: 'Grade 8', section: 'A' },
  { className: 'Grade 8', section: 'B' },
  { className: 'Grade 9', section: 'A' },
  { className: 'Grade 9', section: 'B' },
  { className: 'Grade 10', section: 'A' },
  { className: 'Grade 10', section: 'B' },
  { className: 'Grade 11', section: 'Science' },
  { className: 'Grade 11', section: 'Commerce' },
  { className: 'Grade 12', section: 'Science' },
  { className: 'Grade 12', section: 'Humanities' },
];

const SUBJECTS_LIST = [
  'Advanced Mathematics',
  'Physics',
  'Physics Lab',
  'Chemistry',
  'Chemistry Lab',
  'Biology',
  'Computer Science',
  'Robotics & AI',
  'English Literature',
  'World History',
  'History & Civics',
  'Physical Education & Sports',
  'Library & Reading Hour',
  'Economics & Accounting',
  'Art & Visual Design',
];

export const TimetableView: React.FC<TimetableViewProps> = ({
  initialSlots = [],
  initialSubstitutes = [],
  employees,
  onShowToast,
  onDispatchNotification,
}) => {
  const [slots, setSlots] = useState<TimetableSlot[]>(initialSlots);
  const [substitutes, setSubstitutes] = useState<SubstituteRecord[]>(initialSubstitutes);
  
  // Navigation Mode
  const [activeTab, setActiveTab] = useState<
    'class' | 'teacher' | 'room' | 'conflicts' | 'substitute'
  >('class');

  // Filter selections
  const [selectedClass, setSelectedClass] = useState('Grade 10');
  const [selectedSection, setSelectedSection] = useState('A');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('EMP-001');
  const [selectedRoom, setSelectedRoom] = useState<string>('Room 101');
  const [searchQuery, setSearchQuery] = useState('');

  // Slot Edit / Create Modal
  const [editingSlot, setEditingSlot] = useState<Partial<TimetableSlot> | null>(null);
  const [showSlotModal, setShowSlotModal] = useState(false);

  // Substitute Assignment Modal
  const [showSubstituteModal, setShowSubstituteModal] = useState(false);
  const [absentTeacherId, setAbsentTeacherId] = useState<string>('');
  const [absentDate, setAbsentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [absentReason, setAbsentReason] = useState<string>('Medical Leave');
  const [selectedSlotForSub, setSelectedSlotForSub] = useState<TimetableSlot | null>(null);
  const [chosenSubTeacherId, setChosenSubTeacherId] = useState<string>('');

  // -------------------------------------------------------------
  // SMART CONFLICT DETECTION ENGINE
  // -------------------------------------------------------------
  const conflicts = useMemo<TimetableConflict[]>(() => {
    const detected: TimetableConflict[] = [];

    // 1. Teacher Double Booking
    const teacherMap = new Map<string, TimetableSlot>();
    slots.forEach((s) => {
      const activeTeacher = s.substituteTeacherId || s.teacherId;
      const key = `${s.day}-${s.period}-${activeTeacher}`;
      if (teacherMap.has(key)) {
        const other = teacherMap.get(key)!;
        detected.push({
          id: `conflict-tch-${s.id}-${other.id}`,
          type: 'teacher_double_booking',
          severity: 'high',
          title: 'Teacher Double Booking Conflict',
          description: `Teacher ${s.substituteTeacherName || s.teacherName} is scheduled in both ${other.className}-${other.section} (${other.room}) and ${s.className}-${s.section} (${s.room}) during ${s.day} Period ${s.period}.`,
          day: s.day,
          period: s.period,
          slotA: other,
          slotB: s,
        });
      } else {
        teacherMap.set(key, s);
      }
    });

    // 2. Room Double Booking
    const roomMap = new Map<string, TimetableSlot>();
    slots.forEach((s) => {
      if (s.room && s.room !== 'Sports Ground') {
        const key = `${s.day}-${s.period}-${s.room}`;
        if (roomMap.has(key)) {
          const other = roomMap.get(key)!;
          detected.push({
            id: `conflict-rm-${s.id}-${other.id}`,
            type: 'room_double_booking',
            severity: 'high',
            title: 'Room Resource Double Booking',
            description: `Room "${s.room}" is booked simultaneously for ${other.className}-${other.section} (${other.subject}) and ${s.className}-${s.section} (${s.subject}) on ${s.day} Period ${s.period}.`,
            day: s.day,
            period: s.period,
            slotA: other,
            slotB: s,
          });
        } else {
          roomMap.set(key, s);
        }
      }
    });

    // 3. Class Overlapping Periods
    const classMap = new Map<string, TimetableSlot>();
    slots.forEach((s) => {
      const key = `${s.day}-${s.period}-${s.className}-${s.section}`;
      if (classMap.has(key)) {
        const other = classMap.get(key)!;
        detected.push({
          id: `conflict-cls-${s.id}-${other.id}`,
          type: 'class_overlap',
          severity: 'high',
          title: 'Class Period Overlap Conflict',
          description: `Class ${s.className}-${s.section} has two conflicting subjects assigned: "${other.subject}" and "${s.subject}" on ${s.day} Period ${s.period}.`,
          day: s.day,
          period: s.period,
          slotA: other,
          slotB: s,
        });
      } else {
        classMap.set(key, s);
      }
    });

    // 4. Workload Overload Check (> 24 periods per week)
    const teacherLoadMap = new Map<string, number>();
    slots.forEach((s) => {
      const tId = s.substituteTeacherId || s.teacherId;
      teacherLoadMap.set(tId, (teacherLoadMap.get(tId) || 0) + 1);
    });

    teacherLoadMap.forEach((count, tId) => {
      if (count > 24) {
        const tObj = employees.find((e) => e.empNo === tId || e.id === tId);
        const firstSlot = slots.find((s) => s.teacherId === tId);
        if (firstSlot) {
          detected.push({
            id: `conflict-workload-${tId}`,
            type: 'workload_exceeded',
            severity: 'warning',
            title: 'Faculty Workload Exceeded',
            description: `${tObj?.fullName || firstSlot.teacherName} has ${count} periods/week allocated (exceeds recommended policy limit of 24 periods).`,
            day: firstSlot.day,
            period: firstSlot.period,
            slotA: firstSlot,
          });
        }
      }
    });

    return detected;
  }, [slots, employees]);

  // Teacher Workload Stats
  const teacherWorkloadStats = useMemo(() => {
    const map: Record<string, number> = {};
    slots.forEach((s) => {
      const tId = s.substituteTeacherId || s.teacherId;
      map[tId] = (map[tId] || 0) + 1;
    });
    return map;
  }, [slots]);

  // Filtered Slots for Active Tab
  const activeGridSlots = useMemo(() => {
    if (activeTab === 'class') {
      return slots.filter(
        (s) => s.className === selectedClass && s.section === selectedSection
      );
    }
    if (activeTab === 'teacher') {
      return slots.filter(
        (s) => (s.substituteTeacherId || s.teacherId) === selectedTeacherId
      );
    }
    if (activeTab === 'room') {
      return slots.filter((s) => s.room === selectedRoom);
    }
    return slots;
  }, [slots, activeTab, selectedClass, selectedSection, selectedTeacherId, selectedRoom]);

  // Find slot for day and period
  const getSlot = (day: WeekDay, period: number) => {
    return activeGridSlots.find((s) => s.day === day && s.period === period);
  };

  // Handle Save Slot
  const handleSaveSlot = (slotData: Partial<TimetableSlot>) => {
    if (!slotData.subject || !slotData.teacherName || !slotData.room) {
      onShowToast('error', 'Validation Error', 'Subject, Teacher, and Room are required.');
      return;
    }

    if (slotData.id) {
      // update
      setSlots((prev) =>
        prev.map((s) => (s.id === slotData.id ? ({ ...s, ...slotData } as TimetableSlot) : s))
      );
      onShowToast('success', 'Timetable Updated', 'Period schedule slot saved successfully.');
    } else {
      // create
      const newSlot: TimetableSlot = {
        id: `slot-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        day: slotData.day || 'Monday',
        period: slotData.period || 1,
        startTime: slotData.startTime || '08:30',
        endTime: slotData.endTime || '09:15',
        className: slotData.className || selectedClass,
        section: slotData.section || selectedSection,
        subject: slotData.subject,
        teacherId: slotData.teacherId || 'EMP-001',
        teacherName: slotData.teacherName,
        room: slotData.room,
        type: slotData.type || 'Lecture',
      };
      setSlots((prev) => [...prev, newSlot]);
      onShowToast('success', 'Slot Added', `Added ${newSlot.subject} to ${newSlot.day} Period ${newSlot.period}.`);
    }
    setShowSlotModal(false);
    setEditingSlot(null);
  };

  // Handle Delete Slot
  const handleDeleteSlot = (id: string) => {
    setSlots((prev) => prev.filter((s) => s.id !== id));
    setShowSlotModal(false);
    setEditingSlot(null);
    onShowToast('info', 'Slot Cleared', 'Schedule slot has been removed.');
  };

  // Available substitute teachers for a specific slot
  const availableSubstitutes = useMemo(() => {
    if (!selectedSlotForSub) return [];
    // Teachers who DO NOT have a class on this slot's day & period
    const busyTeacherIds = new Set(
      slots
        .filter((s) => s.day === selectedSlotForSub.day && s.period === selectedSlotForSub.period)
        .map((s) => s.substituteTeacherId || s.teacherId)
    );

    return employees.filter(
      (emp) =>
        emp.status === 'active' &&
        emp.department === 'Academic' &&
        !busyTeacherIds.has(emp.empNo) &&
        !busyTeacherIds.has(emp.id) &&
        emp.empNo !== selectedSlotForSub.teacherId
    );
  }, [selectedSlotForSub, slots, employees]);

  // Handle Assign Substitute
  const handleAssignSubstitute = () => {
    if (!selectedSlotForSub || !chosenSubTeacherId) {
      onShowToast('error', 'Select Substitute', 'Please select a qualified available teacher.');
      return;
    }

    const subTeacher = employees.find(
      (e) => e.empNo === chosenSubTeacherId || e.id === chosenSubTeacherId
    );

    const subRecord: SubstituteRecord = {
      id: `SUB-${Date.now().toString().slice(-4)}`,
      date: absentDate,
      originalTeacherId: selectedSlotForSub.teacherId,
      originalTeacherName: selectedSlotForSub.teacherName,
      substituteTeacherId: chosenSubTeacherId,
      substituteTeacherName: subTeacher?.fullName || 'Assigned Substitute',
      slotId: selectedSlotForSub.id,
      day: selectedSlotForSub.day,
      period: selectedSlotForSub.period,
      className: selectedSlotForSub.className,
      section: selectedSlotForSub.section,
      subject: selectedSlotForSub.subject,
      room: selectedSlotForSub.room,
      reason: absentReason,
      status: 'Assigned',
      assignedBy: 'Administrator',
      assignedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };

    // Update slots with substitute
    setSlots((prev) =>
      prev.map((s) =>
        s.id === selectedSlotForSub.id
          ? {
              ...s,
              substituteTeacherId: chosenSubTeacherId,
              substituteTeacherName: subTeacher?.fullName,
            }
          : s
      )
    );

    setSubstitutes((prev) => [subRecord, ...prev]);

    if (onDispatchNotification) {
      onDispatchNotification(
        `Substitute Assignment: ${selectedSlotForSub.className}-${selectedSlotForSub.section}`,
        `${subTeacher?.fullName} will substitute for ${selectedSlotForSub.teacherName} in ${selectedSlotForSub.subject} on ${selectedSlotForSub.day} (Period ${selectedSlotForSub.period}).`,
        'Teachers'
      );
    }

    onShowToast(
      'success',
      'Substitute Assigned',
      `${subTeacher?.fullName} designated for ${selectedSlotForSub.className}-${selectedSlotForSub.section}. Notifications dispatched.`
    );

    setShowSubstituteModal(false);
    setSelectedSlotForSub(null);
    setChosenSubTeacherId('');
  };

  // Revert substitute
  const handleCancelSubstitute = (subId: string, slotId: string) => {
    setSubstitutes((prev) =>
      prev.map((sub) => (sub.id === subId ? { ...sub, status: 'Cancelled' } : sub))
    );
    setSlots((prev) =>
      prev.map((s) =>
        s.id === slotId
          ? { ...s, substituteTeacherId: undefined, substituteTeacherName: undefined }
          : s
      )
    );
    onShowToast('info', 'Substitute Cancelled', 'Original teacher schedule restored.');
  };

  // Print timetable
  const handlePrintTimetable = () => {
    window.print();
  };

  // Export Timetable to CSV
  const handleExportCSV = () => {
    const headers = ['Day', 'Period', 'Time', 'Class', 'Section', 'Subject', 'Teacher', 'Room', 'Type', 'Substitute'];
    const rows = slots.map((s) => [
      s.day,
      s.period,
      `${s.startTime}-${s.endTime}`,
      s.className,
      s.section,
      s.subject,
      s.teacherName,
      s.room,
      s.type,
      s.substituteTeacherName || 'None',
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Timetable_Schedule_${selectedClass}_${selectedSection}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast('success', 'Export Complete', 'Timetable downloaded as CSV.');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-800 text-white shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white/20 text-white backdrop-blur-xs">
              Institutional Scheduling Engine
            </span>
            {conflicts.length > 0 ? (
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-900 animate-pulse">
                <AlertTriangle className="w-3 h-3" />
                {conflicts.length} Conflict{conflicts.length > 1 ? 's' : ''} Detected
              </span>
            ) : (
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/30 text-emerald-200">
                <CheckCircle2 className="w-3 h-3" />
                All Rosters Conflict-Free
              </span>
            )}
          </div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Clock className="w-7 h-7 text-indigo-200" />
            Timetable &amp; Master Scheduling Studio
          </h1>
          <p className="text-xs text-indigo-100 max-w-2xl">
            Multi-dimensional institutional schedules for classes, teachers, and rooms with live double-booking detection, workload analytics, and substitute teacher management.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setEditingSlot({
                day: 'Monday',
                period: 1,
                startTime: '08:30',
                endTime: '09:15',
                className: selectedClass,
                section: selectedSection,
                type: 'Lecture',
              });
              setShowSlotModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-indigo-900 font-bold text-xs hover:bg-indigo-50 shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            Schedule New Period
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600/50 hover:bg-indigo-600 border border-white/20 text-white font-semibold text-xs transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            onClick={handlePrintTimetable}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600/50 hover:bg-indigo-600 border border-white/20 text-white font-semibold text-xs transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Grid
          </button>
        </div>
      </div>

      {/* Conflicts Alert Ribbon (if conflicts exist) */}
      {conflicts.length > 0 && activeTab !== 'conflicts' && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm">
                Attention: {conflicts.length} scheduling conflict(s) require administrative review!
              </p>
              <p className="text-[11px] opacity-80">
                {conflicts[0].description}
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('conflicts')}
            className="px-3 py-1.5 rounded-lg bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 shrink-0"
          >
            Inspect &amp; Resolve Conflicts &rarr;
          </button>
        </div>
      )}

      {/* Main Tabs Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300">
          <button
            onClick={() => setActiveTab('class')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'class'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Class Timetable
          </button>
          <button
            onClick={() => setActiveTab('teacher')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'teacher'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Teacher Timetable &amp; Workload
          </button>
          <button
            onClick={() => setActiveTab('room')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'room'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            Room &amp; Resource Grid
          </button>
          <button
            onClick={() => setActiveTab('substitute')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'substitute'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Substitute Management
            {substitutes.filter((s) => s.status === 'Assigned').length > 0 && (
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('conflicts')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'conflicts'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs font-bold'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Conflict Diagnostics
            {conflicts.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white">
                {conflicts.length}
              </span>
            )}
          </button>
        </div>

        {/* View-Specific Filters */}
        <div className="flex items-center gap-2">
          {activeTab === 'class' && (
            <>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 font-medium">Class:</span>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200"
                >
                  {Array.from(new Set(CLASSES_LIST.map((c) => c.className))).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 font-medium">Sec:</span>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200"
                >
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="Science">Section Science</option>
                  <option value="Commerce">Section Commerce</option>
                </select>
              </div>
            </>
          )}

          {activeTab === 'teacher' && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 font-medium">Teacher:</span>
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 max-w-xs"
              >
                {employees
                  .filter((e) => e.department === 'Academic' || e.designation.includes('Teacher') || e.designation.includes('Lecturer') || e.designation.includes('Professor'))
                  .map((t) => (
                    <option key={t.id} value={t.empNo || t.id}>
                      {t.fullName} ({t.empNo}) - {teacherWorkloadStats[t.empNo] || 0} periods
                    </option>
                  ))}
              </select>
            </div>
          )}

          {activeTab === 'room' && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 font-medium">Room:</span>
              <select
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                {ROOMS_LIST.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* VIEW: TEACHER WORKLOAD ANALYTICS (When teacher tab selected) */}
      {activeTab === 'teacher' && (
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          {(() => {
            const currentTeacher = employees.find(
              (e) => e.empNo === selectedTeacherId || e.id === selectedTeacherId
            );
            const periodsCount = teacherWorkloadStats[selectedTeacherId] || 0;
            const maxRecommended = 24;
            const freePeriods = 36 - periodsCount; // assuming 6 periods x 6 days = 36 total available
            const loadPercent = Math.min(100, Math.round((periodsCount / maxRecommended) * 100));

            return (
              <>
                <div className="space-y-1">
                  <p className="text-slate-400 font-medium">Faculty Member</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {currentTeacher?.fullName || 'Assigned Faculty'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {currentTeacher?.designation} &bull; {currentTeacher?.empNo}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-400 font-medium">Weekly Allocated Load</p>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                      {periodsCount}
                    </span>
                    <span className="text-slate-500">/ {maxRecommended} periods max</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full ${
                        periodsCount > 24
                          ? 'bg-rose-500'
                          : periodsCount > 20
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${loadPercent}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-400 font-medium">Available Free Periods</p>
                  <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                    {Math.max(0, freePeriods)}
                  </p>
                  <p className="text-[11px] text-slate-500">Periods available for cover/subs</p>
                </div>
                <div className="flex items-center">
                  <button
                    onClick={() => {
                      setAbsentTeacherId(selectedTeacherId);
                      setShowSubstituteModal(true);
                    }}
                    className="w-full py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs"
                  >
                    <UserX className="w-3.5 h-3.5" />
                    Mark Absent &amp; Find Substitute
                  </button>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* VIEW: CONFLICT DIAGNOSTICS TAB */}
      {activeTab === 'conflicts' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Scheduling Conflict Diagnostic Center
              </h3>
              <p className="text-xs text-slate-500">
                Live automated analysis detecting teacher overlapping, room double-bookings, and class slot collisions.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400">
              {conflicts.length} Issues Found
            </span>
          </div>

          {conflicts.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Zero Conflicts Detected!
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                All teacher timetables, room assignments, and student rosters are fully synchronized without any overlapping periods.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {conflicts.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 max-w-3xl">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-rose-500/10 text-rose-600 dark:text-rose-400">
                        {c.type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {c.day} &bull; Period {c.period}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                      {c.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                      <span>
                        <strong>Slot A:</strong> {c.slotA.className}-{c.slotA.section} &bull; {c.slotA.subject} ({c.slotA.room})
                      </span>
                      {c.slotB && (
                        <span>
                          <strong>Slot B:</strong> {c.slotB.className}-{c.slotB.section} &bull; {c.slotB.subject} ({c.slotB.room})
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setEditingSlot(c.slotB || c.slotA);
                        setShowSlotModal(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
                    >
                      Reassign Slot
                    </button>
                    {c.slotB && (
                      <button
                        onClick={() => handleDeleteSlot(c.slotB!.id)}
                        className="px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-100"
                      >
                        Remove Slot B
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW: SUBSTITUTE MANAGEMENT TAB */}
      {activeTab === 'substitute' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-indigo-500" />
                Substitute Teacher Allocation &amp; Cover Register
              </h3>
              <p className="text-xs text-slate-500">
                Mark faculty absences, automatically query available teachers with zero timetable collisions, and notify students.
              </p>
            </div>
            <button
              onClick={() => setShowSubstituteModal(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
            >
              <UserX className="w-3.5 h-3.5" />
              Mark Teacher Absent &amp; Assign Cover
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Ref ID</th>
                  <th className="p-3">Date &amp; Slot</th>
                  <th className="p-3">Original Teacher</th>
                  <th className="p-3">Substitute Teacher</th>
                  <th className="p-3">Class &amp; Subject</th>
                  <th className="p-3">Room</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {substitutes.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                      {sub.id}
                    </td>
                    <td className="p-3">
                      <div className="font-semibold">{sub.date}</div>
                      <div className="text-[10px] text-slate-400">
                        {sub.day} &bull; Period {sub.period}
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="font-medium text-rose-600 dark:text-rose-400">
                        {sub.originalTeacherName}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {sub.substituteTeacherName}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold">{sub.className} ({sub.section})</div>
                      <div className="text-[10px] text-slate-400">{sub.subject}</div>
                    </td>
                    <td className="p-3 font-mono text-[11px]">{sub.room}</td>
                    <td className="p-3 text-slate-500 max-w-xs truncate">{sub.reason}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          sub.status === 'Assigned'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : sub.status === 'Completed'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {sub.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {sub.status === 'Assigned' && (
                        <button
                          onClick={() => handleCancelSubstitute(sub.id, sub.slotId)}
                          className="px-2.5 py-1 rounded bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 font-semibold text-[11px] hover:bg-rose-100"
                        >
                          Revert
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: MAIN TIMETABLE GRID (Class / Teacher / Room) */}
      {(activeTab === 'class' || activeTab === 'teacher' || activeTab === 'room') && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <table className="w-full border-collapse text-left min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
                <th className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-28 text-center">
                  Day / Period
                </th>
                {PERIODS.map((p, idx) => (
                  <th
                    key={idx}
                    className={`p-3 text-xs font-bold text-center border-l border-slate-200 dark:border-slate-800 ${
                      p.isBreak
                        ? 'bg-slate-100/70 dark:bg-slate-800/40 text-slate-400 w-16'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div>{p.name}</div>
                    <div className="text-[10px] font-normal text-slate-400">{p.time}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {DAYS.map((day) => (
                <tr key={day} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="p-3 text-xs font-black text-slate-800 dark:text-slate-200 text-center bg-slate-50/50 dark:bg-slate-800/30">
                    {day}
                  </td>
                  {PERIODS.map((p, pIdx) => {
                    if (p.isBreak) {
                      return (
                        <td
                          key={pIdx}
                          className="p-2 text-center border-l border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40"
                        >
                          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 -rotate-90 inline-block">
                            {p.name === 'Morning Recess' ? 'RECESS' : 'LUNCH'}
                          </span>
                        </td>
                      );
                    }

                    const slot = getSlot(day, p.period);
                    const isSubstitute = !!slot?.substituteTeacherName;
                    const hasConflict = conflicts.some(
                      (c) => c.day === day && c.period === p.period && (c.slotA.id === slot?.id || c.slotB?.id === slot?.id)
                    );

                    return (
                      <td
                        key={pIdx}
                        className={`p-1.5 border-l border-slate-200 dark:border-slate-800 align-top transition-all ${
                          hasConflict ? 'bg-amber-500/10' : ''
                        }`}
                      >
                        {slot ? (
                          <div
                            onClick={() => {
                              setEditingSlot(slot);
                              setShowSlotModal(true);
                            }}
                            className={`p-2.5 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] shadow-xs relative group ${
                              isSubstitute
                                ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
                                : slot.type === 'Lab'
                                ? 'bg-indigo-50/80 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800'
                                : slot.type === 'Activity'
                                ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {hasConflict && (
                              <div className="absolute -top-1.5 -right-1.5 p-0.5 rounded-full bg-amber-500 text-white shadow-xs">
                                <AlertTriangle className="w-3 h-3" />
                              </div>
                            )}

                            <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {slot.subject}
                            </div>

                            <div className="text-[10px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                              {activeTab !== 'class' && (
                                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                                  {slot.className}-{slot.section}
                                </span>
                              )}
                              <span>&bull;</span>
                              <span className="truncate">{slot.room}</span>
                            </div>

                            <div className="mt-1.5 flex items-center justify-between text-[10px]">
                              {isSubstitute ? (
                                <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                  <UserCheck className="w-3 h-3" />
                                  {slot.substituteTeacherName} (Sub)
                                </span>
                              ) : (
                                <span className="text-slate-600 dark:text-slate-300 truncate">
                                  {slot.teacherName}
                                </span>
                              )}
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                {slot.type}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingSlot({
                                day,
                                period: p.period,
                                startTime: p.time.split(' - ')[0],
                                endTime: p.time.split(' - ')[1],
                                className: selectedClass,
                                section: selectedSection,
                                room: selectedRoom,
                                teacherId: activeTab === 'teacher' ? selectedTeacherId : 'EMP-001',
                                type: 'Lecture',
                              });
                              setShowSlotModal(true);
                            }}
                            className="w-full h-full min-h-[75px] rounded-xl border border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-400 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20 transition-all flex flex-col items-center justify-center text-slate-400 hover:text-indigo-600 text-[10px] font-medium group"
                          >
                            <Plus className="w-3.5 h-3.5 mb-0.5 group-hover:scale-125 transition-transform" />
                            <span>Assign</span>
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL: ADD / EDIT TIMETABLE SLOT */}
      {showSlotModal && editingSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {editingSlot.id ? 'Modify Scheduled Slot' : 'Assign New Period Slot'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowSlotModal(false);
                  setEditingSlot(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-medium mb-1">Day of Week</label>
                  <select
                    value={editingSlot.day || 'Monday'}
                    onChange={(e) => setEditingSlot({ ...editingSlot, day: e.target.value as WeekDay })}
                    className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold"
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 font-medium mb-1">Period Number</label>
                  <select
                    value={editingSlot.period || 1}
                    onChange={(e) => setEditingSlot({ ...editingSlot, period: parseInt(e.target.value, 10) })}
                    className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((p) => (
                      <option key={p} value={p}>
                        Period {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-medium mb-1">Class</label>
                  <select
                    value={editingSlot.className || selectedClass}
                    onChange={(e) => setEditingSlot({ ...editingSlot, className: e.target.value })}
                    className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold"
                  >
                    {Array.from(new Set(CLASSES_LIST.map((c) => c.className))).map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 font-medium mb-1">Section</label>
                  <select
                    value={editingSlot.section || selectedSection}
                    onChange={(e) => setEditingSlot({ ...editingSlot, section: e.target.value })}
                    className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold"
                  >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="Science">Section Science</option>
                    <option value="Commerce">Section Commerce</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-medium mb-1">Subject</label>
                <select
                  value={editingSlot.subject || ''}
                  onChange={(e) => setEditingSlot({ ...editingSlot, subject: e.target.value })}
                  className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold"
                >
                  <option value="">-- Choose Subject --</option>
                  {SUBJECTS_LIST.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-medium mb-1">Assigned Teacher</label>
                  <select
                    value={editingSlot.teacherId || ''}
                    onChange={(e) => {
                      const emp = employees.find((em) => em.empNo === e.target.value || em.id === e.target.value);
                      setEditingSlot({
                        ...editingSlot,
                        teacherId: e.target.value,
                        teacherName: emp?.fullName || 'Assigned Teacher',
                      });
                    }}
                    className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold"
                  >
                    <option value="">-- Select Teacher --</option>
                    {employees
                      .filter((e) => e.department === 'Academic' || e.designation.includes('Teacher') || e.designation.includes('Lecturer'))
                      .map((emp) => (
                        <option key={emp.id} value={emp.empNo || emp.id}>
                          {emp.fullName} ({emp.empNo})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 font-medium mb-1">Room / Lab Resource</label>
                  <select
                    value={editingSlot.room || ''}
                    onChange={(e) => setEditingSlot({ ...editingSlot, room: e.target.value })}
                    className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold"
                  >
                    <option value="">-- Select Room --</option>
                    {ROOMS_LIST.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-medium mb-1">Period Type</label>
                  <select
                    value={editingSlot.type || 'Lecture'}
                    onChange={(e) => setEditingSlot({ ...editingSlot, type: e.target.value as any })}
                    className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold"
                  >
                    <option value="Lecture">Lecture</option>
                    <option value="Lab">Laboratory Practical</option>
                    <option value="Tutorial">Tutorial / Problem Solving</option>
                    <option value="Activity">Physical Activity / Sports</option>
                    <option value="Assembly">Morning Assembly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 font-medium mb-1">Time Slot</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      placeholder="08:30"
                      value={editingSlot.startTime || '08:30'}
                      onChange={(e) => setEditingSlot({ ...editingSlot, startTime: e.target.value })}
                      className="w-1/2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-center font-mono"
                    />
                    <span className="text-slate-400">-</span>
                    <input
                      type="text"
                      placeholder="09:15"
                      value={editingSlot.endTime || '09:15'}
                      onChange={(e) => setEditingSlot({ ...editingSlot, endTime: e.target.value })}
                      className="w-1/2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-center font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
              {editingSlot.id ? (
                <button
                  onClick={() => handleDeleteSlot(editingSlot.id!)}
                  className="px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 font-bold hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear Slot
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setShowSlotModal(false);
                    setEditingSlot(null);
                  }}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSaveSlot(editingSlot)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/20"
                >
                  Save Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: MARK TEACHER ABSENT & ASSIGN SUBSTITUTE */}
      {showSubstituteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Faculty Absence &amp; Smart Substitute Allocation
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowSubstituteModal(false);
                  setSelectedSlotForSub(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-medium mb-1">Absent Faculty Member</label>
                  <select
                    value={absentTeacherId}
                    onChange={(e) => {
                      setAbsentTeacherId(e.target.value);
                      setSelectedSlotForSub(null);
                    }}
                    className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold"
                  >
                    <option value="">-- Choose Absent Faculty --</option>
                    {employees
                      .filter((e) => e.department === 'Academic' || e.designation.includes('Teacher'))
                      .map((t) => (
                        <option key={t.id} value={t.empNo || t.id}>
                          {t.fullName} ({t.empNo})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 font-medium mb-1">Absence Date</label>
                  <input
                    type="date"
                    value={absentDate}
                    onChange={(e) => setAbsentDate(e.target.value)}
                    className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold"
                  >
                  </input>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-medium mb-1">Reason for Absence</label>
                <select
                  value={absentReason}
                  onChange={(e) => setAbsentReason(e.target.value)}
                  className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                >
                  <option value="Medical Leave">Medical Leave (Doctor Certificate)</option>
                  <option value="Emergency Family Leave">Emergency Family Leave</option>
                  <option value="Professional Development / Workshop">Professional Development / Workshop</option>
                  <option value="Inter-School Olympiad Chaperone">Inter-School Olympiad Chaperone</option>
                  <option value="Exam Proctoring Duty">Exam Proctoring Duty</option>
                  <option value="Casual Personal Leave">Casual Personal Leave</option>
                </select>
              </div>

              {/* Affected Periods for this teacher */}
              {absentTeacherId && (
                <div className="space-y-2">
                  <label className="block text-slate-500 font-medium">
                    Step 2: Select Affected Period to Reassign:
                  </label>
                  {(() => {
                    const affectedSlots = slots.filter(
                      (s) => s.teacherId === absentTeacherId
                    );
                    if (affectedSlots.length === 0) {
                      return (
                        <p className="text-slate-400 italic">
                          No active scheduled periods found for this faculty member.
                        </p>
                      );
                    }
                    return (
                      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                        {affectedSlots.map((s) => (
                          <div
                            key={s.id}
                            onClick={() => setSelectedSlotForSub(s)}
                            className={`p-2 rounded-xl border cursor-pointer transition-all ${
                              selectedSlotForSub?.id === s.id
                                ? 'bg-indigo-50 border-indigo-600 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-bold'
                                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[11px]">
                              <span>{s.day} (Period {s.period})</span>
                              <span className="text-[10px] font-mono">{s.room}</span>
                            </div>
                            <div className="text-xs font-bold truncate mt-0.5">{s.subject}</div>
                            <div className="text-[10px] text-slate-500">
                              {s.className} - {s.section}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Qualified Free Teachers for selected slot */}
              {selectedSlotForSub && (
                <div className="space-y-2 p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-900 dark:text-indigo-200">
                      Step 3: Available Free Teachers (Zero Conflicts):
                    </span>
                    <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                      {availableSubstitutes.length} Teachers Free
                    </span>
                  </div>

                  {availableSubstitutes.length === 0 ? (
                    <p className="text-slate-400 text-[11px] italic">
                      No academic faculty are free during this period slot. Please consider merging or rescheduling.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {availableSubstitutes.map((t) => (
                        <div
                          key={t.id}
                          onClick={() => setChosenSubTeacherId(t.empNo || t.id)}
                          className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                            chosenSubTeacherId === (t.empNo || t.id)
                              ? 'bg-emerald-500 text-white border-emerald-600 font-bold'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-indigo-300'
                          }`}
                        >
                          <div>
                            <div className="font-bold">{t.fullName}</div>
                            <div className="text-[10px] opacity-80">{t.designation}</div>
                          </div>
                          {chosenSubTeacherId === (t.empNo || t.id) && (
                            <CheckCircle2 className="w-4 h-4" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setShowSubstituteModal(false);
                  setSelectedSlotForSub(null);
                }}
                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignSubstitute}
                disabled={!selectedSlotForSub || !chosenSubTeacherId}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Confirm &amp; Notify Substitute
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
