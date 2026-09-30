export type UserRole =
  | 'Super Admin'
  | 'Admin'
  | 'Principal'
  | 'Accountant'
  | 'HR Manager'
  | 'Teacher'
  | 'Receptionist'
  | 'POS Operator'
  | 'Parent'
  | 'Student';

export interface UserPermission {
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
  approve: boolean;
  post: boolean;
  cancel: boolean;
  reverse: boolean;
  print: boolean;
  export: boolean;
  import: boolean;
  pay: boolean;
  refund: boolean;
  manageSettings: boolean;
}

export interface SchoolProfile {
  schoolName: string;
  shortName: string;
  schoolCode: string;
  registrationNo: string;
  address: string;
  contactEmail: string;
  phone: string;
  website: string;
  principalName: string;
  establishedYear: string;
  currency: string;
  timezone: string;
  logoUrl?: string;
  signatureUrl?: string;
  stampUrl?: string;
  driveFolderId?: string;
}

export interface Campus {
  id: string;
  name: string;
  code: string;
  address: string;
  principal: string;
  phone: string;
  status: 'active' | 'inactive';
  studentCount?: number;
}

export interface AcademicSession {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  status: 'active' | 'closed' | 'upcoming';
}

export interface Student {
  id: string;
  admissionNo: string;
  fullName: string;
  gender: 'Male' | 'Female' | 'Other';
  dob: string;
  className: string;
  section: string;
  rollNo: string;
  campusId: string;
  campusName?: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  address: string;
  admissionDate: string;
  status: 'active' | 'suspended' | 'graduated' | 'transferred';
  feesDue: number;
  avatarUrl?: string;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  className: string;
  section: string;
  campusId: string;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  markedBy: string;
  timestamp: string;
  details?: Record<string, 'present' | 'absent' | 'late' | 'leave'>;
}

export interface FeeInvoice {
  id: string;
  invoiceNo: string;
  studentId: string;
  studentName: string;
  className: string;
  title: string;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  dueDate: string;
  status: 'paid' | 'partial' | 'unpaid' | 'overdue';
  campusId: string;
  createdAt: string;
}

export interface FeePayment {
  id: string;
  receiptNo: string;
  invoiceNo: string;
  studentName: string;
  amount: number;
  paymentMethod: 'Cash' | 'Card' | 'Bank Transfer' | 'Online' | 'Cheque';
  referenceNo: string;
  paymentDate: string;
  recordedBy: string;
  notes?: string;
}

export interface ExpenseRecord {
  id: string;
  expenseNo: string;
  title: string;
  category: 'Utilities' | 'Maintenance' | 'Salaries' | 'Supplies' | 'Events' | 'Transport' | 'Other';
  amount: number;
  paymentMethod: string;
  date: string;
  approvedBy: string;
  status: 'Draft' | 'Pending' | 'Approved' | 'Paid';
  receiptUrl?: string;
}

export interface Employee {
  id: string;
  empNo: string;
  fullName: string;
  email: string;
  phone: string;
  department: 'Academic' | 'Administration' | 'Finance' | 'IT' | 'Operations' | 'Transport';
  designation: string;
  joinDate: string;
  salary: number;
  status: 'active' | 'on_leave' | 'resigned';
}

export interface PayrollRecord {
  id: string;
  slipNo: string;
  empId: string;
  empName: string;
  designation: string;
  month: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  status: 'Draft' | 'Approved' | 'Disbursed';
  paymentDate?: string;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: 'Uniform' | 'Textbook' | 'Stationery' | 'Sports' | 'Lab' | 'Canteen';
  quantity: number;
  unitPrice: number;
  minStockAlert: number;
  unit: string;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
}

export interface POSTransaction {
  id: string;
  orderNo: string;
  customerType: 'Student' | 'Staff' | 'Guest';
  customerName: string;
  items: Array<{ itemName: string; quantity: number; unitPrice: number; total: number }>;
  totalAmount: number;
  paymentMethod: 'Cash' | 'Card' | 'Account Balance';
  date: string;
  cashier: string;
}

export interface Exam {
  id: string;
  name: string;
  term: string;
  session: string;
  startDate: string;
  endDate: string;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Published';
}

