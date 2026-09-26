import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  fetchNotices,
  createNotice,
  updateNotice,
  deleteNotice,
  fetchArchivedNotices,
  archiveNoticeById,
  restoreNoticeById,
} from '../../../api/noticeApi';
import toast from 'react-hot-toast';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  FileText,
  Calendar,
  Plus,
  AlertCircle,
  Clock,
  X,
  Edit2,
  Trash2,
  Archive,
  ArchiveRestore,
  Bell,
  Timer,
  Info,
  UploadCloud,
  Paperclip,
  FileDown,
  ExternalLink,
} from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────────────────────────

const getCategoryStyles = (category) => {
  switch (category) {
    case 'Urgent':
      return 'bg-red-50 text-red-700 border-red-100';
    case 'Placement':
      return 'bg-brand-blue-light text-brand-blue border-brand-blue-light';
    case 'General':
      return 'bg-green-50 text-green-700 border-green-100';
    default:
      return 'bg-neutral-100 text-neutral-700 border-neutral-200';
  }
};

const formatDate = (dateString) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * How many days remain until permanent deletion (60 days from archivedAt).
 * Returns an object: { days, isUrgent }
 */
const getDaysUntilDeletion = (archivedAt) => {
  if (!archivedAt) return { days: 60, isUrgent: false };
  const archived = new Date(archivedAt);
  const deleteDate = new Date(archived);
  deleteDate.setDate(deleteDate.getDate() + 60);
  const now = new Date();
  const diffMs = deleteDate - now;
  const days = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  return { days, isUrgent: days <= 10 };
};

// ── Animation Variants ────────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 },
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.96, y: 12 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 22 } },
  exit:   { opacity: 0, scale: 0.94, y: -8, transition: { duration: 0.18 } },
};

// ── Skeleton Rows ─────────────────────────────────────────────────────────────

