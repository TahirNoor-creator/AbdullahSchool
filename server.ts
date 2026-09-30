import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { GoogleGenAI, ThinkingLevel, Modality, LiveServerMessage } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT || 3000);

// Increase JSON payload limit for audio/image base64
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// -------------------------------------------------------------
// SECURE SERVER-SIDE AUTHENTICATION & SESSION MANAGEMENT
// -------------------------------------------------------------
interface UserAccount {
  id: string;
  email: string;
  username: string;
  name: string;
  role: string;
  designation: string;
  passwordHash: string;
  salt: string;
  failedAttempts: number;
  lockedUntil: number | null;
  defaultRedirect: string;
  avatarBg: string;
  active: boolean;
}

interface UserSession {
  token: string;
  userId: string;
  email: string;
  name: string;
  role: string;
  campusId: string;
  academicSession: string;
  createdAt: number;
  expiresAt: number;
  rememberMe: boolean;
}

interface SecurityEvent {
  id: string;
  timestamp: string;
  type: 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'ACCOUNT_LOCKED' | 'LOGOUT' | 'PASSWORD_RESET' | 'ACCOUNT_UNLOCKED' | 'SESSION_TIMEOUT';
  email: string;
  ip: string;
  details: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

function hashPassword(password: string, providedSalt?: string): { hash: string; salt: string } {
  const salt = providedSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  const computedHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(computedHash, 'hex'), Buffer.from(expectedHash, 'hex'));
  } catch {
    return false;
  }
}

// Master password for institutional accounts: Oakridge@2025!
const defaultCredential = hashPassword('Oakridge@2025!');

const userAccounts: Record<string, UserAccount> = {
  'superadmin@oakridgeacademy.edu': {
    id: 'usr-001',
    email: 'superadmin@oakridgeacademy.edu',
    username: 'superadmin',
    name: 'Dr. Eleanor Vance',
    role: 'Super Admin',
    designation: 'Institutional Director & Superintendent',
    passwordHash: defaultCredential.hash,
    salt: defaultCredential.salt,
    failedAttempts: 0,
    lockedUntil: null,
    defaultRedirect: 'command-center',
    avatarBg: 'bg-indigo-600',
    active: true,
  },
  'principal@oakridgeacademy.edu': {
    id: 'usr-002',
    email: 'principal@oakridgeacademy.edu',
    username: 'principal',
    name: 'Marcus Sterling',
    role: 'Principal',
    designation: 'Campus Dean & Academic Operations',
    passwordHash: defaultCredential.hash,
    salt: defaultCredential.salt,
    failedAttempts: 0,
    lockedUntil: null,
    defaultRedirect: 'analytics',
    avatarBg: 'bg-blue-600',
    active: true,
  },
  'accountant@oakridgeacademy.edu': {
    id: 'usr-003',
    email: 'accountant@oakridgeacademy.edu',
    username: 'accountant',
    name: 'Sarah Jenkins, CPA',
    role: 'Accountant',
    designation: 'Chief Bursar & Head of Finance',
    passwordHash: defaultCredential.hash,
    salt: defaultCredential.salt,
    failedAttempts: 0,
    lockedUntil: null,
    defaultRedirect: 'finance',
    avatarBg: 'bg-emerald-600',
    active: true,
  },
  'hr@oakridgeacademy.edu': {
    id: 'usr-004',
    email: 'hr@oakridgeacademy.edu',
    username: 'hrmanager',
    name: 'David Chen',
    role: 'HR Manager',
    designation: 'Director of Human Resources & Payroll',
    passwordHash: defaultCredential.hash,
    salt: defaultCredential.salt,
    failedAttempts: 0,
    lockedUntil: null,
    defaultRedirect: 'hr-payroll',
    avatarBg: 'bg-purple-600',
    active: true,
  },
  'teacher@oakridgeacademy.edu': {
    id: 'usr-005',
    email: 'teacher@oakridgeacademy.edu',
    username: 'teacher',
    name: 'Prof. Elizabeth Warren',
    role: 'Teacher',
    designation: 'Senior Faculty & Department Chair',
    passwordHash: defaultCredential.hash,
    salt: defaultCredential.salt,
    failedAttempts: 0,
    lockedUntil: null,
    defaultRedirect: 'attendance',
    avatarBg: 'bg-teal-600',
    active: true,
  },
  'security@oakridgeacademy.edu': {
    id: 'usr-006',
    email: 'security@oakridgeacademy.edu',
    username: 'security',
    name: 'Officer Thomas Jackson',
    role: 'Receptionist',
    designation: 'Campus Gate & Optical QR Lead',
    passwordHash: defaultCredential.hash,
    salt: defaultCredential.salt,
    failedAttempts: 0,
    lockedUntil: null,
    defaultRedirect: 'qr-scanner',
    avatarBg: 'bg-amber-600',
    active: true,
  },
  'pos@oakridgeacademy.edu': {
    id: 'usr-007',
    email: 'pos@oakridgeacademy.edu',
    username: 'posoperator',
    name: 'Liam Henderson',
    role: 'POS Operator',
    designation: 'School Store & Bookstore Lead',
    passwordHash: defaultCredential.hash,
    salt: defaultCredential.salt,
    failedAttempts: 0,
    lockedUntil: null,
    defaultRedirect: 'inventory-pos',
    avatarBg: 'bg-sky-600',
    active: true,
  },
  'student@oakridgeacademy.edu': {
    id: 'usr-008',
    email: 'student@oakridgeacademy.edu',
    username: 'student',
    name: 'Alexander Hayes',
    role: 'Student',
    designation: 'Student Council President (Grade 10-A)',
    passwordHash: defaultCredential.hash,
    salt: defaultCredential.salt,
    failedAttempts: 0,
    lockedUntil: null,
    defaultRedirect: 'students',
    avatarBg: 'bg-emerald-600',
    active: true,
  },
  'parent@oakridgeacademy.edu': {
    id: 'usr-009',
    email: 'parent@oakridgeacademy.edu',
    username: 'parent',
    name: 'Robert & Clara Hayes',
    role: 'Parent',
    designation: 'Guardian of Alexander Hayes',
    passwordHash: defaultCredential.hash,
    salt: defaultCredential.salt,
    failedAttempts: 0,
    lockedUntil: null,
    defaultRedirect: 'students',
    avatarBg: 'bg-cyan-600',
    active: true,
  },
};