export interface ExamResult {
  id: string;
  examId: string;
  studentId: string;
  studentName: string;
  className: string;
  subjects: Array<{ subject: string; maxMarks: number; obtainedMarks: number; grade: string }>;
  totalMarks: number;
  totalObtained: number;
  percentage: number;
  overallGrade: string;
  rank?: number;
  remarks?: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  priority: 'info' | 'warning' | 'maintenance' | 'emergency';
  target: 'All Users' | 'Teachers' | 'Parents' | 'Students' | 'Accountants';
  campusId?: string;
  author: string;
  createdAt: string;
  active: boolean;
}

export interface ApprovalAuditEntry {
  action: 'Created' | 'Submitted' | 'Approved' | 'Rejected' | 'Posted' | 'Cancelled';
  actor: string;
  role: string;
  timestamp: string;
  notes?: string;
  reason?: string;
}

export interface ApprovalRequest {
  id: string;
  title: string;
  type:
    | 'Student Fee Collection'
    | 'Fee Discount'
    | 'Fee Refund'
    | 'Purchase'
    | 'Expense'
    | 'Payroll'
    | 'Supplier Payment'
    | 'Admission'
    | 'Result Publication'
    | 'Other';
  requesterName: string;
  requesterRole: string;
  amount?: number;
  details: string;
  status: 'Draft' | 'Submitted' | 'Pending Approval' | 'Approved' | 'Posted' | 'Rejected' | 'Cancelled';
  submittedDate: string;
  studentId?: string;
  studentName?: string;
  createdBy: string;
  createdRole: string;
  submittedBy?: string;
  submittedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  postedBy?: string;
  postedAt?: string;
  rejectionReason?: string;
  cancellationReason?: string;
  comments?: string;
  auditTrail?: ApprovalAuditEntry[];
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userEmail: string;
  role: string;
  module: string;
  action: string;
  recordId: string;
  details: string;
  result: 'success' | 'failed' | 'pending';
  ip?: string;
}

export interface HealthCheckItem {
  name: string;
  category: 'Auth' | 'Database' | 'Workspace' | 'Security' | 'API' | 'System';
  status: 'healthy' | 'warning' | 'critical';
  details: string;
  suggestedAction?: string;
}

export type WeekDay = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

export interface TimetableSlot {
  id: string;
  day: WeekDay;
  period: number; // 1 to 8
  periodName?: string;
  startTime: string; // e.g. "08:30"
  endTime: string; // e.g. "09:15"
  className: string; // e.g. "Grade 10"
  section: string; // e.g. "A"
  subject: string;
  teacherId: string;
  teacherName: string;
  room: string;
  type: 'Lecture' | 'Lab' | 'Tutorial' | 'Assembly' | 'Break' | 'Activity';
  campusId?: string;
  substituteTeacherId?: string;
  substituteTeacherName?: string;
  notes?: string;
}

export interface SubstituteRecord {
  id: string;
  date: string;
  originalTeacherId: string;
  originalTeacherName: string;
  substituteTeacherId: string;
  substituteTeacherName: string;
  slotId: string;
  day: WeekDay;
  period: number;
  className: string;
  section: string;
  subject: string;
  room: string;
  reason: string;
  status: 'Assigned' | 'Completed' | 'Cancelled';
  assignedBy: string;
  assignedAt: string;
}

export interface TimetableConflict {
  id: string;
  type: 'teacher_double_booking' | 'room_double_booking' | 'class_overlap' | 'duplicate_subject' | 'workload_exceeded';
  severity: 'high' | 'warning';
  title: string;
  description: string;
  day: WeekDay;
  period: number;
  slotA: TimetableSlot;
  slotB?: TimetableSlot;
}

export interface SmartDocumentFile {
  id: string;
  title: string;
  category:
    | 'student_photo'
    | 'staff_photo'
    | 'id_document'
    | 'certificate'
    | 'admission_doc'
    | 'employee_doc'
    | 'book_image'
    | 'vehicle_doc'
    | 'institutional';
  fileName: string;
  fileSize: string;
  mimeType: string;
  uploadedAt: string;
  uploadedBy: string;
  associatedId?: string;
  associatedName?: string;
  fileUrl: string;
  status: 'Verified' | 'Pending Review' | 'Archived';
  notes?: string;
}

export interface AdminUserRecord {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  department: string;
  status: 'Active' | 'Inactive';
  photoUrl?: string;
  permissions: {
    canView: boolean;
    canAdd: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canApprove: boolean;
    canPost: boolean;
    canManageSettings: boolean;
  };
  allowedModules: string[];
  lastLogin?: string;
  loginCount: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

