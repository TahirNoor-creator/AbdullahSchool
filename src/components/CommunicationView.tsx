import React, { useState } from 'react';
import {
  Mail,
  Send,
  Bell,
  MessageSquare,
  Users,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Plus,
  Radio,
  FileText,
  Clock,
  CheckCheck,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { Announcement, Student } from '../types/erp';

export interface DispatchLog {
  id: string;
  channel: 'SMS' | 'Email' | 'Broadcast';
  recipientGroup: string;
  subject: string;
  recipientsCount: number;
  dispatchedAt: string;
  status: 'Delivered' | 'Dispatched' | 'Failed';
  sender: string;
}

export interface ParentMessage {
  id: string;
  parentName: string;
  studentName: string;
  className: string;
  subject: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
  replies: Array<{ sender: string; text: string; time: string }>;
}

interface CommunicationViewProps {
  announcements: Announcement[];
  students: Student[];
  onAddAnnouncement: (announcement: Omit<Announcement, 'id' | 'createdAt'>) => void;
  onShowToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const CommunicationView: React.FC<CommunicationViewProps> = ({
  announcements,
  students,
  onAddAnnouncement,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'notices' | 'dispatch' | 'parent-inbox'>('notices');

  // Dispatch Form State
  const [channel, setChannel] = useState<'SMS' | 'Email' | 'Broadcast'>('SMS');
  const [targetGroup, setTargetGroup] = useState('All Parents');
  const [subject, setSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Dispatch History Logs
  const [dispatchLogs, setDispatchLogs] = useState<DispatchLog[]>([
    {
      id: 'disp-1',
      channel: 'SMS',
      recipientGroup: 'All Parents (1,420 Contacts)',
      subject: 'Term 2 Report Cards Published on Portal',
      recipientsCount: 1420,
      dispatchedAt: '2025-05-12 09:30 AM',
      status: 'Delivered',
      sender: 'Super Admin',
    },
    {
      id: 'disp-2',
      channel: 'Email',
      recipientGroup: 'Fee Overdue Parents (86 Contacts)',
      subject: 'Official Reminder: Outstanding Term Fees Due by May 25',
      recipientsCount: 86,
      dispatchedAt: '2025-05-10 02:15 PM',
      status: 'Delivered',
      sender: 'Accounts Bursar',
    },
    {
      id: 'disp-3',
      channel: 'Broadcast',
      recipientGroup: 'All Teachers & Faculty (48 Staff)',
      subject: 'Staff Faculty Meeting Scheduled for Friday 3:30 PM',
      recipientsCount: 48,
      dispatchedAt: '2025-05-08 11:00 AM',
      status: 'Delivered',
      sender: 'Principal Office',
    },
  ]);

  // Parent Inquiries Threads
  const [parentMessages, setParentMessages] = useState<ParentMessage[]>([
    {
      id: 'msg-1',
      parentName: 'Robert & Clara Hayes',
      studentName: 'Alexander Hayes (Grade 10-A)',
      className: 'Grade 10-A',
      subject: 'Inquiry regarding Advanced Physics Olympiad Registration',
      lastMessage: 'Could you please confirm if the examination hall ticket has been issued for the Olympiad?',
      timestamp: 'Today, 10:14 AM',
      unread: true,
      replies: [
        {
          sender: 'Parent',
          text: 'Could you please confirm if the examination hall ticket has been issued for the Olympiad?',
          time: '10:14 AM',
        },
      ],
    },
    {
      id: 'msg-2',
      parentName: 'Elena Rostova',
      studentName: 'Dmitri Rostov (Grade 8-B)',
      className: 'Grade 8-B',
      subject: 'Sick Leave Medical Certificate Submission',
      lastMessage: 'Dmitri was unwell with viral fever; attached doctor note for 3 days leave approval.',
      timestamp: 'Yesterday, 04:20 PM',
      unread: false,
      replies: [
        {
          sender: 'Parent',
          text: 'Dmitri was unwell with viral fever; attached doctor note for 3 days leave approval.',
          time: '04:20 PM',
        },
        {
          sender: 'Class Teacher',
          text: 'Thank you for updating us. The attendance record has been marked as Excused Medical Leave.',
          time: '05:00 PM',
        },
      ],
    },
  ]);

  const [selectedThread, setSelectedThread] = useState<ParentMessage | null>(parentMessages[0]);
  const [replyText, setReplyText] = useState('');

  // Notice modal
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeMsg, setNoticeMsg] = useState('');
  const [noticePriority, setNoticePriority] = useState<Announcement['priority']>('info');
  const [noticeTarget, setNoticeTarget] = useState<Announcement['target']>('All Users');

  const templates = [
    {
      title: 'Fee Payment Reminder',
      subject: 'Urgent: School Fee Payment Due Notice',
      body: 'Dear Parent, this is a cordial reminder that school fees for the current term are due. Please settle via the online portal or campus bursar office.',
    },
    {
      title: 'Emergency Weather / Holiday Notice',
      subject: 'Campus Closed: Severe Weather Advisory',
      body: 'Dear Parents & Faculty, due to inclement weather conditions, Oakridge Academy campuses will remain closed tomorrow. Online remote lectures will proceed.',
    },
    {
      title: 'Parent-Teacher Meeting (PTM)',
      subject: 'Annual Parent-Teacher Conference Schedule',
      body: 'Dear Guardian, you are cordially invited to attend the Mid-Term Parent-Teacher Meeting this Saturday from 09:00 AM to 01:00 PM.',
    },
  ];

  const handleApplyTemplate = (tpl: (typeof templates)[0]) => {
    setSubject(tpl.subject);
    setMessageBody(tpl.body);
  };

  const handleSendDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !messageBody.trim()) return;

    setIsSending(true);
    setTimeout(() => {
      const newLog: DispatchLog = {
        id: `disp-${Date.now()}`,
        channel,
        recipientGroup: targetGroup,
        subject,
        recipientsCount: targetGroup === 'All Parents' ? 1420 : 120,
        dispatchedAt: new Date().toLocaleString(),
        status: 'Delivered',
        sender: 'Executive Administrator',
      };
      setDispatchLogs([newLog, ...dispatchLogs]);
      setIsSending(false);
      onShowToast?.('success', `${channel} Broadcast Dispatched`, `Delivered to ${newLog.recipientsCount} recipients.`);
      setSubject('');
      setMessageBody('');
    }, 800);
  };

  const handleAddNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeMsg.trim()) return;

    onAddAnnouncement({
      title: noticeTitle.trim(),
      message: noticeMsg.trim(),
      priority: noticePriority,
      target: noticeTarget,
      author: 'Administrative Superintendent',
      active: true,
    });

    setShowNoticeModal(false);
    onShowToast?.('success', 'Official Notice Published', `"${noticeTitle}" posted to school board.`);
    setNoticeTitle('');
    setNoticeMsg('');
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedThread) return;

    const newReply = {
      sender: 'Authorized Staff',
      text: replyText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updated = {
      ...selectedThread,
      unread: false,
      replies: [...selectedThread.replies, newReply],
    };

    setSelectedThread(updated);
    setParentMessages(parentMessages.map((m) => (m.id === updated.id ? updated : m)));
    setReplyText('');
    onShowToast?.('success', 'Reply Sent', 'Your response has been dispatched to the parent portal.');
  };

  const charCount = messageBody.length;
  const smsSegments = Math.ceil(Math.max(1, charCount) / 160);

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-teal-900/30 via-indigo-900/20 to-sky-900/20 border border-slate-200 dark:border-slate-800 backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-bold text-xs uppercase tracking-wider">
            <Radio className="w-4 h-4" />
            <span>Omnichannel Communications Hub</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            Notices, Announcements &amp; SMS/Email Dispatch
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Publish circulars, broadcast SMS/Email emergency alerts, and respond to direct parent inquiries.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowNoticeModal(true)}
            className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Publish Circular</span>
          </button>
          <button
            onClick={() => setActiveTab('dispatch')}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Broadcast SMS / Email</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('notices')}
          className={`py-3 px-1 border-b-2 transition-all ${
            activeTab === 'notices'
              ? 'border-teal-600 text-teal-600 dark:text-teal-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Notice Board ({announcements.length})
        </button>
        <button
          onClick={() => setActiveTab('dispatch')}
          className={`py-3 px-1 border-b-2 transition-all ${
            activeTab === 'dispatch'
              ? 'border-teal-600 text-teal-600 dark:text-teal-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          SMS &amp; Email Dispatch Studio
        </button>
        <button
          onClick={() => setActiveTab('parent-inbox')}
          className={`py-3 px-1 border-b-2 transition-all ${
            activeTab === 'parent-inbox'
              ? 'border-teal-600 text-teal-600 dark:text-teal-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Parent Messages ({parentMessages.filter((m) => m.unread).length} Unread)
        </button>
      </div>

      {/* TAB 1: NOTICES BOARD */}
      {activeTab === 'notices' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      ann.priority === 'emergency'
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        : ann.priority === 'warning'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                    }`}
                  >
                    {ann.priority.toUpperCase()}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">{ann.target}</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">{ann.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">{ann.message}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span>By {ann.author}</span>
                <span>{ann.createdAt}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: SMS & EMAIL DISPATCH STUDIO */}
      {activeTab === 'dispatch' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Dispatch Composer */}
          <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-teal-500" />
              <span>Broadcast Dispatch Composer</span>
            </h2>

            {/* Quick Templates */}
            <div>
              <span className="text-xs font-semibold text-slate-400 mb-1.5 block">1-Click Message Templates:</span>
              <div className="flex flex-wrap gap-2">
                {templates.map((tpl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleApplyTemplate(tpl)}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:border-teal-500 transition-colors"
                  >
                    {tpl.title}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSendDispatch} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                    Transmission Channel
                  </label>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
                  >
                    <option value="SMS">SMS Gateway (Fast Cellular)</option>
                    <option value="Email">Official Gmail / SMTP Email</option>
                    <option value="Broadcast">Portal In-App Broadcast</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                    Recipient Target Audience
                  </label>
                  <select
                    value={targetGroup}
                    onChange={(e) => setTargetGroup(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
                  >
                    <option value="All Parents">All Enrolled Parents (1,420)</option>
                    <option value="Fee Overdue Parents">Outstanding Fee Defaulters (86)</option>
                    <option value="All Teachers">Faculty &amp; Teachers (48)</option>
                    <option value="High School Classes">High School Grades 9-12 (580)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Subject / Heading
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Urgent Reminder: Term Fee Due Date"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-600 dark:text-slate-400 font-semibold">Message Content</label>
                  {channel === 'SMS' && (
                    <span className="text-[11px] text-slate-400 font-mono">
                      {charCount} chars · {smsSegments} SMS {smsSegments > 1 ? 'segments' : 'segment'}
                    </span>
                  )}
                </div>
                <textarea
                  rows={4}
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  placeholder="Draft your announcement message here..."
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={isSending}
                className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSending ? 'Transmitting Broadcast...' : `Dispatch ${channel} Broadcast`}</span>
              </button>
            </form>
          </div>

          {/* Delivery Audit Logs */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" />
              <span>Recent Dispatch Logs</span>
            </h2>

            <div className="space-y-3 text-xs">
              {dispatchLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{log.channel} Broadcast</span>
                    <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
                      <CheckCheck className="w-3 h-3" />
                      <span>{log.status}</span>
                    </span>
                  </div>
                  <div className="text-[11px] font-medium text-slate-600 dark:text-slate-300 truncate">
                    {log.subject}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                    <span>{log.recipientGroup}</span>
                    <span>{log.dispatchedAt}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PARENT INBOX */}
      {activeTab === 'parent-inbox' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs min-h-[450px]">
          {/* Messages List */}
          <div className="border-r border-slate-200 dark:border-slate-800 p-4 space-y-3 overflow-y-auto max-h-[500px]">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Parent Inquiry Threads
            </div>
            {parentMessages.map((pm) => (
              <div
                key={pm.id}
                onClick={() => setSelectedThread(pm)}
                className={`p-3 rounded-xl border transition-all cursor-pointer text-left ${
                  selectedThread?.id === pm.id
                    ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/40 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:border-teal-300'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 dark:text-white">{pm.parentName}</span>
                  <span className="text-[10px] text-slate-400">{pm.timestamp}</span>
                </div>
                <div className="text-[11px] text-indigo-500 font-medium">{pm.studentName}</div>
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate mt-1">
                  {pm.subject}
                </div>
              </div>
            ))}
          </div>

          {/* Thread Chat View */}
          <div className="md:col-span-2 p-6 flex flex-col justify-between space-y-4">
            {selectedThread ? (
              <>
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">{selectedThread.subject}</h3>
                    <span className="text-xs text-slate-400">{selectedThread.className}</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    From: {selectedThread.parentName} ({selectedThread.studentName})
                  </div>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px] text-xs">
                  {selectedThread.replies.map((r, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-2xl max-w-md ${
                        r.sender === 'Parent'
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 mr-auto'
                          : 'bg-teal-600 text-white ml-auto'
                      }`}
                    >
                      <div className="text-[10px] font-bold opacity-75 mb-1">{r.sender} · {r.time}</div>
                      <p className="leading-relaxed">{r.text}</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendReply} className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type official response to parent..."
                    className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:border-teal-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs"
                  >
                    Reply
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-20 text-slate-400 text-xs">Select a thread to view inquiry</div>
            )}
          </div>
        </div>
      )}

      {/* PUBLISH NOTICE MODAL */}
      {showNoticeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-500" />
                <span>Publish Official School Circular</span>
              </h3>
              <button onClick={() => setShowNoticeModal(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddNotice} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Circular Title</label>
                <input
                  type="text"
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  placeholder="e.g. Schedule for Final Term Examinations"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Priority</label>
                  <select
                    value={noticePriority}
                    onChange={(e) => setNoticePriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
                  >
                    <option value="info">Normal (Info)</option>
                    <option value="warning">Important (Warning)</option>
                    <option value="emergency">High Priority / Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Target Audience</label>
                  <select
                    value={noticeTarget}
                    onChange={(e) => setNoticeTarget(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
                  >
                    <option value="All Users">All Community (Public)</option>
                    <option value="Parents">Parents Only</option>
                    <option value="Teachers">Faculty / Teachers Only</option>
                    <option value="Students">Students Only</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Notice Body</label>
                <textarea
                  rows={4}
                  value={noticeMsg}
                  onChange={(e) => setNoticeMsg(e.target.value)}
                  placeholder="Detailed text of the circular notice..."
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs mt-2"
              >
                Publish Notice to ERP Board
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