const SkeletonRows = () =>
  [...Array(5)].map((_, i) => (
    <motion.tr
      key={`sk-${i}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="animate-pulse"
    >
      <td className="px-8 py-6">
        <div className="h-4 w-64 bg-neutral-100 rounded-full mb-3" />
        <div className="h-3 w-40 bg-neutral-50 rounded-full" />
      </td>
      <td className="px-6 py-6"><div className="h-7 w-24 bg-neutral-100 rounded-xl" /></td>
      <td className="px-6 py-6"><div className="h-4 w-32 bg-neutral-100 rounded-full" /></td>
      <td className="px-6 py-6"><div className="h-7 w-20 bg-neutral-100 rounded-xl" /></td>
      <td className="px-8 py-6"><div className="h-10 w-28 bg-neutral-100 rounded-xl ml-auto" /></td>
    </motion.tr>
  ));

// ── Archive Card Skeleton ─────────────────────────────────────────────────────

const ArchiveCardSkeleton = () =>
  [...Array(6)].map((_, i) => (
    <div key={`arch-sk-${i}`} className="bg-white rounded-2xl border border-neutral-200 p-6 animate-pulse space-y-4">
      <div className="flex justify-between items-start">
        <div className="h-5 w-20 bg-neutral-100 rounded-full" />
        <div className="h-6 w-24 bg-neutral-100 rounded-xl" />
      </div>
      <div className="h-5 w-3/4 bg-neutral-100 rounded-full" />
      <div className="space-y-2">
        <div className="h-3 w-full bg-neutral-50 rounded-full" />
        <div className="h-3 w-4/5 bg-neutral-50 rounded-full" />
      </div>
      <div className="h-10 w-full bg-neutral-100 rounded-xl" />
    </div>
  ));

// ═════════════════════════════════════════════════════════════════════════════
//  Main Component
// ═════════════════════════════════════════════════════════════════════════════

const AdminNoticesPage = () => {
  // ── Active Tab State ─────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'archive'

  // ── Active Notices State ──────────────────────────────────────────────────
  const [notices, setNotices]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [page, setPage]               = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [totalCount, setTotalCount]   = useState(0);
  const [limit]                       = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter]   = useState('');

  // ── Archived Notices State ────────────────────────────────────────────────
  const [archived, setArchived]               = useState([]);
  const [archiveLoading, setArchiveLoading]   = useState(false);
  const [archiveError, setArchiveError]       = useState('');
  const [archivePage, setArchivePage]         = useState(1);
  const [archiveTotalPages, setArchiveTotalPages] = useState(1);
  const [archiveTotalCount, setArchiveTotalCount] = useState(0);
  const [archiveLimit]                        = useState(12);
  const [archiveSearch, setArchiveSearch]     = useState('');
  const [debouncedArchiveSearch, setDebouncedArchiveSearch] = useState('');
  const [archiveCategory, setArchiveCategory] = useState('');

  // ── Modal / Form State ────────────────────────────────────────────────────
  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [modalMode, setModalMode]       = useState('create');
  const [editingId, setEditingId]       = useState(null);
  const [formData, setFormData]         = useState({ title: '', category: 'General', body: '', noticePdf: null });
  const [existingPdf, setExistingPdf]   = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef                    = useRef(null);

  // ── Confirm Dialogs ───────────────────────────────────────────────────────
  const [showDeleteConfirm, setShowDeleteConfirm]   = useState(false);
  const [deletingId, setDeletingId]                 = useState(null);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [archivingId, setArchivingId]               = useState(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [restoringId, setRestoringId]               = useState(null);

  // ── Debounce: Active Notices Search ──────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ── Debounce: Archive Search ──────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedArchiveSearch(archiveSearch);
      setArchivePage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [archiveSearch]);

  // ── Load Active Notices ───────────────────────────────────────────────────
  const loadNotices = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetchNotices({
        page,
        limit,
        search: debouncedSearch || undefined,
        category: categoryFilter || undefined,
      });
      if (response.success) {
        setNotices(response.data.notices);
        setTotalPages(response.data.pages);
        setTotalCount(response.data.total);
      } else {
        setError(response.message || 'Failed to fetch notices.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while fetching notices.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, categoryFilter]);

  useEffect(() => { loadNotices(); }, [loadNotices]);

  // ── Load Archived Notices ─────────────────────────────────────────────────
  const loadArchived = useCallback(async () => {
    try {
      setArchiveLoading(true);
      setArchiveError('');
      const response = await fetchArchivedNotices({
        page: archivePage,
        limit: archiveLimit,
        search: debouncedArchiveSearch || undefined,
        category: archiveCategory || undefined,
      });
      if (response.success) {
        setArchived(response.data.notices);
        setArchiveTotalPages(response.data.pages);
        setArchiveTotalCount(response.data.total);
      } else {
        setArchiveError(response.message || 'Failed to fetch archived notices.');
      }
    } catch (err) {
      setArchiveError(err.response?.data?.message || 'An error occurred.');
    } finally {
      setArchiveLoading(false);
    }
  }, [archivePage, archiveLimit, debouncedArchiveSearch, archiveCategory]);

  useEffect(() => {
    if (activeTab === 'archive') loadArchived();
  }, [activeTab, loadArchived]);

  // ── Modal Handlers ────────────────────────────────────────────────────────
  const handleOpenModal = (mode, notice = null) => {
    setModalMode(mode);
    if (mode === 'edit' && notice) {
      setEditingId(notice._id);
      setFormData({ title: notice.title, category: notice.category, body: notice.body || '', noticePdf: null, removePdf: false });
      setExistingPdf(notice.attachmentUrl || null);
    } else {
      setEditingId(null);
      setFormData({ title: '', category: 'General', body: '', noticePdf: null, removePdf: false });
      setExistingPdf(null);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({ title: '', category: 'General', body: '', noticePdf: null, removePdf: false });
    setExistingPdf(null);
    setEditingId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.category || !formData.body.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    try {
      setIsSubmitting(true);
      if (modalMode === 'create') {
        await createNotice(formData);
        toast.success('Notice published successfully');
      } else {
        await updateNotice(editingId, formData);
        toast.success('Notice updated successfully');
      }
      handleCloseModal();
      loadNotices();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save notice');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Delete Handlers ───────────────────────────────────────────────────────
  const confirmDelete = async () => {
    try {
      setIsSubmitting(true);
      await deleteNotice(deletingId);
      toast.success('Notice deleted');
      setShowDeleteConfirm(false);
      setDeletingId(null);
      loadNotices();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete notice');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Archive Handlers ──────────────────────────────────────────────────────
  const confirmArchive = async () => {
    try {
      setIsSubmitting(true);
      await archiveNoticeById(archivingId);
      toast.success('Notice archived — removed from student dashboard');
      setShowArchiveConfirm(false);
      setArchivingId(null);
      loadNotices();
      // Refresh archive count badge
      if (activeTab === 'archive') loadArchived();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to archive notice');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Restore Handlers ──────────────────────────────────────────────────────
  const confirmRestore = async () => {
    try {
      setIsSubmitting(true);
      await restoreNoticeById(restoringId);
      toast.success('Notice restored — now visible on student dashboard');
      setShowRestoreConfirm(false);
      setRestoringId(null);
      loadArchived();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to restore notice');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Tab Switch ────────────────────────────────────────────────────────────
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'archive') loadArchived();
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="max-w-7xl mx-auto space-y-8"
    >
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">Notice Board</h1>
          <p className="text-neutral-500 mt-2 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Manage official announcements and placement alerts
          </p>
        </div>
        <button
          onClick={() => handleOpenModal('create')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-brand-orange text-white rounded-2xl hover:bg-brand-orange/90 transition-all duration-300 font-semibold shadow-lg shadow-brand-orange/20 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Create New Notice
        </button>
      </div>

      {/* ── Tab Switcher ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-2xl w-fit">
        <button
          onClick={() => handleTabChange('active')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
            activeTab === 'active'
              ? 'bg-white text-neutral-900 shadow-sm'
              : 'text-neutral-500 hover:text-neutral-700'
          }`}
        >
          <Bell className="w-4 h-4" />
          Active Notices
          {totalCount > 0 && (
            <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === 'active' ? 'bg-brand-orange text-white' : 'bg-neutral-200 text-neutral-600'
            }`}>
              {totalCount}
            </span>
          )}
        </button>
        <button
          onClick={() => handleTabChange('archive')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
            activeTab === 'archive'
              ? 'bg-white text-neutral-900 shadow-sm'
              : 'text-neutral-500 hover:text-neutral-700'
          }`}
        >
          <Archive className="w-4 h-4" />
          Archive
          {archiveTotalCount > 0 && (
            <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === 'archive' ? 'bg-amber-500 text-white' : 'bg-neutral-200 text-neutral-600'
            }`}>
              {archiveTotalCount}
            </span>
          )}
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          ACTIVE NOTICES TAB
      ══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence mode="wait">
        {activeTab === 'active' && (
          <motion.div
            key="active-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Control Bar */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-8 relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by title or content..."
                  className="block w-full pl-12 pr-4 py-3.5 bg-white border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange transition-all outline-none shadow-sm placeholder:text-neutral-400"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="md:col-span-4 relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Filter className="h-5 w-5 text-neutral-400" />
                </div>
                <select
                  className="block w-full pl-12 pr-10 py-3.5 bg-white border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange transition-all outline-none shadow-sm appearance-none cursor-pointer"
                  value={categoryFilter}
                  onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                >
                  <option value="">All Categories</option>
                  <option value="Urgent">Urgent Priority</option>
                  <option value="Placement">Placement Drive</option>
                  <option value="General">General Notice</option>
                </select>
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                  <ChevronRight className="h-4 w-4 text-neutral-400 rotate-90" />
                </div>
              </div>
            </div>

            {/* Info banner: archive policy */}
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-2xl text-blue-700 text-sm">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-500" />
              <p>
                <span className="font-bold">Auto-archive policy:</span> Notices are automatically archived after{' '}
                <span className="font-bold">30 days</span> and permanently deleted{' '}
                <span className="font-bold">60 days</span> after archiving. You can also archive any notice manually.
              </p>
            </div>

            {/* Notices Table */}
            <div className="bg-white rounded-3xl shadow-xl shadow-neutral-200/50 border border-neutral-100 overflow-hidden">
              {error && (
                <div className="p-4 bg-red-50 border-b border-red-100 flex items-center gap-3 text-red-600">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">{error}</span>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-neutral-50/50">
                      <th className="px-8 py-5 text-left text-xs font-bold text-neutral-500 uppercase tracking-widest border-b border-neutral-100">Announcement Details</th>
                      <th className="px-6 py-5 text-left text-xs font-bold text-neutral-500 uppercase tracking-widest border-b border-neutral-100">Category</th>
                      <th className="px-6 py-5 text-left text-xs font-bold text-neutral-500 uppercase tracking-widest border-b border-neutral-100">Date Published</th>
                      <th className="px-6 py-5 text-left text-xs font-bold text-neutral-500 uppercase tracking-widest border-b border-neutral-100">Status</th>
                      <th className="px-8 py-5 text-right text-xs font-bold text-neutral-500 uppercase tracking-widest border-b border-neutral-100">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    <AnimatePresence mode="wait">
                      {loading ? (
                        <SkeletonRows />
                      ) : notices.length > 0 ? (
                        notices.map((notice) => (
                          <motion.tr
                            key={notice._id}
                            variants={itemVariants}
                            className="group hover:bg-neutral-50/80 transition-all duration-300"
                          >
                            <td className="px-8 py-6">
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-neutral-900 group-hover:text-brand-blue transition-colors leading-relaxed flex items-center gap-2">
                                  {notice.title}
                                  {notice.attachmentUrl && <Paperclip className="w-4 h-4 text-neutral-400" title="Has attachment" />}
                                </span>
                                <span className="text-xs text-neutral-500 mt-1.5 flex items-center gap-1.5 font-medium">
                                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
                                  Posted by {notice.postedBy?.fullName || 'Academic Office'}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-6">
                              <span className={`px-3.5 py-1.5 inline-flex text-[11px] font-bold rounded-xl border ${getCategoryStyles(notice.category)} uppercase tracking-wider`}>
                                {notice.category}
                              </span>
                            </td>
                            <td className="px-6 py-6">
                              <div className="flex items-center gap-2 text-sm text-neutral-600 font-medium">
                                <Calendar className="w-4 h-4 text-neutral-400" />
                                {formatDate(notice.createdAt)}
                              </div>
                            </td>
                            <td className="px-6 py-6">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${notice.isActive !== false ? 'bg-green-500 shadow-lg shadow-green-200' : 'bg-neutral-300'}`} />
                                <span className={`text-xs font-bold uppercase tracking-widest ${notice.isActive !== false ? 'text-green-700' : 'text-neutral-500'}`}>
                                  {notice.isActive !== false ? 'Live' : 'Hidden'}
                                </span>
                              </div>
                            </td>
                            <td className="px-8 py-6 text-right">
                              <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <button
                                  onClick={() => handleOpenModal('edit', notice)}
                                  className="p-2.5 text-brand-blue hover:bg-brand-blue-light rounded-xl transition-all"
                                  title="Edit Notice"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => { setArchivingId(notice._id); setShowArchiveConfirm(true); }}
                                  className="p-2.5 text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                                  title="Archive Notice"
                                >
                                  <Archive className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => { setDeletingId(notice._id); setShowDeleteConfirm(true); }}
                                  className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                  title="Delete Notice"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                        ))
                      ) : (
                        <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          <td colSpan="5" className="px-8 py-24 text-center">
                            <div className="flex flex-col items-center justify-center max-w-md mx-auto">
                              <motion.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                                className="w-24 h-24 bg-brand-blue/5 rounded-[2rem] flex items-center justify-center mb-6 relative overflow-hidden"
                              >
                                <div className="absolute inset-0 bg-gradient-to-tr from-brand-blue/10 to-transparent" />
                                <FileText className="h-10 w-10 text-brand-blue relative z-10" />
                              </motion.div>
                              <h3 className="text-2xl font-bold text-neutral-900 mb-2">No Notices Displayed</h3>
                              <p className="text-neutral-500 text-sm leading-relaxed">
                                There are currently no announcements matching your filters.
                              </p>
                              {(searchQuery || categoryFilter) && (
                                <button
                                  onClick={() => { setSearchQuery(''); setCategoryFilter(''); }}
                                  className="mt-6 px-6 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-sm font-semibold rounded-xl transition-colors"
                                >
                                  Clear Filters
                                </button>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      )}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>

              {/* Active Notices Pagination */}
              {!loading && notices.length > 0 && (
                <div className="px-8 py-6 bg-neutral-50/30 border-t border-neutral-100 flex items-center justify-between">
                  <p className="text-sm font-medium text-neutral-500">
                    Showing <span className="text-neutral-900 font-bold">{(page - 1) * limit + 1}</span> to{' '}
                    <span className="text-neutral-900 font-bold">{Math.min(page * limit, totalCount)}</span> of{' '}
                    <span className="text-neutral-900 font-bold">{totalCount}</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-2 rounded-xl border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-1">
                      {[...Array(totalPages)].map((_, i) => (
                        <button
                          key={i + 1}
                          onClick={() => setPage(i + 1)}
                          className={`min-w-[40px] h-10 rounded-xl text-sm font-bold transition-all shadow-sm ${
                            page === i + 1
                              ? 'bg-brand-blue text-white shadow-brand-blue/20'
                              : 'bg-white border border-neutral-200 text-neutral-600 hover:border-brand-blue/30 hover:text-brand-blue'
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages || totalPages === 0}
                      className="p-2 rounded-xl border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            ARCHIVE TAB
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'archive' && (
          <motion.div
            key="archive-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Archive Info Banner */}
            <div className="flex items-start gap-4 p-5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl">
              <div className="h-10 w-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Archive className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-amber-900 mb-1">Notice Archive</p>
                <p className="text-sm text-amber-700 leading-relaxed">
                  Archived notices are hidden from the student dashboard. Notices are auto-archived after{' '}
                  <span className="font-bold">30 days</span> and permanently deleted{' '}
                  <span className="font-bold">60 days</span> after archiving. You can restore any notice to make it
                  visible to students again.
                </p>
              </div>
            </div>

            {/* Archive Search & Filter */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-8 relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search archived notices..."
                  className="block w-full pl-12 pr-4 py-3.5 bg-white border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-all outline-none shadow-sm placeholder:text-neutral-400"
                  value={archiveSearch}
                  onChange={(e) => setArchiveSearch(e.target.value)}
                />
              </div>
              <div className="md:col-span-4 relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Filter className="h-5 w-5 text-neutral-400" />
                </div>
                <select
                  className="block w-full pl-12 pr-10 py-3.5 bg-white border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-all outline-none shadow-sm appearance-none cursor-pointer"
                  value={archiveCategory}
                  onChange={(e) => { setArchiveCategory(e.target.value); setArchivePage(1); }}
                >
                  <option value="">All Categories</option>
                  <option value="Urgent">Urgent Priority</option>
                  <option value="Placement">Placement Drive</option>
                  <option value="General">General Notice</option>
                </select>
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                  <ChevronRight className="h-4 w-4 text-neutral-400 rotate-90" />
                </div>
              </div>
            </div>

            {/* Archive Error */}
            {archiveError && (
              <div className="p-4 bg-red-50 border border-red-100 flex items-center gap-3 text-red-600 rounded-2xl">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm font-medium">{archiveError}</span>
              </div>
            )}

            {/* Archive Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              <AnimatePresence mode="popLayout">
                {archiveLoading ? (
                  <ArchiveCardSkeleton />
                ) : archived.length > 0 ? (
                  archived.map((notice) => {
                    const { days, isUrgent } = getDaysUntilDeletion(notice.archivedAt);
                    return (
                      <motion.div
                        key={notice._id}
                        layout
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="bg-white rounded-2xl border border-neutral-200 p-6 flex flex-col gap-4 hover:shadow-lg hover:border-amber-200 transition-all group"
                      >
                        {/* Card Header */}
                        <div className="flex items-start justify-between gap-3">
                          <span className={`px-3 py-1 rounded-xl text-[11px] font-bold border ${getCategoryStyles(notice.category)} uppercase tracking-wider`}>
                            {notice.category}
                          </span>
                          {/* Days until deletion badge */}
                          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border ${
                            isUrgent
                              ? 'bg-red-50 text-red-600 border-red-100 animate-pulse'
                              : days <= 20
                              ? 'bg-amber-50 text-amber-700 border-amber-100'
                              : 'bg-neutral-50 text-neutral-500 border-neutral-200'
                          }`}>
                            <Timer className="w-3 h-3" />
                            {days === 0 ? 'Deletes today' : `Deletes in ${days}d`}
                          </div>
                        </div>

                        {/* Title */}
                        <h3 className="text-sm font-bold text-neutral-900 line-clamp-2 leading-snug group-hover:text-amber-700 transition-colors">
                          {notice.title}
                        </h3>

                        {/* Body preview */}
                        <p className="text-xs text-neutral-500 line-clamp-3 leading-relaxed flex-1">
                          {notice.body}
                        </p>

                        {/* Dates */}
                        <div className="space-y-1.5 pt-2 border-t border-neutral-100">
                          <div className="flex items-center justify-between text-[11px] text-neutral-400 font-medium">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Posted
                            </span>
                            <span className="text-neutral-600 font-semibold">{formatDate(notice.createdAt)}</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-neutral-400 font-medium">
                            <span className="flex items-center gap-1">
                              <Archive className="w-3 h-3" />
                              Archived
                            </span>
                            <span className="text-amber-600 font-semibold">{formatDate(notice.archivedAt)}</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-neutral-400 font-medium">
                            <span className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
                              By
                            </span>
                            <span className="text-neutral-600 font-semibold truncate max-w-[120px]">
                              {notice.postedBy?.fullName || 'Admin'}
                            </span>
                          </div>
                        </div>

                        {/* Restore Button */}
                        <button
                          onClick={() => { setRestoringId(notice._id); setShowRestoreConfirm(true); }}
                          className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold text-sm rounded-xl transition-all border border-amber-100 hover:border-amber-200 active:scale-95"
                        >
                          <ArchiveRestore className="w-4 h-4" />
                          Restore to Active
                        </button>
                      </motion.div>
                    );
                  })
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="col-span-full py-24 text-center"
                  >
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                      <div className="w-24 h-24 bg-amber-50 rounded-[2rem] flex items-center justify-center mb-6">
                        <Archive className="h-10 w-10 text-amber-300" />
                      </div>
                      <h3 className="text-xl font-bold text-neutral-900 mb-2">Archive is Empty</h3>
                      <p className="text-neutral-500 text-sm leading-relaxed">
                        No notices have been archived yet. Notices are automatically archived after 30 days.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Archive Pagination */}
            {!archiveLoading && archived.length > 0 && archiveTotalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-neutral-500">
                  Showing <span className="text-neutral-900 font-bold">{(archivePage - 1) * archiveLimit + 1}</span> to{' '}
                  <span className="text-neutral-900 font-bold">{Math.min(archivePage * archiveLimit, archiveTotalCount)}</span> of{' '}
                  <span className="text-neutral-900 font-bold">{archiveTotalCount}</span>
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setArchivePage((p) => Math.max(1, p - 1))}
                    disabled={archivePage === 1}
                    className="p-2 rounded-xl border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="flex items-center gap-1">
                    {[...Array(archiveTotalPages)].map((_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => setArchivePage(i + 1)}
                        className={`min-w-[40px] h-10 rounded-xl text-sm font-bold transition-all ${
                          archivePage === i + 1
                            ? 'bg-amber-500 text-white shadow-lg shadow-amber-200'
                            : 'bg-white border border-neutral-200 text-neutral-600 hover:border-amber-300 hover:text-amber-600'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setArchivePage((p) => Math.min(archiveTotalPages, p + 1))}
                    disabled={archivePage === archiveTotalPages}
                    className="p-2 rounded-xl border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════════
          NOTICE CREATE / EDIT MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="px-8 py-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
                <h2 className="text-xl font-bold text-neutral-900">
                  {modalMode === 'create' ? 'Draft New Notice' : 'Edit Notice'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-full transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto">
                <form id="noticeForm" onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      Notice Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter a clear, descriptive title"
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all outline-none appearance-none"
                      required
                    >
                      <option value="General">General</option>
                      <option value="Placement">Placement</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      Notice Content <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="body"
                      value={formData.body}
                      onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                      placeholder="Write the full details of the notice here..."
                      rows="6"
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all outline-none resize-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      Attachment (PDF)
                    </label>
                    <div className="flex flex-col gap-3">
                      <div className="relative">
                        <input
                          type="file"
                          accept=".pdf"
                          ref={fileInputRef}
                          onChange={(e) => setFormData(prev => ({ ...prev, noticePdf: e.target.files[0] }))}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className={`w-full px-4 py-4 border-2 border-dashed rounded-xl flex items-center justify-center gap-2 transition-all ${formData.noticePdf ? 'border-brand-blue bg-brand-blue/5 text-brand-blue' : 'border-neutral-200 bg-neutral-50 text-neutral-500 hover:bg-neutral-100 hover:border-brand-blue/30'}`}>
                          <UploadCloud className="w-5 h-5" />
                          <span className="font-semibold text-sm">
                            {formData.noticePdf ? formData.noticePdf.name : 'Click or drag PDF to upload'}
                          </span>
                        </div>
                      </div>
                      {existingPdf && !formData.noticePdf && (
                        <div className="flex items-center justify-between gap-2 text-sm text-neutral-600 bg-neutral-50 p-3 rounded-xl border border-neutral-200">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <FileText className="w-4 h-4 text-brand-blue shrink-0" />
                            <span className="truncate font-medium">Existing Attachment</span>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <a href={existingPdf} target="_blank" rel="noopener noreferrer" className="text-brand-blue font-bold hover:underline flex items-center gap-1">
                              View <ExternalLink className="w-3 h-3" />
                            </a>
                            <button
                              type="button"
                              onClick={() => {
                                setExistingPdf(null);
                                setFormData(prev => ({ ...prev, removePdf: true, noticePdf: null }));
                              }}
                              className="text-red-500 hover:text-red-700 font-bold flex items-center gap-1 hover:underline"
                            >
                              Remove <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </form>
              </div>

              <div className="px-8 py-6 border-t border-neutral-100 bg-neutral-50/50 flex justify-end gap-3 mt-auto">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-2.5 rounded-xl font-semibold text-neutral-600 hover:bg-neutral-200 transition-all"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="noticeForm"
                  className="px-6 py-2.5 rounded-xl font-semibold bg-brand-blue text-white hover:bg-brand-blue/90 shadow-lg shadow-brand-blue/20 transition-all flex items-center gap-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting && <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {modalMode === 'create' ? 'Publish Notice' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════════
          CONFIRM DIALOGS
      ══════════════════════════════════════════════════════════════════════ */}

      {/* Delete Confirm */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden p-8 text-center"
            >
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-2">Delete Notice?</h2>
              <p className="text-neutral-500 mb-8 leading-relaxed">
                This will hide the notice from students. It will not be moved to the archive.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeletingId(null); }}
                  className="px-6 py-3 rounded-xl font-semibold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 transition-all flex-1"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-6 py-3 rounded-xl font-semibold bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all flex-1 flex items-center justify-center gap-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Yes, Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Archive Confirm */}
      <AnimatePresence>
        {showArchiveConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden p-8 text-center"
            >
              <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Archive className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-2">Archive Notice?</h2>
              <p className="text-neutral-500 mb-2 leading-relaxed">
                This notice will be <span className="font-bold text-amber-700">immediately removed</span> from the student dashboard and moved to your Archive tab.
              </p>
              <p className="text-xs text-neutral-400 mb-8">
                It will be permanently deleted 60 days after archiving. You can restore it anytime before then.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => { setShowArchiveConfirm(false); setArchivingId(null); }}
                  className="px-6 py-3 rounded-xl font-semibold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 transition-all flex-1"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmArchive}
                  className="px-6 py-3 rounded-xl font-semibold bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-500/20 transition-all flex-1 flex items-center justify-center gap-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (
                    <><Archive className="w-4 h-4" /> Archive It</>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Restore Confirm */}
      <AnimatePresence>
        {showRestoreConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden p-8 text-center"
            >
              <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <ArchiveRestore className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-2">Restore Notice?</h2>
              <p className="text-neutral-500 mb-8 leading-relaxed">
                This notice will be <span className="font-bold text-green-700">immediately restored</span> and become visible on the student dashboard again.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => { setShowRestoreConfirm(false); setRestoringId(null); }}
                  className="px-6 py-3 rounded-xl font-semibold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 transition-all flex-1"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRestore}
                  className="px-6 py-3 rounded-xl font-semibold bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/20 transition-all flex-1 flex items-center justify-center gap-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (
                    <><ArchiveRestore className="w-4 h-4" /> Yes, Restore</>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdminNoticesPage;
