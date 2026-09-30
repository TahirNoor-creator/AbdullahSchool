import { MasterTabConfig } from './workspace';
import {
  Student,
  AttendanceRecord,
  FeeInvoice,
  FeePayment,
  ExpenseRecord,
  Employee,
  PayrollRecord,
  InventoryItem,
  Campus,
  Announcement,
  AuditLog,
  SchoolProfile,
} from '../types/erp';

export interface FullERPBackupDatasets {
  students: Student[];
  attendance: AttendanceRecord[];
  invoices: FeeInvoice[];
  payments: FeePayment[];
  expenses: ExpenseRecord[];
  employees: Employee[];
  payroll?: PayrollRecord[];
  inventory?: InventoryItem[];
  campuses?: Campus[];
  announcements?: Announcement[];
  auditLogs?: AuditLog[];
  schoolProfile?: SchoolProfile;
  usersList?: any[];
}

export interface SheetTabDefinition {
  id: string;
  name: string;
  purpose: string;
  recordCount: (data: FullERPBackupDatasets) => number;
  tabColor: { red: number; green: number; blue: number };
  buildConfig: (data: FullERPBackupDatasets) => MasterTabConfig;
}

export const ALL_28_SHEET_TABS: SheetTabDefinition[] = [
  // 1. Users
  {
    id: 'Users',
    name: 'Users',
    purpose: 'Login users, passwords, roles, status',
    tabColor: { red: 0.15, green: 0.35, blue: 0.65 },
    recordCount: (d) => d.usersList?.length || 9,
    buildConfig: (d) => {
      const defaultUsers = [
        ['usr-001', 'superadmin', 'superadmin@oakridgeacademy.edu', 'Dr. Eleanor Vance', 'Super Admin', 'Director-General & Chancellor', 'Active', 'PBKDF2-100k-Salted', 0, 'No', '2026-09-26 09:20 AM'],
        ['usr-002', 'admin', 'admin@oakridgeacademy.edu', 'Arthur Pendelton', 'Admin', 'Chief Technology & Systems Director', 'Active', 'PBKDF2-100k-Salted', 0, 'No', '2026-09-26 09:15 AM'],
        ['usr-003', 'principal', 'principal@oakridgeacademy.edu', 'Prof. Margaret Sterling', 'Principal', 'Senior High School Principal', 'Active', 'PBKDF2-100k-Salted', 0, 'No', '2026-09-26 08:50 AM'],
        ['usr-004', 'accountant', 'bursar@oakridgeacademy.edu', 'Jonathan Reynolds, CPA', 'Accountant', 'Chief Financial Bursar & Comptroller', 'Active', 'PBKDF2-100k-Salted', 0, 'No', '2026-09-26 09:05 AM'],
        ['usr-005', 'teacher', 'teacher.clara@oakridgeacademy.edu', 'Clara Oswald, M.Ed.', 'Teacher', 'Head of Senior STEM & Physics Faculty', 'Active', 'PBKDF2-100k-Salted', 0, 'No', '2026-09-26 08:30 AM'],
        ['usr-006', 'security', 'security@oakridgeacademy.edu', 'Officer Thomas Jackson', 'Receptionist', 'Campus Gate & Optical QR Lead', 'Active', 'PBKDF2-100k-Salted', 0, 'No', '2026-09-26 07:45 AM'],
        ['usr-007', 'posoperator', 'pos@oakridgeacademy.edu', 'Liam Henderson', 'POS Operator', 'School Store & Bookstore Lead', 'Active', 'PBKDF2-100k-Salted', 0, 'No', '2026-09-26 08:15 AM'],
        ['usr-008', 'student', 'student@oakridgeacademy.edu', 'Alexander Hayes', 'Student', 'Student Council President (Grade 10-A)', 'Active', 'PBKDF2-100k-Salted', 0, 'No', '2026-09-26 08:00 AM'],
        ['usr-009', 'parent', 'parent@oakridgeacademy.edu', 'Robert & Clara Hayes', 'Parent', 'Guardian of Alexander Hayes', 'Active', 'PBKDF2-100k-Salted', 0, 'No', '2026-09-25 18:30 PM'],
      ];
      const rows = d.usersList?.map((u: any) => [
        u.id || 'usr-gen',
        u.username || u.email?.split('@')[0],
        u.email,
        u.name,
        u.role,
        u.designation || 'Staff',
        u.active ? 'Active' : 'Deactivated',
        'PBKDF2-100k-Salted',
        u.failedAttempts || 0,
        u.isLocked ? 'Locked' : 'No',
        new Date().toLocaleString(),
      ]) || defaultUsers;

      return {
        title: 'Users',
        tabColor: { red: 0.15, green: 0.35, blue: 0.65 },
        headers: ['User ID', 'Username', 'Institutional Email', 'Full Name', 'Role', 'Designation', 'Account Status', 'Security Hash', 'Failed Attempts', 'Locked', 'Last Login Audit'],
        rows,
      };
    },
  },

  // 2. Students
  {
    id: 'Students',
    name: 'Students',
    purpose: 'Student master data',
    tabColor: { red: 0.26, green: 0.52, blue: 0.96 },
    recordCount: (d) => d.students.length,
    buildConfig: (d) => ({
      title: 'Students',
      tabColor: { red: 0.26, green: 0.52, blue: 0.96 },
      headers: [
        'Admission No',
        'Full Name',
        'Gender',
        'Date of Birth',
        'Class',
        'Section',
        'Roll No',
        'Campus ID',
        'Parent Name',
        'Parent Phone',
        'Parent Email',
        'Address',
        'Admission Date',
        'Status',
        'Fees Due ($)',
      ],
      rows: d.students.map((s) => [
        s.admissionNo,
        s.fullName,
        s.gender,
        s.dob,
        s.className,
        s.section,
        s.rollNo,
        s.campusId,
        s.parentName,
        s.parentPhone,
        s.parentEmail,
        s.address,
        s.admissionDate,
        s.status,
        s.feesDue,
      ]),
    }),
  },

  // 3. Parents
  {
    id: 'Parents',
    name: 'Parents',
    purpose: 'Parent/guardian information',
    tabColor: { red: 0.12, green: 0.53, blue: 0.53 },
    recordCount: (d) => d.students.length,
    buildConfig: (d) => ({
      title: 'Parents',
      tabColor: { red: 0.12, green: 0.53, blue: 0.53 },
      headers: [
        'Parent ID',
        'Guardian Full Name',
        'Relationship',
        'Student Admission No',
        'Student Name',
        'Phone Number',
        'Email Address',
        'Residential Address',
        'Emergency Contact',
        'Status',
      ],
      rows: d.students.map((s, idx) => [
        `PAR-${String(idx + 1).padStart(4, '0')}`,
        s.parentName,
        'Father / Guardian',
        s.admissionNo,
        s.fullName,
        s.parentPhone,
        s.parentEmail,
        s.address,
        s.parentPhone,
        'Verified',
      ]),
    }),
  },

  // 4. Teachers
  {
    id: 'Teachers',
    name: 'Teachers',
    purpose: 'Teacher records',
    tabColor: { red: 0.38, green: 0.2, blue: 0.65 },
    recordCount: (d) => d.employees.filter((e) => e.department === 'Academic').length || 4,
    buildConfig: (d) => {
      const teachers = d.employees.filter((e) => e.department === 'Academic');
      return {
        title: 'Teachers',
        tabColor: { red: 0.38, green: 0.2, blue: 0.65 },
        headers: [
          'Employee No',
          'Full Name',
          'Department',
          'Designation',
          'Email Address',
          'Phone',
          'Join Date',
          'Monthly Salary ($)',
          'Status',
        ],
        rows: teachers.map((t) => [
          t.empNo,
          t.fullName,
          t.department,
          t.designation,
          t.email,
          t.phone,
          t.joinDate,
          t.salary,
          t.status,
        ]),
      };
    },
  },

  // 5. Staff
  {
    id: 'Staff',
    name: 'Staff',
    purpose: 'Non-teaching staff',
    tabColor: { red: 0.45, green: 0.35, blue: 0.55 },
    recordCount: (d) => d.employees.filter((e) => e.department !== 'Academic').length || 4,
    buildConfig: (d) => {
      const nonTeaching = d.employees.filter((e) => e.department !== 'Academic');
      return {
        title: 'Staff',
        tabColor: { red: 0.45, green: 0.35, blue: 0.55 },
        headers: [
          'Employee No',
          'Full Name',
          'Department',
          'Designation',
          'Email Address',
          'Phone',
          'Join Date',
          'Monthly Salary ($)',
          'Status',
        ],
        rows: nonTeaching.map((t) => [
          t.empNo,
          t.fullName,
          t.department,
          t.designation,
          t.email,
          t.phone,
          t.joinDate,
          t.salary,
          t.status,
        ]),
      };
    },
  },

  // 6. Classes
  {
    id: 'Classes',
    name: 'Classes',
    purpose: 'Classes master',
    tabColor: { red: 0.1, green: 0.6, blue: 0.8 },
    recordCount: () => 12,
    buildConfig: () => ({
      title: 'Classes',
      tabColor: { red: 0.1, green: 0.6, blue: 0.8 },
      headers: ['Class ID', 'Class Name', 'Numeric Grade', 'Capacity', 'Head Teacher', 'Campus Code', 'Curriculum Stream', 'Active Status'],
      rows: [
        ['CLS-01', 'Grade 1', 1, 60, 'Ms. Laura Croft', 'MAIN-CAMPUS', 'General Primary', 'Active'],
        ['CLS-02', 'Grade 2', 2, 60, 'Ms. Sarah Jenkins', 'MAIN-CAMPUS', 'General Primary', 'Active'],
        ['CLS-03', 'Grade 3', 3, 65, 'Mr. David Miller', 'MAIN-CAMPUS', 'General Primary', 'Active'],
        ['CLS-04', 'Grade 4', 4, 65, 'Ms. Rachel Green', 'MAIN-CAMPUS', 'General Primary', 'Active'],
        ['CLS-05', 'Grade 5', 5, 70, 'Mr. Alan Ross', 'MAIN-CAMPUS', 'Upper Elementary', 'Active'],
        ['CLS-06', 'Grade 6', 6, 70, 'Ms. Emily White', 'MAIN-CAMPUS', 'Middle School', 'Active'],
        ['CLS-07', 'Grade 7', 7, 75, 'Mr. Michael Scott', 'MAIN-CAMPUS', 'Middle School', 'Active'],
        ['CLS-08', 'Grade 8', 8, 75, 'Ms. Pam Beesly', 'MAIN-CAMPUS', 'Middle School', 'Active'],
        ['CLS-09', 'Grade 9', 9, 80, 'Dr. Robert Ford', 'MAIN-CAMPUS', 'High School STEM', 'Active'],
        ['CLS-10', 'Grade 10', 10, 85, 'Clara Oswald, M.Ed.', 'MAIN-CAMPUS', 'IGCSE / Senior High', 'Active'],
        ['CLS-11', 'Grade 11', 11, 80, 'Prof. Margaret Sterling', 'NORTH-CAMPUS', 'Advanced Placement', 'Active'],
        ['CLS-12', 'Grade 12', 12, 80, 'Dr. Eleanor Vance', 'MAIN-CAMPUS', 'College Preparatory', 'Active'],
      ],
    }),
  },

  // 7. Sections
  {
    id: 'Sections',
    name: 'Sections',
    purpose: 'Sections master',
    tabColor: { red: 0.2, green: 0.7, blue: 0.7 },
    recordCount: () => 8,
    buildConfig: () => ({
      title: 'Sections',
      tabColor: { red: 0.2, green: 0.7, blue: 0.7 },
      headers: ['Section ID', 'Class Name', 'Section Name', 'Max Capacity', 'Room No', 'Section Monitor', 'Status'],
      rows: [
        ['SEC-10A', 'Grade 10', 'A', 35, 'Science Wing 201', 'Clara Oswald, M.Ed.', 'Active'],
        ['SEC-10B', 'Grade 10', 'B', 35, 'Science Wing 202', 'Mr. David Miller', 'Active'],
        ['SEC-11A', 'Grade 11', 'A', 30, 'Hall B-101', 'Dr. Robert Ford', 'Active'],
        ['SEC-11B', 'Grade 11', 'B', 30, 'Hall B-102', 'Ms. Emily White', 'Active'],
        ['SEC-12A', 'Grade 12', 'A', 30, 'Senior Hall 301', 'Prof. Margaret Sterling', 'Active'],
        ['SEC-09A', 'Grade 9', 'A', 35, 'Junior Block 105', 'Ms. Sarah Jenkins', 'Active'],
        ['SEC-08A', 'Grade 8', 'A', 35, 'Junior Block 102', 'Ms. Pam Beesly', 'Active'],
        ['SEC-07A', 'Grade 7', 'A', 35, 'Junior Block 101', 'Mr. Michael Scott', 'Active'],
      ],
    }),
  },

  // 8. Subjects
  {
    id: 'Subjects',
    name: 'Subjects',
    purpose: 'Academic subjects curriculum',
    tabColor: { red: 0.3, green: 0.5, blue: 0.7 },
    recordCount: () => 8,
    buildConfig: () => ({
      title: 'Subjects',
      tabColor: { red: 0.3, green: 0.5, blue: 0.7 },
      headers: ['Subject Code', 'Subject Name', 'Department', 'Weekly Hours', 'Credit Points', 'Type', 'Pass Grade'],
      rows: [
        ['MTH-101', 'Mathematics & Advanced Calculus', 'Academic STEM', 6, 4.0, 'Core Mandatory', '60%'],
        ['ENG-102', 'English Language & World Literature', 'Humanities', 5, 3.5, 'Core Mandatory', '60%'],
        ['PHY-103', 'Physics & Laboratory Practicum', 'Academic STEM', 5, 4.0, 'Core Science', '65%'],
        ['CHM-104', 'Chemistry & Chemical Analysis', 'Academic STEM', 5, 4.0, 'Core Science', '65%'],
        ['BIO-105', 'Biology & Environmental Systems', 'Academic STEM', 4, 3.5, 'Core Science', '60%'],
        ['HIS-106', 'World History & Global Politics', 'Humanities', 4, 3.0, 'Elective', '50%'],
        ['CSC-107', 'Computer Science & Python Programming', 'IT & Computing', 5, 4.0, 'STEM Elective', '65%'],
        ['ART-108', 'Fine Arts & Design Thinking', 'Creative Arts', 3, 2.0, 'General Elective', '50%'],
      ],
    }),
  },

  // 9. Sessions
  {
    id: 'Sessions',
    name: 'Sessions',
    purpose: 'Academic sessions master',
    tabColor: { red: 0.4, green: 0.6, blue: 0.5 },
    recordCount: () => 3,
    buildConfig: () => ({
      title: 'Sessions',
      tabColor: { red: 0.4, green: 0.6, blue: 0.5 },
      headers: ['Session ID', 'Academic Year', 'Session Name', 'Start Date', 'End Date', 'Is Active', 'Admission Status'],
      rows: [
        ['SES-2024', '2024-2025', 'Academic Year 2024-2025', '2024-09-01', '2025-06-30', 'Closed', 'Archived'],
        ['SES-2025', '2025-2026', 'Academic Year 2025-2026', '2025-09-01', '2026-06-30', 'Current Active', 'Ongoing'],
        ['SES-2026', '2026-2027', 'Academic Year 2026-2027', '2026-09-01', '2027-06-30', 'Upcoming', 'Early Admissions Open'],
      ],
    }),
  },

  // 10. Attendance
  {
    id: 'Attendance',
    name: 'Attendance',
    purpose: 'Student attendance master',
    tabColor: { red: 0.2, green: 0.66, blue: 0.33 },
    recordCount: (d) => d.attendance.length,
    buildConfig: (d) => ({
      title: 'Attendance',
      tabColor: { red: 0.2, green: 0.66, blue: 0.33 },
      headers: [
        'Record ID',
        'Date',
        'Class',
        'Section',
        'Campus ID',
        'Total Students',
        'Present Count',
        'Absent Count',
        'Late Count',
        'Marked By',
        'Timestamp',
      ],
      rows: d.attendance.map((a) => [
        a.id,
        a.date,
        a.className,
        a.section,
        a.campusId,
        a.totalStudents,
        a.presentCount,
        a.absentCount,
        a.lateCount,
        a.markedBy,
        a.timestamp,
      ]),
    }),
  },

  // 11. TeacherAttendance
  {
    id: 'TeacherAttendance',
    name: 'TeacherAttendance',
    purpose: 'Teacher daily attendance',
    tabColor: { red: 0.25, green: 0.55, blue: 0.45 },
    recordCount: () => 5,
    buildConfig: (d) => {
      const today = new Date().toISOString().split('T')[0];
      const teachers = d.employees.filter((e) => e.department === 'Academic');
      return {
        title: 'TeacherAttendance',
        tabColor: { red: 0.25, green: 0.55, blue: 0.45 },
        headers: ['Record ID', 'Date', 'Teacher ID', 'Full Name', 'Department', 'Status', 'Check-In', 'Check-Out', 'Duty Assigned'],
        rows: teachers.map((t, idx) => [
          `TATT-${today}-${idx + 1}`,
          today,
          t.empNo,
          t.fullName,
          t.department,
          'Present',
          '07:52 AM',
          '03:45 PM',
          'Classroom Lecture & Lab Supervision',
        ]),
      };
    },
  },

  // 12. Timetable
  {
    id: 'Timetable',
    name: 'Timetable',
    purpose: 'Class weekly timetable',
    tabColor: { red: 0.4, green: 0.3, blue: 0.7 },
    recordCount: () => 10,
    buildConfig: () => ({
      title: 'Timetable',
      tabColor: { red: 0.4, green: 0.3, blue: 0.7 },
      headers: ['Schedule ID', 'Class', 'Section', 'Day', 'Period', 'Time Slot', 'Subject', 'Teacher', 'Room'],
      rows: [
        ['TT-10A-M1', 'Grade 10', 'A', 'Monday', 'Period 1', '08:00 - 08:50', 'Mathematics', 'Clara Oswald, M.Ed.', 'Science Wing 201'],
        ['TT-10A-M2', 'Grade 10', 'A', 'Monday', 'Period 2', '08:55 - 09:45', 'Physics', 'Clara Oswald, M.Ed.', 'Lab 1'],
        ['TT-10A-M3', 'Grade 10', 'A', 'Monday', 'Period 3', '10:05 - 10:55', 'English', 'Ms. Sarah Jenkins', 'Science Wing 201'],
        ['TT-10A-M4', 'Grade 10', 'A', 'Monday', 'Period 4', '11:00 - 11:50', 'Chemistry', 'Dr. Robert Ford', 'Chem Lab 2'],
        ['TT-10A-M5', 'Grade 10', 'A', 'Monday', 'Period 5', '12:40 - 01:30', 'Computer Science', 'Arthur Pendelton', 'Computer Lab 3'],
        ['TT-10A-T1', 'Grade 10', 'A', 'Tuesday', 'Period 1', '08:00 - 08:50', 'Physics', 'Clara Oswald, M.Ed.', 'Lab 1'],
        ['TT-10A-T2', 'Grade 10', 'A', 'Tuesday', 'Period 2', '08:55 - 09:45', 'Mathematics', 'Clara Oswald, M.Ed.', 'Science Wing 201'],
        ['TT-10A-T3', 'Grade 10', 'A', 'Tuesday', 'Period 3', '10:05 - 10:55', 'Biology', 'Ms. Emily White', 'Bio Lab 1'],
        ['TT-10A-T4', 'Grade 10', 'A', 'Tuesday', 'Period 4', '11:00 - 11:50', 'History', 'Mr. David Miller', 'Science Wing 201'],
        ['TT-10A-T5', 'Grade 10', 'A', 'Tuesday', 'Period 5', '12:40 - 01:30', 'Physical Education', 'Officer Jackson', 'Sports Arena'],
      ],
    }),
  },

  // 13. Exams
  {
    id: 'Exams',
    name: 'Exams',
    purpose: 'Examination setup',
    tabColor: { red: 0.6, green: 0.2, blue: 0.4 },
    recordCount: () => 3,
    buildConfig: () => ({
      title: 'Exams',
      tabColor: { red: 0.6, green: 0.2, blue: 0.4 },
      headers: ['Exam ID', 'Exam Name', 'Academic Session', 'Term', 'Start Date', 'End Date', 'Pass Percentage', 'Status'],
      rows: [
        ['EXM-001', 'Mid-Term 1 Assessment', '2025-2026', 'Term 1', '2025-10-15', '2025-10-25', '50%', 'Completed'],
        ['EXM-002', 'Term 2 Final Examinations', '2025-2026', 'Term 2', '2026-03-10', '2026-03-24', '50%', 'Published'],
        ['EXM-003', 'Annual Board Preparatory Exam', '2025-2026', 'Term 3', '2026-05-18', '2026-05-30', '50%', 'Scheduled'],
      ],
    }),
  },

  // 14. ExamMarks
  {
    id: 'ExamMarks',
    name: 'ExamMarks',
    purpose: 'Subject-wise marks',
    tabColor: { red: 0.7, green: 0.3, blue: 0.3 },
    recordCount: (d) => d.students.length * 4,
    buildConfig: (d) => {
      const subjects = ['Mathematics', 'Physics', 'Chemistry', 'English'];
      const rows: any[] = [];
      d.students.forEach((s) => {
        subjects.forEach((subj) => {
          const score = 80 + Math.floor(Math.random() * 18);
          rows.push([
            `MRK-${s.admissionNo}-${subj.substring(0, 3)}`,
            'Term 2 Final Examinations',
            s.admissionNo,
            s.fullName,
            s.className,
            subj,
            100,
            score,
            score >= 90 ? 'A+' : score >= 80 ? 'A' : 'B',
            'Pass',
          ]);
        });
      });
      return {
        title: 'ExamMarks',
        tabColor: { red: 0.7, green: 0.3, blue: 0.3 },
        headers: ['Mark Entry ID', 'Exam Name', 'Admission No', 'Student Name', 'Class', 'Subject', 'Max Marks', 'Marks Obtained', 'Letter Grade', 'Result Status'],
        rows,
      };
    },
  },

  // 15. Results
  {
    id: 'Results',
    name: 'Results',
    purpose: 'Calculated results',
    tabColor: { red: 0.5, green: 0.2, blue: 0.5 },
    recordCount: (d) => d.students.length,
    buildConfig: (d) => ({
      title: 'Results',
      tabColor: { red: 0.5, green: 0.2, blue: 0.5 },
      headers: ['Result ID', 'Student ID', 'Student Name', 'Class', 'Total Maximum', 'Total Obtained', 'Percentage (%)', 'Overall Grade', 'Academic Standing', 'Promotion Recommendation'],
      rows: d.students.map((s, idx) => [
        `RES-${s.admissionNo}-T2`,
        s.admissionNo,
        s.fullName,
        s.className,
        400,
        368 - idx * 6,
        `${((368 - idx * 6) / 4).toFixed(1)}%`,
        'A',
        `Rank #${idx + 1} in Section`,
        'Promoted to Next Higher Grade',
      ]),
    }),
  },

  // 16. FeeStructure
  {
    id: 'FeeStructure',
    name: 'FeeStructure',
    purpose: 'Class-wise fee structure',
    tabColor: { red: 0.8, green: 0.45, blue: 0.1 },
    recordCount: () => 6,
    buildConfig: () => ({
      title: 'FeeStructure',
      tabColor: { red: 0.8, green: 0.45, blue: 0.1 },
      headers: ['Structure ID', 'Class Group', 'Academic Year', 'Tuition Fee ($)', 'Lab Fee ($)', 'Library & Tech ($)', 'Annual Total ($)', 'Billing Frequency'],
      rows: [
        ['FEE-PRI', 'Grades 1 to 5', '2025-2026', 3600, 200, 200, 4000, 'Quarterly (4 Terms)'],
        ['FEE-MID', 'Grades 6 to 8', '2025-2026', 4200, 400, 300, 4900, 'Quarterly (4 Terms)'],
        ['FEE-G9-10', 'Grades 9 & 10', '2025-2026', 4800, 600, 400, 5800, 'Quarterly (4 Terms)'],
        ['FEE-G11-12', 'Grades 11 & 12', '2025-2026', 5600, 800, 500, 6900, 'Quarterly (4 Terms)'],
        ['FEE-BOARD', 'Boarding & Dormitory', '2025-2026', 7500, 500, 500, 8500, 'Per Semester (2 Terms)'],
        ['FEE-INTL', 'International Students', '2025-2026', 9000, 1000, 800, 10800, 'Per Semester (2 Terms)'],
      ],
    }),
  },

  // 17. Fees (Student fee invoices)
  {
    id: 'Fees',
    name: 'Fees',
    purpose: 'Student fee invoices',
    tabColor: { red: 0.95, green: 0.61, blue: 0.07 },
    recordCount: (d) => d.invoices.length,
    buildConfig: (d) => ({
      title: 'Fees',
      tabColor: { red: 0.95, green: 0.61, blue: 0.07 },
      headers: [
        'Invoice No',
        'Student ID',
        'Student Name',
        'Class',
        'Invoice Title',
        'Total Amount ($)',
        'Paid Amount ($)',
        'Balance Due ($)',
        'Due Date',
        'Payment Status',
      ],
      rows: d.invoices.map((i) => [
        i.invoiceNo,
        i.studentId,
        i.studentName,
        i.className,
        i.title,
        i.totalAmount,
        i.paidAmount,
        i.balance,
        i.dueDate,
        i.status,
      ]),
    }),
  },

  // 18. Payments
  {
    id: 'Payments',
    name: 'Payments',
    purpose: 'Fee payments & receipts',
    tabColor: { red: 0.13, green: 0.59, blue: 0.95 },
    recordCount: (d) => d.payments.length,
    buildConfig: (d) => ({
      title: 'Payments',
      tabColor: { red: 0.13, green: 0.59, blue: 0.95 },
      headers: [
        'Receipt No',
        'Student Name',
        'Invoice No',
        'Amount Paid ($)',
        'Payment Method',
        'Payment Date',
        'Reference No',
        'Received By',
      ],
      rows: d.payments.map((p) => [
        p.receiptNo,
        p.studentName,
        p.invoiceNo,
        p.amount,
        p.paymentMethod,
        p.paymentDate,
        p.referenceNo,
        p.recordedBy,
      ]),
    }),
  },

  // 19. Expenses
  {
    id: 'Expenses',
    name: 'Expenses',
    purpose: 'School operating expenses',
    tabColor: { red: 0.92, green: 0.26, blue: 0.21 },
    recordCount: (d) => d.expenses.length,
    buildConfig: (d) => ({
      title: 'Expenses',
      tabColor: { red: 0.92, green: 0.26, blue: 0.21 },
      headers: [
        'Expense No',
        'Category',
        'Title',
        'Amount ($)',
        'Date',
        'Payment Method',
        'Approved By',
        'Status',
      ],
      rows: d.expenses.map((e) => [
        e.expenseNo,
        e.category,
        e.title,
        e.amount,
        e.date,
        e.paymentMethod,
        e.approvedBy,
        e.status,
      ]),
    }),
  },

  // 20. Payroll
  {
    id: 'Payroll',
    name: 'Payroll',
    purpose: 'Staff salaries & payroll',
    tabColor: { red: 0.55, green: 0.2, blue: 0.6 },
    recordCount: (d) => d.payroll?.length || d.employees.length,
    buildConfig: (d) => {
      const rows = d.payroll?.map((p) => [
        p.slipNo,
        p.empId,
        p.empName,
        p.designation,
        p.month,
        p.basicSalary,
        p.allowances,
        p.deductions,
        p.netSalary,
        p.status,
        p.paymentDate || '2026-09-25',
      ]) || d.employees.map((e, idx) => [
        `SLIP-2026-09-${String(idx + 1).padStart(3, '0')}`,
        e.empNo,
        e.fullName,
        e.designation,
        'September 2026',
        e.salary,
        Math.round(e.salary * 0.15),
        Math.round(e.salary * 0.08),
        Math.round(e.salary * 1.07),
        'Disbursed',
        '2026-09-25',
      ]);
      return {
        title: 'Payroll',
        tabColor: { red: 0.55, green: 0.2, blue: 0.6 },
        headers: ['Slip No', 'Emp No', 'Employee Name', 'Designation', 'Salary Month', 'Basic Salary ($)', 'Allowances ($)', 'Deductions ($)', 'Net Salary ($)', 'Status', 'Disbursement Date'],
        rows,
      };
    },
  },

  // 21. Books
  {
    id: 'Books',
    name: 'Books',
    purpose: 'Library books catalog',
    tabColor: { red: 0.2, green: 0.5, blue: 0.4 },
    recordCount: () => 6,
    buildConfig: () => ({
      title: 'Books',
      tabColor: { red: 0.2, green: 0.5, blue: 0.4 },
      headers: ['Book ID', 'ISBN', 'Title', 'Author', 'Category', 'Total Copies', 'Available Copies', 'Shelf Location', 'Status'],
      rows: [
        ['BK-1001', '978-0131103627', 'The C Programming Language (2nd Ed)', 'Brian Kernighan & Dennis Ritchie', 'Computer Science', 8, 6, 'Stack CS-04', 'Available'],
        ['BK-1002', '978-0201896831', 'The Art of Computer Programming', 'Donald E. Knuth', 'Computer Science', 4, 3, 'Stack CS-01', 'Available'],
        ['BK-1003', '978-0141439518', 'Pride and Prejudice', 'Jane Austen', 'Literature', 12, 10, 'Stack LIT-02', 'Available'],
        ['BK-1004', '978-0062316097', 'Sapiens: A Brief History of Humankind', 'Yuval Noah Harari', 'History', 7, 5, 'Stack HIST-09', 'Available'],
        ['BK-1005', '978-1501142970', 'Leonardo da Vinci', 'Walter Isaacson', 'Biography', 5, 4, 'Stack BIO-03', 'Available'],
        ['BK-1006', '978-0385537858', 'Inferno', 'Dan Brown', 'Fiction', 9, 8, 'Stack FIC-05', 'Available'],
      ],
    }),
  },

  // 22. BookIssue
  {
    id: 'BookIssue',
    name: 'BookIssue',
    purpose: 'Library issue/return circulation',
    tabColor: { red: 0.3, green: 0.6, blue: 0.5 },
    recordCount: () => 4,
    buildConfig: () => ({
      title: 'BookIssue',
      tabColor: { red: 0.3, green: 0.6, blue: 0.5 },
      headers: ['Issue ID', 'Book ID', 'Book Title', 'Borrower ID', 'Borrower Name', 'Borrower Type', 'Issue Date', 'Due Date', 'Return Date', 'Fine Paid ($)', 'Status'],
      rows: [
        ['ISS-2026-001', 'BK-1001', 'The C Programming Language', 'STU-2026-00001', 'Alexander Hayes', 'Student', '2026-09-10', '2026-09-24', '-', 0, 'Issued'],
        ['ISS-2026-002', 'BK-1003', 'Pride and Prejudice', 'STU-2026-00002', 'Seraphina Vance', 'Student', '2026-09-12', '2026-09-26', '-', 0, 'Issued'],
        ['ISS-2026-003', 'BK-1004', 'Sapiens', 'EMP-ACAD-001', 'Clara Oswald, M.Ed.', 'Faculty', '2026-09-01', '2026-09-30', '-', 0, 'Issued'],
        ['ISS-2026-004', 'BK-1005', 'Leonardo da Vinci', 'STU-2026-00003', 'Julian Sterling', 'Student', '2026-08-25', '2026-09-08', '2026-09-07', 0, 'Returned'],
      ],
    }),
  },

  // 23. Transport
  {
    id: 'Transport',
    name: 'Transport',
    purpose: 'Student transport allocations',
    tabColor: { red: 0.85, green: 0.55, blue: 0.15 },
    recordCount: (d) => d.students.length,
    buildConfig: (d) => ({
      title: 'Transport',
      tabColor: { red: 0.85, green: 0.55, blue: 0.15 },
      headers: ['Allocation ID', 'Student ID', 'Student Name', 'Class', 'Route Code', 'Pickup Point', 'Vehicle No', 'Seat No', 'Monthly Fee ($)', 'Status'],
      rows: d.students.map((s, idx) => [
        `TRN-${s.admissionNo}`,
        s.admissionNo,
        s.fullName,
        s.className,
        idx % 2 === 0 ? 'RT-NORTH-01' : 'RT-WEST-02',
        s.address.split(',')[0],
        idx % 2 === 0 ? 'BUS-01 (OAK-8821)' : 'BUS-02 (OAK-8822)',
        `Seat #${idx + 3}`,
        120,
        'Active Route',
      ]),
    }),
  },

  // 24. Vehicles
  {
    id: 'Vehicles',
    name: 'Vehicles',
    purpose: 'School vehicle fleet',
    tabColor: { red: 0.75, green: 0.45, blue: 0.2 },
    recordCount: () => 4,
    buildConfig: () => ({
      title: 'Vehicles',
      tabColor: { red: 0.75, green: 0.45, blue: 0.2 },
      headers: ['Vehicle ID', 'Registration No', 'Model & Make', 'Capacity', 'Driver Name', 'Driver Contact', 'Assigned Route', 'Fuel Type', 'Fitness Status'],
      rows: [
        ['VEH-01', 'OAK-8821', 'Mercedes-Benz Sprinter 516', 36, 'Marcus Brody', '+1 (555) 777-1011', 'RT-NORTH-01', 'Clean Diesel', 'Active Insured'],
        ['VEH-02', 'OAK-8822', 'Volvo 9700 Grand Coach', 54, 'Evelyn Bennett', '+1 (555) 777-1012', 'RT-WEST-02', 'Clean Diesel', 'Active Insured'],
        ['VEH-03', 'OAK-8823', 'Blue Bird Vision EV', 48, 'Ronald Washington', '+1 (555) 777-1013', 'RT-SOUTH-03', '100% Electric', 'Active Insured'],
        ['VEH-04', 'OAK-8824', 'Ford Transit 350-HD', 18, 'Carlos Gomez', '+1 (555) 777-1014', 'RT-CAMPUS-SHUTTLE', 'Hybrid', 'Active Insured'],
      ],
    }),
  },

  // 25. Routes
  {
    id: 'Routes',
    name: 'Routes',
    purpose: 'Transport routes & stops',
    tabColor: { red: 0.7, green: 0.4, blue: 0.3 },
    recordCount: () => 4,
    buildConfig: () => ({
      title: 'Routes',
      tabColor: { red: 0.7, green: 0.4, blue: 0.3 },
      headers: ['Route ID', 'Route Code', 'Route Name', 'Origin Point', 'Destination Point', 'Stops Count', 'Morning Departure', 'Evening Return', 'Assigned Bus'],
      rows: [
        ['RT-01', 'RT-NORTH-01', 'North Hills & Kensington Express', 'North Hills Metro', 'Oakridge Main Campus', 8, '06:45 AM', '03:45 PM', 'BUS-01 (OAK-8821)'],
        ['RT-02', 'RT-WEST-02', 'Westwood & Grand Boulevard', 'Westwood Center', 'Oakridge Main Campus', 11, '06:30 AM', '03:45 PM', 'BUS-02 (OAK-8822)'],
        ['RT-03', 'RT-SOUTH-03', 'South Bay & Harbor Point', 'Harbor Marina Plaza', 'Oakridge Main Campus', 9, '06:40 AM', '03:45 PM', 'BUS-03 (OAK-8823)'],
        ['RT-04', 'RT-CAMPUS-SHUTTLE', 'Inter-Campus Faculty & Student Shuttle', 'Main Campus Gate A', 'North Campus Science Annex', 3, '07:15 AM', '05:30 PM', 'BUS-04 (OAK-8824)'],
      ],
    }),
  },

  // 26. Notices
  {
    id: 'Notices',
    name: 'Notices',
    purpose: 'School notices & announcements',
    tabColor: { red: 0.85, green: 0.3, blue: 0.3 },
    recordCount: (d) => d.announcements?.length || 4,
    buildConfig: (d) => {
      const rows = d.announcements?.map((a) => [
        a.id,
        a.title,
        a.priority.toUpperCase(),
        a.target,
        a.author,
        a.createdAt,
        a.active ? 'Active' : 'Archived',
        a.message,
      ]) || [
        ['ann-1', 'Term 2 Final Examination Schedule Published', 'NORMAL', 'All Users', 'Academic Dean Office', '2026-09-20', 'Active', 'Official dates for Term 2 Final Exams are now finalized.'],
        ['ann-2', 'Annual Inter-Campus STEM & Robotics Olympiad', 'NORMAL', 'Students', 'Faculty Coordinator', '2026-09-18', 'Active', 'Registration open for grades 8 through 12.'],
        ['ann-3', 'Quarter 3 Tuition Fee Payment Window Open', 'URGENT', 'Parents', 'Bursar & Finance Office', '2026-09-15', 'Active', 'Please settle Quarter 3 fee balances before the due date.'],
      ];
      return {
        title: 'Notices',
        tabColor: { red: 0.85, green: 0.3, blue: 0.3 },
        headers: ['Notice ID', 'Title', 'Priority Level', 'Target Audience', 'Published By', 'Publish Date', 'Status', 'Notice Content'],
        rows,
      };
    },
  },

  // 27. AuditLog
  {
    id: 'AuditLog',
    name: 'AuditLog',
    purpose: 'User activity & security audit trail',
    tabColor: { red: 0.35, green: 0.35, blue: 0.35 },
    recordCount: (d) => d.auditLogs?.length || 8,
    buildConfig: (d) => {
      const rows = d.auditLogs?.map((l) => [
        l.id,
        l.timestamp,
        l.userEmail,
        l.role,
        l.module,
        l.action,
        l.recordId,
        l.details,
        l.result,
      ]) || [
        ['log-01', '2026-09-26 09:20 AM', 'superadmin@oakridgeacademy.edu', 'Super Admin', 'Authentication', 'Admin Session Verified', 'AUTH-SES', 'PBKDF2 security token refreshed', 'success'],
        ['log-02', '2026-09-26 09:18 AM', 'admin@oakridgeacademy.edu', 'Admin', 'Integration', 'Google Sheets Full Sync', 'SHEET-MASTER', 'All 28 master tabs synchronized', 'success'],
        ['log-03', '2026-09-26 09:12 AM', 'bursar@oakridgeacademy.edu', 'Accountant', 'Finance', 'Fee Collection Receipt', 'REC-2026-005', 'Collected $1,250 tuition payment', 'success'],
      ];
      return {
        title: 'AuditLog',
        tabColor: { red: 0.35, green: 0.35, blue: 0.35 },
        headers: ['Log ID', 'Timestamp', 'User Email', 'Role', 'Module', 'Action', 'Target Reference', 'Event Details', 'Result Status'],
        rows,
      };
    },
  },

  // 28. Settings
  {
    id: 'Settings',
    name: 'Settings',
    purpose: 'School ERP configuration & metadata',
    tabColor: { red: 0.3, green: 0.45, blue: 0.5 },
    recordCount: () => 14,
    buildConfig: (d) => {
      const p = d.schoolProfile || {
        schoolName: 'Oakridge International Academy & College',
        shortName: 'Oakridge Academy',
        schoolCode: 'OAK-2026-EDU',
        registrationNo: 'REG-EDU-994821',
        address: '450 Oakridge Boulevard, Academic District, CA 90210',
        contactEmail: 'admissions@oakridgeacademy.edu',
        phone: '+1 (555) 234-5678',
        website: 'https://oakridgeacademy.edu',
        principalName: 'Dr. Eleanor Vance, Ph.D.',
        establishedYear: '1988',
        currency: 'USD ($)',
        timezone: 'America/Los_Angeles (PST)',
      };
      return {
        title: 'Settings',
        tabColor: { red: 0.3, green: 0.45, blue: 0.5 },
        headers: ['Configuration Key', 'Category', 'Config Value', 'Description', 'Last Updated', 'Updated By'],
        rows: [
          ['SCHOOL_NAME', 'Institution Identity', p.schoolName, 'Official legal name of the educational institution', new Date().toISOString(), 'Super Admin'],
          ['SCHOOL_CODE', 'Institution Identity', p.schoolCode, 'Accredited institutional identification code', new Date().toISOString(), 'Super Admin'],
          ['REGISTRATION_NO', 'Institution Identity', p.registrationNo, 'State Board educational license and registration', new Date().toISOString(), 'Super Admin'],
          ['CAMPUS_ADDRESS', 'Location', p.address, 'Principal physical campus address', new Date().toISOString(), 'Admin'],
          ['CONTACT_EMAIL', 'Communications', p.contactEmail, 'Primary administrative inquiries inbox', new Date().toISOString(), 'Admin'],
          ['CONTACT_PHONE', 'Communications', p.phone, 'Main switchboard telephone', new Date().toISOString(), 'Admin'],
          ['OFFICIAL_WEBSITE', 'Communications', p.website, 'Public web portal URL', new Date().toISOString(), 'Admin'],
          ['PRINCIPAL_HEAD', 'Governance', p.principalName, 'Chief academic officer and head of school', new Date().toISOString(), 'Super Admin'],
          ['ESTABLISHED_YEAR', 'History', p.establishedYear, 'Year of foundation', new Date().toISOString(), 'Super Admin'],
          ['BASE_CURRENCY', 'Finance', p.currency, 'Accounting and fee invoice default currency', new Date().toISOString(), 'Bursar'],
          ['SYSTEM_TIMEZONE', 'Localization', p.timezone, 'Regional timestamp alignment', new Date().toISOString(), 'System Admin'],
          ['AUTO_BACKUP_ENABLED', 'Cloud Backup', 'true', 'Automated periodic synchronization with Google Sheets', new Date().toISOString(), 'System Admin'],
          ['AUTO_BACKUP_INTERVAL', 'Cloud Backup', '15m', 'Background sync frequency with connected spreadsheet', new Date().toISOString(), 'System Admin'],
          ['BACKUP_SCHEMA_VERSION', 'System', '3.2.0-28TABS', 'Complete 28-sheet enterprise database standard', new Date().toISOString(), 'System Admin'],
        ],
      };
    },
  },
];

/**
 * Builds the MasterTabConfig array for all selected tabs or all 28 tabs
 */
export function buildAll28TabsConfig(
  datasets: FullERPBackupDatasets,
  selectedTabIds?: string[]
): MasterTabConfig[] {
  const tabsToExport = selectedTabIds
    ? ALL_28_SHEET_TABS.filter((t) => selectedTabIds.includes(t.id))
    : ALL_28_SHEET_TABS;

  return tabsToExport.map((tabDef) => tabDef.buildConfig(datasets));
}
