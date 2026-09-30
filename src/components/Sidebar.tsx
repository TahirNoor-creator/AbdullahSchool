import React from 'react';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Receipt,
  CircleDollarSign,
  GraduationCap,
  Briefcase,
  Boxes,
  Building,
  ShieldCheck,
  CloudCog,
  Sparkles,
  Bot,
  Mic,
  Image as ImageIcon,
  Video,
  AudioWaveform,
  BrainCircuit,
  FileText,
  Database,
  History,
  CheckSquare2,
  BellRing,
  Palette,
  Compass,
  HardDrive,
  FileSpreadsheet,
  Mail,
  FormInput,
  Contact,
  QrCode,
  BarChart3,
  BookOpen,
  Bus,
  MessageSquare,
  BarChart2,
  Wrench,
  Clock,
} from 'lucide-react';

export type ERPView =
  | 'command-center'
  | 'analytics'
  | 'qr-scanner'
  | 'smart-forms'
  | 'students'
  | 'attendance'
  | 'timetable'
  | 'fees-invoicing'
  | 'expenses'
  | 'exams'
  | 'library'
  | 'transport'
  | 'communication'
  | 'reports-center'
  | 'hr-payroll'
  | 'inventory-pos'
  | 'multi-campus'
  | 'approvals'
  | 'documents'
  | 'workspace-hub'
  | 'gemini-voice'
  | 'gemini-chat'
  | 'gemini-multimodal'
  | 'gemini-thinking'
  | 'security-roles'
  | 'backup-integrity'
  | 'sync-fixer'
  | 'appearance'
  | 'setup-wizard';

interface SidebarProps {
  currentView: ERPView;
  onSelectView: (view: ERPView) => void;
  pendingApprovalsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  pendingApprovalsCount,
}) => {
  const navSections = [
    {
      title: 'COMMAND ROOM',
      items: [
        { id: 'command-center' as ERPView, label: 'ERP Command Center', icon: LayoutDashboard, badge: 'Live' },
        { id: 'smart-forms' as ERPView, label: 'Admin & Smart Forms', icon: FormInput, badge: 'Studio' },
        { id: 'analytics' as ERPView, label: 'Institutional Analytics', icon: BarChart3, badge: 'KPI' },
        { id: 'reports-center' as ERPView, label: 'Comprehensive Reports', icon: FileSpreadsheet, badge: 'Audit' },
        { id: 'qr-scanner' as ERPView, label: 'QR Scanner & Gate Pass', icon: QrCode, badge: 'Scanner' },
        { id: 'approvals' as ERPView, label: 'Approval Workflows', icon: CheckSquare2, badge: pendingApprovalsCount > 0 ? String(pendingApprovalsCount) : undefined },
      ],
    },
    {
      title: 'ACADEMICS & STUDENTS',
      items: [
        { id: 'students' as ERPView, label: 'Student Directory & Admissions', icon: Users },
        { id: 'timetable' as ERPView, label: 'Timetable & Scheduling', icon: Clock, badge: 'Smart' },
        { id: 'attendance' as ERPView, label: 'Daily Attendance', icon: CalendarCheck },
        { id: 'exams' as ERPView, label: 'Exams & Report Cards', icon: GraduationCap },
        { id: 'library' as ERPView, label: 'Library Management', icon: BookOpen, badge: 'Books' },
        { id: 'transport' as ERPView, label: 'Transport & Fleet', icon: Bus, badge: 'Fleet' },
        { id: 'communication' as ERPView, label: 'Notices & Communications', icon: MessageSquare, badge: 'SMS/Email' },
        { id: 'multi-campus' as ERPView, label: 'Multi-Campus Hub', icon: Building },
      ],
    },
    {
      title: 'FINANCE & OPERATIONS',
      items: [
        { id: 'fees-invoicing' as ERPView, label: 'Fees & Invoicing', icon: Receipt },
        { id: 'expenses' as ERPView, label: 'Expenses & Ledgers', icon: CircleDollarSign },
        { id: 'hr-payroll' as ERPView, label: 'HR & Payroll', icon: Briefcase },
        { id: 'inventory-pos' as ERPView, label: 'Inventory & POS Register', icon: Boxes },
        { id: 'documents' as ERPView, label: 'Document & Printing Studio', icon: FileText },
      ],
    },
    {
      title: 'GOOGLE WORKSPACE',
      items: [
        { id: 'workspace-hub' as ERPView, label: 'Google Workspace Hub', icon: CloudCog, badge: '5 APIs' },
      ],
    },
    {
      title: 'GEMINI AI INTELLIGENCE',
      items: [
        { id: 'gemini-voice' as ERPView, label: 'Voice Live Assistant', icon: Mic, badge: '3.8-Live' },
        { id: 'gemini-chat' as ERPView, label: 'Academic & Admin Chatbot', icon: Bot, badge: 'Pro' },
        { id: 'gemini-multimodal' as ERPView, label: 'Multimodal Vision & Audio', icon: ImageIcon, badge: 'Pro/3.5' },
        { id: 'gemini-thinking' as ERPView, label: 'Deep Reasoning Engine', icon: BrainCircuit, badge: 'HIGH' },
      ],
    },
    {
      title: 'SECURITY & SYSTEM',
      items: [
        { id: 'security-roles' as ERPView, label: 'Roles, Permissions & Audit', icon: ShieldCheck },
        { id: 'backup-integrity' as ERPView, label: 'Backup & Data Integrity', icon: Database },
        { id: 'sync-fixer' as ERPView, label: 'Sync Conflicts & Fixer', icon: Wrench, badge: 'Auto-Fix' },
        { id: 'appearance' as ERPView, label: 'Appearance & Themes', icon: Palette },
        { id: 'setup-wizard' as ERPView, label: 'ERP Setup Wizard', icon: Compass, badge: '12-Step' },
      ],
    },
  ];

  return (
    <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex flex-col h-[calc(100vh-4rem)] overflow-y-auto shrink-0 select-none">
      <div className="p-3 space-y-6">
        {navSections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            <h2 className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {section.title}
            </h2>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectView(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20 font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto p-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-between">
        <span>ERP Core v3.2.0</span>
        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Connected
        </span>
      </div>
    </aside>
  );
};
