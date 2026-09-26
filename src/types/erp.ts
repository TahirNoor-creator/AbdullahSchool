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

export interface ApprovalRequest {
  id: string;
  title: string;
  type: 'Admission' | 'Fee Discount' | 'Fee Refund' | 'Purchase' | 'Expense' | 'Payroll' | 'Result Publication';
  requesterName: string;
  requesterRole: string;
  amount?: number;
  details: string;
  status: 'Draft' | 'Submitted' | 'Pending Approval' | 'Approved' | 'Posted' | 'Rejected';
  submittedDate: string;
  approver?: string;
  comments?: string;
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