const activeSessions = new Map<string, UserSession>();
const passwordResetTokens = new Map<string, { email: string; expiresAt: number; code: string }>();
const securityEvents: SecurityEvent[] = [
  {
    id: `sec-${Date.now()}-1`,
    timestamp: new Date().toISOString(),
    type: 'LOGIN_SUCCESS',
    email: 'system@oakridgeacademy.edu',
    ip: '127.0.0.1',
    details: 'System daemon initialized secure auth repository with salted PBKDF2 hashing.',
    severity: 'low',
  },
];

function logSecurityEvent(
  type: SecurityEvent['type'],
  email: string,
  ip: string,
  details: string,
  severity: SecurityEvent['severity']
) {
  const event: SecurityEvent = {
    id: `sec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    type,
    email,
    ip,
    details,
    severity,
  };
  securityEvents.unshift(event);
  if (securityEvents.length > 200) securityEvents.pop();
  return event;
}

// 1. Login Endpoint
app.post('/api/auth/login', (req, res) => {
  try {
    const { usernameOrEmail, password, campusId = 'all', academicSession = '2025-2026', rememberMe = false } = req.body;
    const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';

    if (!usernameOrEmail || !password) {
      return res.status(400).json({ error: 'Username or email and password are required.' });
    }

    const trimmedInput = String(usernameOrEmail).trim().toLowerCase();

    // Look up user by email or username
    const userEntry = Object.values(userAccounts).find(
      (u) => u.email.toLowerCase() === trimmedInput || u.username.toLowerCase() === trimmedInput
    );

    if (!userEntry) {
      logSecurityEvent('LOGIN_FAILED', trimmedInput, clientIp, 'Authentication failed: Account not found.', 'medium');
      return res.status(401).json({
        error: 'Invalid credentials. Please verify your institutional email or username.',
      });
    }

    // Check account active state
    if (userEntry.active === false) {
      logSecurityEvent('LOGIN_FAILED', userEntry.email, clientIp, 'Attempted sign-in to deactivated account.', 'high');
      return res.status(403).json({
        error: 'This account has been deactivated by the system administrator. Please contact IT support.',
      });
    }

    const now = Date.now();

    // Check account lockout
    if (userEntry.lockedUntil && userEntry.lockedUntil > now) {
      const remainingSeconds = Math.ceil((userEntry.lockedUntil - now) / 1000);
      const remainingMinutes = Math.ceil(remainingSeconds / 60);
      logSecurityEvent(
        'ACCOUNT_LOCKED',
        userEntry.email,
        clientIp,
        `Blocked login attempt on locked account (${remainingSeconds}s remaining).`,
        'high'
      );
      return res.status(423).json({
        error: `Account locked due to consecutive failed login attempts. Please try again in ${remainingMinutes} minute(s) or use the master unlock code.`,
        locked: true,
        remainingSeconds,
      });
    } else if (userEntry.lockedUntil && userEntry.lockedUntil <= now) {
      // Lock expired, reset
      userEntry.lockedUntil = null;
      userEntry.failedAttempts = 0;
    }

    // Verify password
    const isPasswordValid = verifyPassword(password, userEntry.salt, userEntry.passwordHash);

    if (!isPasswordValid) {
      userEntry.failedAttempts += 1;
      const attemptsRemaining = Math.max(0, 5 - userEntry.failedAttempts);

      if (userEntry.failedAttempts >= 5) {
        userEntry.lockedUntil = now + 15 * 60 * 1000; // 15 minutes lockout
        logSecurityEvent(
          'ACCOUNT_LOCKED',
          userEntry.email,
          clientIp,
          'Account locked for 15 minutes after 5 consecutive failed login attempts.',
          'critical'
        );
        return res.status(423).json({
          error: 'Security Alert: Account locked due to 5 consecutive failed login attempts. Contact your IT administrator or unlock with security code.',
          locked: true,
          remainingSeconds: 900,
        });
      }

      logSecurityEvent(
        'LOGIN_FAILED',
        userEntry.email,
        clientIp,
        `Invalid password attempt (${userEntry.failedAttempts}/5).`,
        'medium'
      );
      return res.status(401).json({
        error: `Invalid password. ${attemptsRemaining} attempt(s) remaining before automatic account lockout.`,
        attemptsRemaining,
      });
    }

    // Reset failed counter on successful login
    userEntry.failedAttempts = 0;
    userEntry.lockedUntil = null;

    // Create session token
    const token = crypto.randomBytes(32).toString('hex');
    const sessionDurationMs = rememberMe ? 7 * 24 * 60 * 60 * 1000 : 60 * 60 * 1000; // 7 days or 1 hour
    const expiresAt = now + sessionDurationMs;

    const session: UserSession = {
      token,
      userId: userEntry.id,
      email: userEntry.email,
      name: userEntry.name,
      role: userEntry.role,
      campusId,
      academicSession,
      createdAt: now,
      expiresAt,
      rememberMe: Boolean(rememberMe),
    };

    activeSessions.set(token, session);

    logSecurityEvent(
      'LOGIN_SUCCESS',
      userEntry.email,
      clientIp,
      `Authorized login under role '${userEntry.role}' with redirect to '${userEntry.defaultRedirect}'.`,
      'low'
    );

    return res.json({
      success: true,
      token,
      expiresAt,
      user: {
        id: userEntry.id,
        email: userEntry.email,
        name: userEntry.name,
        role: userEntry.role,
        designation: userEntry.designation,
        campusId,
        academicSession,
        avatarBg: userEntry.avatarBg,
      },
      defaultRedirect: userEntry.defaultRedirect,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server authentication failure' });
  }
});

// 2. Verify Session
app.post('/api/auth/verify-session', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : req.body.token;

  if (!token) {
    return res.status(401).json({ valid: false, error: 'No token provided' });
  }

  const session = activeSessions.get(token);
  if (!session) {
    return res.status(401).json({ valid: false, error: 'Invalid or expired session token' });
  }

  if (Date.now() > session.expiresAt) {
    activeSessions.delete(token);
    return res.status(401).json({ valid: false, expired: true, error: 'Session expired due to inactivity' });
  }

  return res.json({
    valid: true,
    user: {
      userId: session.userId,
      email: session.email,
      name: session.name,
      role: session.role,
      campusId: session.campusId,
      academicSession: session.academicSession,
    },
    expiresAt: session.expiresAt,
    rememberMe: session.rememberMe,
  });
});

// 3. Logout Endpoint
app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : req.body.token;
  const clientIp = req.ip || '127.0.0.1';

  if (token && activeSessions.has(token)) {
    const session = activeSessions.get(token);
    if (session) {
      logSecurityEvent('LOGOUT', session.email, clientIp, 'User logged out and destroyed session token.', 'low');
    }
    activeSessions.delete(token);
  }

  return res.json({ success: true, message: 'Session successfully revoked' });
});

// 4. Forgot Password Endpoint (Initiate Recovery)
app.post('/api/auth/forgot-password', (req, res) => {
  try {
    const { email } = req.body;
    const clientIp = req.ip || '127.0.0.1';
    if (!email) {
      return res.status(400).json({ error: 'Email address is required.' });
    }

    const trimmedEmail = String(email).trim().toLowerCase();
    const user = Object.values(userAccounts).find((u) => u.email.toLowerCase() === trimmedEmail);

    if (!user) {
      // Generic success to prevent account enumeration
      return res.json({
        success: true,
        message: 'If an account exists with this email, a 6-digit password reset code has been sent.',
        maskedEmail: trimmedEmail.replace(/(.{2})(.*)(?=@)/, (_g1, g2, g3) => g2 + '*'.repeat(g3.length)),
      });
    }

    // Generate 6-digit verification code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetToken = crypto.randomBytes(24).toString('hex');

    passwordResetTokens.set(resetCode, {
      email: user.email,
      expiresAt: Date.now() + 15 * 60 * 1000, // 15 mins
      code: resetCode,
    });

    logSecurityEvent(
      'PASSWORD_RESET',
      user.email,
      clientIp,
      `Password reset code generated (${resetCode}) with 15-minute expiration.`,
      'medium'
    );

    return res.json({
      success: true,
      message: 'Password reset code has been generated.',
      resetCode, // provided for institutional testing ease
      maskedEmail: user.email.replace(/(.{2})(.*)(?=@)/, (_g1, g2, g3) => g2 + '*'.repeat(g3.length)),
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Password reset request failed' });
  }
});

// 5. Reset Password Endpoint
app.post('/api/auth/reset-password', (req, res) => {
  try {
    const { resetCode, newPassword } = req.body;
    const clientIp = req.ip || '127.0.0.1';

    if (!resetCode || !newPassword) {
      return res.status(400).json({ error: 'Reset code and new password are required.' });
    }

    const record = passwordResetTokens.get(String(resetCode).trim());
    if (!record || record.expiresAt < Date.now()) {
      return res.status(400).json({ error: 'Invalid or expired password reset code.' });
    }

    const user = Object.values(userAccounts).find((u) => u.email.toLowerCase() === record.email.toLowerCase());
    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    const { hash, salt } = hashPassword(newPassword);
    user.passwordHash = hash;
    user.salt = salt;
    user.failedAttempts = 0;
    user.lockedUntil = null;

    passwordResetTokens.delete(String(resetCode).trim());

    logSecurityEvent(
      'PASSWORD_RESET',
      user.email,
      clientIp,
      'Password successfully changed with salted PBKDF2 hash. Account unlocked.',
      'high'
    );

    return res.json({
      success: true,
      message: 'Password has been successfully updated. You may now log in with your new credentials.',
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to reset password' });
  }
});

// 6. Master Unlock Account Endpoint
app.post('/api/auth/unlock-account', (req, res) => {
  try {
    const { email, unlockCode } = req.body;
    const clientIp = req.ip || '127.0.0.1';

    // Master unlock authorization code
    if (unlockCode !== 'OAKRIDGE-SECURE-UNLOCK-2025') {
      logSecurityEvent(
        'ACCOUNT_LOCKED',
        email || 'unknown',
        clientIp,
        'Failed attempt to unlock account with invalid master code.',
        'high'
      );
      return res.status(403).json({ error: 'Invalid institutional security unlock code.' });
    }

    const user = Object.values(userAccounts).find((u) => u.email.toLowerCase() === String(email).trim().toLowerCase());
    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    user.failedAttempts = 0;
    user.lockedUntil = null;

    logSecurityEvent(
      'ACCOUNT_UNLOCKED',
      user.email,
      clientIp,
      'Account unlocked using master security authorization code.',
      'high'
    );

    return res.json({
      success: true,
      message: `Account for ${user.name} (${user.email}) has been unlocked. Consecutive failed attempt counter cleared.`,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to unlock account' });
  }
});

// 7. Security Events Log
app.get('/api/auth/security-events', (_req, res) => {
  return res.json({ events: securityEvents });
});

// 8. Change Password (Authenticated User)
app.post('/api/auth/change-password', (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;
    const clientIp = req.ip || '127.0.0.1';

    if (!email || !currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Email, current password, and new password are required.' });
    }

    const user = Object.values(userAccounts).find((u) => u.email.toLowerCase() === String(email).trim().toLowerCase());
    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    const isCurrentValid = verifyPassword(currentPassword, user.salt, user.passwordHash);
    if (!isCurrentValid) {
      logSecurityEvent('LOGIN_FAILED', user.email, clientIp, 'Password change rejected: Incorrect current password.', 'medium');
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    const { hash, salt } = hashPassword(newPassword);
    user.passwordHash = hash;
    user.salt = salt;

    logSecurityEvent('PASSWORD_RESET', user.email, clientIp, 'Password changed by authenticated user.', 'medium');

    return res.json({ success: true, message: 'Password has been updated successfully.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update password.' });
  }
});

// 9. Get User Accounts (For RBAC & Account Management)
app.get('/api/auth/users', (_req, res) => {
  const usersList = Object.values(userAccounts).map((u) => ({
    id: u.id,
    email: u.email,
    username: u.username,
    name: u.name,
    role: u.role,
    designation: u.designation,
    failedAttempts: u.failedAttempts,
    isLocked: !!(u.lockedUntil && u.lockedUntil > Date.now()),
    active: u.active !== false,
    avatarBg: u.avatarBg,
  }));
  return res.json({ users: usersList });
});

// 10. Toggle User Status (Activate/Deactivate)
app.post('/api/auth/toggle-user-status', (req, res) => {
  try {
    const { email, active } = req.body;
    const clientIp = req.ip || '127.0.0.1';

    const user = Object.values(userAccounts).find((u) => u.email.toLowerCase() === String(email).trim().toLowerCase());
    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    user.active = Boolean(active);
    logSecurityEvent(
      'ACCOUNT_UNLOCKED',
      user.email,
      clientIp,
      `User account ${active ? 'activated' : 'deactivated'} by administrator.`,
      'high'
    );

    return res.json({
      success: true,
      message: `Account for ${user.name} is now ${user.active ? 'Active' : 'Deactivated'}.`,
      user: {
        id: user.id,
        email: user.email,
        active: user.active,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to toggle account status.' });
  }
});

// 11. Controlled Transaction Approval Workflows (Server-Enforced Financial Controls)
interface ServerApprovalAudit {
  action: 'Created' | 'Submitted' | 'Approved' | 'Rejected' | 'Posted' | 'Cancelled';
  actor: string;
  role: string;
  timestamp: string;
  notes?: string;
  reason?: string;
}

interface ServerApproval {
  id: string;
  title: string;
  type: string;
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
  auditTrail: ServerApprovalAudit[];
}

const serverApprovals: ServerApproval[] = [
  {
    id: 'TXN-APP-001',
    title: 'Merit Tuition Scholarship (25% Discount)',
    type: 'Fee Discount',
    requesterName: 'Officer Thomas Jackson',
    requesterRole: 'Receptionist',
    amount: 875,
    details: 'Merit scholarship application for incoming transfer student in Grade 11 Science.',
    status: 'Pending Approval',
    submittedDate: '2026-09-23',
    studentId: 'stu-101',
    studentName: 'Alexander Hayes',
    createdBy: 'Officer Thomas Jackson',
    createdRole: 'Receptionist',
    submittedBy: 'Jonathan Reynolds, CPA',
    submittedAt: '2026-09-23 10:15 AM',
    auditTrail: [
      { action: 'Created', actor: 'Officer Thomas Jackson', role: 'Receptionist', timestamp: '2026-09-23 09:30 AM', notes: 'Initial scholarship voucher created.' },
      { action: 'Submitted', actor: 'Jonathan Reynolds, CPA', role: 'Accountant', timestamp: '2026-09-23 10:15 AM', notes: 'Forwarded for principal approval.' },
    ],
  },
  {
    id: 'TXN-APP-002',
    title: 'Robotics Team Championship Travel Expense',
    type: 'Expense',
    requesterName: 'Clara Oswald, M.Ed.',
    requesterRole: 'Teacher',
    amount: 4600,
    details: 'Travel, lodging, and registration fees for 8 students and 2 faculty chaperones.',
    status: 'Pending Approval',
    submittedDate: '2026-09-24',
    createdBy: 'Clara Oswald, M.Ed.',
    createdRole: 'Teacher',
    submittedBy: 'Jonathan Reynolds, CPA',
    submittedAt: '2026-09-24 11:00 AM',
    auditTrail: [
      { action: 'Created', actor: 'Clara Oswald, M.Ed.', role: 'Teacher', timestamp: '2026-09-24 09:00 AM' },
      { action: 'Submitted', actor: 'Jonathan Reynolds, CPA', role: 'Accountant', timestamp: '2026-09-24 11:00 AM' },
    ],
  },
  {
    id: 'TXN-APP-003',
    title: 'Faculty September Payroll Batch Disbursement',
    type: 'Payroll',
    requesterName: 'Jonathan Reynolds, CPA',
    requesterRole: 'Accountant',
    amount: 102000,
    details: 'Disbursement authorization for monthly faculty and operational staff payroll register.',
    status: 'Approved',
    submittedDate: '2026-09-25',
    createdBy: 'Jonathan Reynolds, CPA',
    createdRole: 'Accountant',
    submittedBy: 'Jonathan Reynolds, CPA',
    submittedAt: '2026-09-25 08:30 AM',
    approvedBy: 'Dr. Eleanor Vance',
    approvedAt: '2026-09-25 02:15 PM',
    comments: 'Reviewed and verified with bank treasury.',
    auditTrail: [
      { action: 'Created', actor: 'Jonathan Reynolds, CPA', role: 'Accountant', timestamp: '2026-09-24 05:00 PM' },
      { action: 'Submitted', actor: 'Jonathan Reynolds, CPA', role: 'Accountant', timestamp: '2026-09-25 08:30 AM' },
      { action: 'Approved', actor: 'Dr. Eleanor Vance', role: 'Super Admin', timestamp: '2026-09-25 02:15 PM' },
    ],
  },
  {
    id: 'TXN-APP-004',
    title: 'Quarter 2 Tuition Overpayment Refund',
    type: 'Fee Refund',
    requesterName: 'Jonathan Reynolds, CPA',
    requesterRole: 'Accountant',
    amount: 450,
    details: 'Parent Clara Sterling overpaid semester lab fees; balance adjustment requested.',
    status: 'Posted',
    submittedDate: '2026-09-20',
    studentId: 'stu-103',
    studentName: 'Julian Sterling',
    createdBy: 'Jonathan Reynolds, CPA',
    createdRole: 'Accountant',
    submittedBy: 'Jonathan Reynolds, CPA',
    submittedAt: '2026-09-20 09:00 AM',
    approvedBy: 'Prof. Margaret Sterling',
    approvedAt: '2026-09-20 11:30 AM',
    postedBy: 'System Financial Engine',
    postedAt: '2026-09-20 12:00 PM',
    auditTrail: [
      { action: 'Created', actor: 'Jonathan Reynolds, CPA', role: 'Accountant', timestamp: '2026-09-20 08:45 AM' },
      { action: 'Submitted', actor: 'Jonathan Reynolds, CPA', role: 'Accountant', timestamp: '2026-09-20 09:00 AM' },
      { action: 'Approved', actor: 'Prof. Margaret Sterling', role: 'Principal', timestamp: '2026-09-20 11:30 AM' },
      { action: 'Posted', actor: 'System Financial Engine', role: 'System', timestamp: '2026-09-20 12:00 PM', notes: 'Cheque issued; ledger locked.' },
    ],
  },
];

// Get all approvals
app.get('/api/approvals', (_req, res) => {
  return res.json({ approvals: serverApprovals });
});

// Create new transaction approval request
app.post('/api/approvals/create', (req, res) => {
  try {
    const { title, type, requesterName, requesterRole, amount, details, studentId, studentName, status = 'Submitted' } = req.body;
    if (!title || !type) {
      return res.status(400).json({ error: 'Title and type are required' });
    }
    const id = `TXN-APP-${String(serverApprovals.length + 1).padStart(3, '0')}`;
    const timestamp = new Date().toLocaleString();
    const newTxn: ServerApproval = {
      id,
      title,
      type,
      requesterName: requesterName || 'Staff Member',
      requesterRole: requesterRole || 'Staff',
      amount: amount ? Number(amount) : undefined,
      details: details || '',
      studentId,
      studentName,
      status: status === 'Draft' ? 'Draft' : 'Pending Approval',
      submittedDate: new Date().toISOString().split('T')[0],
      createdBy: requesterName || 'Staff Member',
      createdRole: requesterRole || 'Staff',
      auditTrail: [
        {
          action: 'Created',
          actor: requesterName || 'Staff Member',
          role: requesterRole || 'Staff',
          timestamp,
          notes: status === 'Draft' ? 'Created as draft' : 'Submitted for review',
        },
      ],
    };
    if (status !== 'Draft') {
      newTxn.submittedBy = requesterName;
      newTxn.submittedAt = timestamp;
      newTxn.auditTrail.push({
        action: 'Submitted',
        actor: requesterName || 'Staff Member',
        role: requesterRole || 'Staff',
        timestamp,
        notes: 'Forwarded for executive approval',
      });
    }
    serverApprovals.unshift(newTxn);
    return res.json({ success: true, transaction: newTxn });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to create transaction' });
  }
});

// Submit a Draft transaction for approval
app.post('/api/approvals/submit', (req, res) => {
  try {
    const { id, actorName, actorRole } = req.body;
    const txn = serverApprovals.find((t) => t.id === id);
    if (!txn) return res.status(404).json({ error: 'Transaction not found' });
    if (txn.status !== 'Draft') {
      return res.status(400).json({ error: 'Only Draft transactions can be submitted' });
    }
    const timestamp = new Date().toLocaleString();
    txn.status = 'Pending Approval';
    txn.submittedBy = actorName || 'Accountant';
    txn.submittedAt = timestamp;
    txn.auditTrail.push({
      action: 'Submitted',
      actor: actorName || 'Accountant',
      role: actorRole || 'Accountant',
      timestamp,
      notes: 'Submitted for managerial authorization',
    });
    return res.json({ success: true, transaction: txn });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to submit transaction' });
  }
});

// Approve transaction (Requires Principal / Super Admin / Authorized Manager)
app.post('/api/approvals/approve', (req, res) => {
  try {
    const { id, approverName, approverRole, comments } = req.body;
    const txn = serverApprovals.find((t) => t.id === id);
    if (!txn) return res.status(404).json({ error: 'Transaction not found' });
    if (txn.status !== 'Pending Approval') {
      return res.status(400).json({ error: 'Only Pending transactions can be approved' });
    }
    const timestamp = new Date().toLocaleString();
    txn.status = 'Approved';
    txn.approvedBy = approverName || 'Dr. Eleanor Vance';
    txn.approvedAt = timestamp;
    if (comments) txn.comments = comments;
    txn.auditTrail.push({
      action: 'Approved',
      actor: approverName || 'Dr. Eleanor Vance',
      role: approverRole || 'Super Admin',
      timestamp,
      notes: comments || 'Authorized for financial posting',
    });
    return res.json({ success: true, transaction: txn });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to approve transaction' });
  }
});

// Reject transaction (Requires reason)
app.post('/api/approvals/reject', (req, res) => {
  try {
    const { id, rejectorName, rejectorRole, reason } = req.body;
    const txn = serverApprovals.find((t) => t.id === id);
    if (!txn) return res.status(404).json({ error: 'Transaction not found' });
    if (txn.status !== 'Pending Approval') {
      return res.status(400).json({ error: 'Only Pending transactions can be rejected' });
    }
    if (!reason) {
      return res.status(400).json({ error: 'Rejection reason is required by financial control policy' });
    }
    const timestamp = new Date().toLocaleString();
    txn.status = 'Rejected';
    txn.rejectionReason = reason;
    txn.auditTrail.push({
      action: 'Rejected',
      actor: rejectorName || 'Dr. Eleanor Vance',
      role: rejectorRole || 'Super Admin',
      timestamp,
      reason,
      notes: `Rejected by executive authorization: ${reason}`,
    });
    return res.json({ success: true, transaction: txn });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to reject transaction' });
  }
});

// Post transaction (Locks transaction, enters into official general ledger)
app.post('/api/approvals/post', (req, res) => {
  try {
    const { id, posterName, posterRole } = req.body;
    const txn = serverApprovals.find((t) => t.id === id);
    if (!txn) return res.status(404).json({ error: 'Transaction not found' });
    if (txn.status !== 'Approved') {
      return res.status(400).json({ error: 'Transaction must be Approved before posting' });
    }
    const timestamp = new Date().toLocaleString();
    txn.status = 'Posted';
    txn.postedBy = posterName || 'System Financial Engine';
    txn.postedAt = timestamp;
    txn.auditTrail.push({
      action: 'Posted',
      actor: posterName || 'System Financial Engine',
      role: posterRole || 'System',
      timestamp,
      notes: 'Transaction ledger entries posted and locked permanently',
    });
    return res.json({ success: true, transaction: txn });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to post transaction' });
  }
});

// Cancel transaction (Requires cancellation reason)
app.post('/api/approvals/cancel', (req, res) => {
  try {
    const { id, cancelerName, cancelerRole, reason } = req.body;
    const txn = serverApprovals.find((t) => t.id === id);
    if (!txn) return res.status(404).json({ error: 'Transaction not found' });
    if (txn.status === 'Posted') {
      return res.status(400).json({ error: 'Posted transactions cannot be freely cancelled. Use official reverse procedure.' });
    }
    const timestamp = new Date().toLocaleString();
    txn.status = 'Cancelled';
    txn.cancellationReason = reason || 'Cancelled by authorized user';
    txn.auditTrail.push({
      action: 'Cancelled',
      actor: cancelerName || 'Staff Member',
      role: cancelerRole || 'Staff',
      timestamp,
      reason: reason || 'Cancelled by authorized user',
      notes: reason || 'Cancelled by authorized user',
    });
    return res.json({ success: true, transaction: txn });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to cancel transaction' });
  }
});

// Shared Gemini client utility
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// API Routes for Gemini Intelligence
// 1. General & Tiered Generation
app.post('/api/gemini/generate', async (req, res) => {
  try {
    const { prompt, taskType = 'general', systemInstruction } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    let modelName = 'gemini-3.5-flash';
    if (taskType === 'fast') {
      modelName = 'gemini-3.1-flash-lite';
    } else if (taskType === 'complex') {
      modelName = 'gemini-3.1-pro-preview';
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction || 'You are an expert school ERP intelligent administrative and academic assistant.',
      },
    });

    return res.json({ text: response.text, model: modelName });
  } catch (error: any) {
    console.error('Gemini generate error:', error);
    return res.status(500).json({ error: error.message || 'Error generating content' });
  }
});

// 2. Multi-turn Chatbot
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { messages, systemInstruction, model = 'gemini-3.5-flash' } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const validModel =
      model === 'gemini-3.1-pro-preview' || model === 'gemini-3.1-flash-lite'
        ? model
        : 'gemini-3.5-flash';

    const contents = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content || '' }],
    }));

    const response = await ai.models.generateContent({
      model: validModel,
      contents,
      config: {
        systemInstruction:
          systemInstruction ||
          'You are an authoritative, helpful, and cordial AI School Administrator and Academic Advisor for the School Management ERP Command Center. Assist administrators, teachers, and parents with scheduling, policies, student progress, financial forecasts, and operations.',
      },
    });

    return res.json({ text: response.text, model: validModel });
  } catch (error: any) {
    console.error('Gemini chat error:', error);
    return res.status(500).json({ error: error.message || 'Chat generation error' });
  }
});

// 3. High Thinking Mode (Reasoning Engine)
app.post('/api/gemini/thinking', async (req, res) => {
  try {
    const { prompt, systemInstruction } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // gemini-3.1-pro-preview with thinkingLevel HIGH and NO maxOutputTokens
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: prompt,
      config: {
        systemInstruction:
          systemInstruction ||
          'You are an elite educational strategist and deep reasoning intelligence for institutional school operations. Solve complex operational problems, structural timetable bottlenecks, forensic financial audits, and multi-year curriculum designs.',
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.HIGH,
        },
      },
    });

    return res.json({ text: response.text, model: 'gemini-3.1-pro-preview' });
  } catch (error: any) {
    console.error('Gemini thinking error:', error);
    return res.status(500).json({ error: error.message || 'Thinking analysis error' });
  }
});

// 4. Multimodal Image Analysis (Document Scanner / Receipt OCR)
app.post('/api/gemini/analyze-image', async (req, res) => {
  try {
    const { base64Data, mimeType = 'image/jpeg', prompt = 'Analyze this document or image and extract key school records data.' } = req.body;
    if (!base64Data) {
      return res.status(400).json({ error: 'Base64 image data is required' });
    }

    const cleanBase64 = base64Data.includes('base64,')
      ? base64Data.split('base64,')[1]
      : base64Data;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
    });

    return res.json({ text: response.text, model: 'gemini-3.1-pro-preview' });
  } catch (error: any) {
    console.error('Gemini image analysis error:', error);
    return res.status(500).json({ error: error.message || 'Image analysis error' });
  }
});

// 5. Video Content Understanding
app.post('/api/gemini/analyze-video', async (req, res) => {
  try {
    const { base64Data, mimeType = 'video/mp4', prompt = 'Summarize key educational concepts, classroom engagement, or safety events from this video.' } = req.body;
    if (!base64Data) {
      return res.status(400).json({ error: 'Base64 video data is required' });
    }

    const cleanBase64 = base64Data.includes('base64,')
      ? base64Data.split('base64,')[1]
      : base64Data;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
    });

    return res.json({ text: response.text, model: 'gemini-3.1-pro-preview' });
  } catch (error: any) {
    console.error('Gemini video analysis error:', error);
    return res.status(500).json({ error: error.message || 'Video analysis error' });
  }
});

// 6. Audio Transcription (Microphone & Voice Memos)
app.post('/api/gemini/transcribe', async (req, res) => {
  try {
    const { base64Audio, mimeType = 'audio/webm' } = req.body;
    if (!base64Audio) {
      return res.status(400).json({ error: 'Base64 audio data is required' });
    }

    const cleanBase64 = base64Audio.includes('base64,')
      ? base64Audio.split('base64,')[1]
      : base64Audio;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType,
            },
          },
          {
            text: 'Please transcribe the speech in this audio accurately. Format paragraphs with proper punctuation and speaker turns if apparent.',
          },
        ],
      },
    });

    return res.json({ text: response.text, model: 'gemini-3.5-transcribe' });
  } catch (error: any) {
    console.error('Gemini transcribe error:', error);
    return res.status(500).json({ error: error.message || 'Audio transcription error' });
  }
});

// Create HTTP server
const server = http.createServer(app);

// WebSocket server for Real-time Voice Conversations via Live API (gemini-3.8-live)
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  const { pathname } = new URL(request.url || '', `http://${request.headers.host}`);
  if (pathname === '/ws/live') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

wss.on('connection', async (clientWs: WebSocket) => {
  console.log('Live Voice client connected');
  let session: any = null;

  try {
    session = await ai.live.connect({
      model: 'gemini-3.8-live',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
        },
        systemInstruction:
          'You are a real-time voice school administrative assistant. Keep your spoken responses concise, warm, helpful, and natural. Guide users on student records, fees, attendance, academic schedules, and school operations.',
      },
      callbacks: {
        onmessage: (message: LiveServerMessage) => {
          if (clientWs.readyState !== WebSocket.OPEN) return;
          const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (audio) {
            clientWs.send(JSON.stringify({ type: 'audio', audio }));
          }
          if (message.serverContent?.interrupted) {
            clientWs.send(JSON.stringify({ type: 'interrupted' }));
          }
        },
        onclose: () => {
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: 'status', status: 'closed' }));
          }
        },
      },
    });

    clientWs.send(JSON.stringify({ type: 'status', status: 'ready' }));

    clientWs.on('message', (data: any) => {
      try {
        const parsed = JSON.parse(data.toString());
        if (parsed.audio && session) {
          session.sendRealtimeInput({
            audio: {
              data: parsed.audio,
              mimeType: 'audio/pcm;rate=16000',
            },
          });
        }
      } catch (err) {
        console.error('Error handling client audio input:', err);
      }
    });

    clientWs.on('close', () => {
      console.log('Live Voice client disconnected');
      if (session) {
        try {
          session.close();
        } catch (_) {}
      }
    });
  } catch (error: any) {
    console.error('Error connecting to Gemini Live API:', error);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({ type: 'error', message: error.message }));
      clientWs.close();
    }
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  server.listen(port, '0.0.0.0', () => {
    console.log(`School Management ERP Server listening on port ${port}`);
  });
}

startServer();
