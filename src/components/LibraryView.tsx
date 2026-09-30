import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Printer,
  Calendar,
  DollarSign,
  UserCheck,
  BookmarkCheck,
  Library,
  Tag,
  Hash,
  X,
} from 'lucide-react';
import { Student } from '../types/erp';

export interface Book {
  id: string;
  isbn: string;
  title: string;
  author: string;
  category: 'Science' | 'Mathematics' | 'Literature' | 'History' | 'Computer Science' | 'Arts' | 'Reference';
  shelfLocation: string;
  totalCopies: number;
  availableCopies: number;
  price: number;
}

export interface BookIssueRecord {
  id: string;
  bookId: string;
  bookTitle: string;
  isbn: string;
  memberId: string;
  memberName: string;
  memberType: 'Student' | 'Staff';
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  fineAmount: number;
  status: 'Issued' | 'Returned' | 'Overdue';
}

interface LibraryViewProps {
  students: Student[];
  onExportToSheet?: (title: string, headers: string[], rows: (string | number)[][]) => void;
  onShowToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  students,
  onExportToSheet,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'issues' | 'members' | 'fines'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Initial Books
  const [books, setBooks] = useState<Book[]>([
    {
      id: 'bk-1',
      isbn: '978-0134685991',
      title: 'Effective Java (3rd Edition)',
      author: 'Joshua Bloch',
      category: 'Computer Science',
      shelfLocation: 'Rack CS-04',
      totalCopies: 8,
      availableCopies: 5,
      price: 45.0,
    },
    {
      id: 'bk-2',
      isbn: '978-0199535569',
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      category: 'Literature',
      shelfLocation: 'Rack LIT-02',
      totalCopies: 15,
      availableCopies: 11,
      price: 18.5,
    },
    {
      id: 'bk-3',
      isbn: '978-1118230725',
      title: 'Fundamentals of Physics',
      author: 'David Halliday & Robert Resnick',
      category: 'Science',
      shelfLocation: 'Rack SCI-01',
      totalCopies: 12,
      availableCopies: 7,
      price: 65.0,
    },
    {
      id: 'bk-4',
      isbn: '978-0486687353',
      title: 'Calculus Made Easy',
      author: 'Silvanus P. Thompson',
      category: 'Mathematics',
      shelfLocation: 'Rack MATH-08',
      totalCopies: 10,
      availableCopies: 4,
      price: 22.0,
    },
    {
      id: 'bk-5',
      isbn: '978-0062316097',
      title: 'Sapiens: A Brief History of Humankind',
      author: 'Yuval Noah Harari',
      category: 'History',
      shelfLocation: 'Rack HIST-03',
      totalCopies: 6,
      availableCopies: 3,
      price: 28.0,
    },
  ]);

  // Initial Issues
  const [issues, setIssues] = useState<BookIssueRecord[]>([
    {
      id: 'iss-1',
      bookId: 'bk-1',
      bookTitle: 'Effective Java (3rd Edition)',
      isbn: '978-0134685991',
      memberId: 'STD-1001',
      memberName: 'Alexander Hayes',
      memberType: 'Student',
      issueDate: '2025-05-10',
      dueDate: '2025-05-24',
      fineAmount: 0,
      status: 'Issued',
    },
    {
      id: 'iss-2',
      bookId: 'bk-3',
      bookTitle: 'Fundamentals of Physics',
      isbn: '978-1118230725',
      memberId: 'STD-1003',
      memberName: 'Liam Sterling',
      memberType: 'Student',
      issueDate: '2025-04-20',
      dueDate: '2025-05-04',
      fineAmount: 14.0,
      status: 'Overdue',
    },
    {
      id: 'iss-3',
      bookId: 'bk-2',
      bookTitle: 'The Great Gatsby',
      isbn: '978-0199535569',
      memberId: 'EMP-005',
      memberName: 'Prof. Elizabeth Warren',
      memberType: 'Staff',
      issueDate: '2025-05-01',
      dueDate: '2025-05-15',
      returnDate: '2025-05-14',
      fineAmount: 0,
      status: 'Returned',
    },
  ]);

  // Modals
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);

  // New Book Form
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newIsbn, setNewIsbn] = useState('');
  const [newCategory, setNewCategory] = useState<Book['category']>('Science');
  const [newShelf, setNewShelf] = useState('');
  const [newCopies, setNewCopies] = useState(5);
  const [newPrice, setNewPrice] = useState(25);

  // Issue Form
  const [issueBookId, setIssueBookId] = useState('');
  const [issueMemberId, setIssueMemberId] = useState('');
  const [issueDueDate, setIssueDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });

  const handleAddBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newAuthor.trim()) return;

    const newBk: Book = {
      id: `bk-${Date.now()}`,
      title: newTitle.trim(),
      author: newAuthor.trim(),
      isbn: newIsbn.trim() || `978-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      category: newCategory,
      shelfLocation: newShelf.trim() || 'Rack GEN-01',
      totalCopies: Number(newCopies),
      availableCopies: Number(newCopies),
      price: Number(newPrice),
    };

    setBooks([newBk, ...books]);
    setShowAddBookModal(false);
    onShowToast?.('success', 'Book Cataloged', `"${newBk.title}" added to library inventory.`);
    setNewTitle('');
    setNewAuthor('');
    setNewIsbn('');
  };

  const handleIssueBook = (e: React.FormEvent) => {
    e.preventDefault();
    const book = books.find((b) => b.id === issueBookId);
    if (!book || book.availableCopies <= 0) {
      onShowToast?.('error', 'Book Unavailable', 'No available copies for checkout.');
      return;
    }

    const memberStudent = students.find((s) => s.admissionNo === issueMemberId || s.id === issueMemberId);
    const memberName = memberStudent ? memberStudent.fullName : `Member (${issueMemberId})`;

    const newIssue: BookIssueRecord = {
      id: `iss-${Date.now()}`,
      bookId: book.id,
      bookTitle: book.title,
      isbn: book.isbn,
      memberId: issueMemberId,
      memberName,
      memberType: 'Student',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: issueDueDate,
      fineAmount: 0,
      status: 'Issued',
    };

    setIssues([newIssue, ...issues]);
    // decrement copies
    setBooks(books.map((b) => (b.id === book.id ? { ...b, availableCopies: b.availableCopies - 1 } : b)));
    setShowIssueModal(false);
    onShowToast?.('success', 'Book Checked Out', `Issued "${book.title}" to ${memberName}.`);
  };

  const handleReturnBook = (issueId: string) => {
    const issue = issues.find((i) => i.id === issueId);
    if (!issue) return;

    setIssues(
      issues.map((i) =>
        i.id === issueId
          ? {
              ...i,
              status: 'Returned',
              returnDate: new Date().toISOString().split('T')[0],
            }
          : i
      )
    );

    // increment copy
    setBooks(
      books.map((b) => (b.id === issue.bookId ? { ...b, availableCopies: b.availableCopies + 1 } : b))
    );

    onShowToast?.('success', 'Book Returned', `Marked "${issue.bookTitle}" returned into shelf circulation.`);
  };

  const handleExportCatalog = () => {
    if (onExportToSheet) {
      onExportToSheet(
        'Library Books Catalog',
        ['ISBN', 'Title', 'Author', 'Category', 'Shelf Location', 'Total Copies', 'Available', 'Unit Price ($)'],
        books.map((b) => [b.isbn, b.title, b.author, b.category, b.shelfLocation, b.totalCopies, b.availableCopies, b.price])
      );
    }
  };

  const filteredBooks = books.filter((b) => {
    const matchesSearch =
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.isbn.includes(searchQuery);
    const matchesCat = categoryFilter === 'all' || b.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/20 border border-slate-200 dark:border-slate-800 backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider">
            <Library className="w-4 h-4" />
            <span>Digital Library &amp; Resource Center</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            Library Catalog &amp; Book Circulation
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage physical and digital repository, barcode check-in/out, student member cards, and overdue fines.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowIssueModal(true)}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <BookmarkCheck className="w-4 h-4" />
            <span>Issue Book</span>
          </button>
          <button
            onClick={() => setShowAddBookModal(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Title</span>
          </button>
          {onExportToSheet && (
            <button
              onClick={handleExportCatalog}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5 hover:bg-slate-50 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              <span>Export Sheet</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-400">Total Catalog Titles</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{books.length}</div>
          <div className="text-[10px] text-indigo-500 font-medium mt-1">Across 7 disciplines</div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-400">Physical Copies</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {books.reduce((acc, b) => acc + b.totalCopies, 0)}
          </div>
          <div className="text-[10px] text-emerald-500 font-medium mt-1">
            {books.reduce((acc, b) => acc + b.availableCopies, 0)} available on shelves
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-400">Active Checkouts</div>
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
            {issues.filter((i) => i.status === 'Issued' || i.status === 'Overdue').length}
          </div>
          <div className="text-[10px] text-slate-400 font-medium mt-1">Circulating to students &amp; staff</div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-400">Overdue Fines Due</div>
          <div className="text-2xl font-bold text-rose-500 mt-1">
            ${issues.reduce((acc, i) => acc + (i.fineAmount || 0), 0).toFixed(2)}
          </div>
          <div className="text-[10px] text-rose-400 font-medium mt-1">Automated fine calculation</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`py-3 px-1 border-b-2 transition-all ${
            activeTab === 'catalog'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Book Catalog ({books.length})
        </button>
        <button
          onClick={() => setActiveTab('issues')}
          className={`py-3 px-1 border-b-2 transition-all ${
            activeTab === 'issues'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Circulation &amp; Issues ({issues.length})
        </button>
      </div>

      {/* TAB 1: CATALOG */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search title, author, or ISBN..."
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none focus:border-indigo-500"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none"
            >
              <option value="all">All Categories</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Literature">Literature</option>
              <option value="Science">Science</option>
              <option value="Mathematics">Mathematics</option>
              <option value="History">History</option>
            </select>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3.5">ISBN &amp; Title</th>
                  <th className="p-3.5">Author</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Shelf Location</th>
                  <th className="p-3.5">Available / Total</th>
                  <th className="p-3.5">Unit Price</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredBooks.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900 dark:text-white">{b.title}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{b.isbn}</div>
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-300">{b.author}</td>
                    <td className="p-3.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                        {b.category}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-[11px] text-slate-500">{b.shelfLocation}</td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className={b.availableCopies > 0 ? 'text-emerald-500' : 'text-rose-500'}>
                          {b.availableCopies}
                        </span>
                        <span className="text-slate-400">/ {b.totalCopies}</span>
                      </div>
                    </td>
                    <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-200">${b.price.toFixed(2)}</td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => {
                          setIssueBookId(b.id);
                          setShowIssueModal(true);
                        }}
                        disabled={b.availableCopies <= 0}
                        className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 text-[11px] font-semibold disabled:opacity-40"
                      >
                        Issue Copy
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: CIRCULATION & ISSUES */}
      {activeTab === 'issues' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3.5">Book Title &amp; ISBN</th>
                <th className="p-3.5">Member Name</th>
                <th className="p-3.5">Issue Date</th>
                <th className="p-3.5">Due Date</th>
                <th className="p-3.5">Fine Amount</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Return Book</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {issues.map((i) => (
                <tr key={i.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="p-3.5">
                    <div className="font-bold text-slate-900 dark:text-white">{i.bookTitle}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{i.isbn}</div>
                  </td>
                  <td className="p-3.5">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">{i.memberName}</div>
                    <div className="text-[10px] text-slate-400">ID: {i.memberId} ({i.memberType})</div>
                  </td>
                  <td className="p-3.5 text-slate-600 dark:text-slate-400">{i.issueDate}</td>
                  <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-200">{i.dueDate}</td>
                  <td className="p-3.5">
                    {i.fineAmount > 0 ? (
                      <span className="font-bold text-rose-500">${i.fineAmount.toFixed(2)}</span>
                    ) : (
                      <span className="text-slate-400">$0.00</span>
                    )}
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        i.status === 'Returned'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : i.status === 'Overdue'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                      }`}
                    >
                      {i.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    {i.status !== 'Returned' && (
                      <button
                        onClick={() => handleReturnBook(i.id)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold flex items-center gap-1 ml-auto"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Check In</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ADD BOOK MODAL */}
      {showAddBookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-500" />
                <span>Catalog New Book</span>
              </h3>
              <button onClick={() => setShowAddBookModal(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddBook} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Book Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Introduction to Algorithms"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Author</label>
                  <input
                    type="text"
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    placeholder="Author name"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">ISBN Number</label>
                  <input
                    type="text"
                    value={newIsbn}
                    onChange={(e) => setNewIsbn(e.target.value)}
                    placeholder="978-XXXXXXXXXX"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as Book['category'])}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Science">Science</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Literature">Literature</option>
                    <option value="History">History</option>
                    <option value="Reference">Reference</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Shelf Location</label>
                  <input
                    type="text"
                    value={newShelf}
                    onChange={(e) => setNewShelf(e.target.value)}
                    placeholder="e.g. Rack CS-05"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Initial Copies</label>
                  <input
                    type="number"
                    min={1}
                    value={newCopies}
                    onChange={(e) => setNewCopies(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Replacement Price ($)</label>
                  <input
                    type="number"
                    min={0}
                    value={newPrice}
                    onChange={(e) => setNewPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs mt-2"
              >
                Save to Library Catalog
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ISSUE BOOK MODAL */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <BookmarkCheck className="w-4 h-4 text-indigo-500" />
                <span>Issue Book Checkout</span>
              </h3>
              <button onClick={() => setShowIssueModal(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleIssueBook} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Select Book Title</label>
                <select
                  value={issueBookId}
                  onChange={(e) => setIssueBookId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
                >
                  <option value="">-- Choose Book from Inventory --</option>
                  {books.map((b) => (
                    <option key={b.id} value={b.id} disabled={b.availableCopies <= 0}>
                      {b.title} ({b.availableCopies} available)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Student / Staff ID</label>
                <input
                  type="text"
                  value={issueMemberId}
                  onChange={(e) => setIssueMemberId(e.target.value)}
                  placeholder="e.g. STD-1001 or EMP-005"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Due Date</label>
                <input
                  type="date"
                  value={issueDueDate}
                  onChange={(e) => setIssueDueDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs mt-2"
              >
                Complete Book Issue
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
