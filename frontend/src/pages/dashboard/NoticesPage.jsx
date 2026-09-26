import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  Search, 
  Filter, 
  FileDown, 
  Calendar, 
  User, 
  X, 
  ChevronLeft, 
  ChevronRight,
  ExternalLink,
  Download,
  Inbox
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { getNotices, getNoticeById, clearCurrentNotice, markNoticeAsRead, fetchReadNotices } from '../../features/notices/noticeSlice';
import { downloadRemoteFile } from '../../utils/exportUtils';

const categoryStyles = {
  Urgent:    { bg: 'bg-rose-50',    text: 'text-rose-600',    dot: 'bg-rose-500',   border: 'border-rose-100' },
  Placement: { bg: 'bg-brand-blue-light', text: 'text-brand-blue', dot: 'bg-brand-blue', border: 'border-brand-blue/10' },
  General:   { bg: 'bg-neutral-100', text: 'text-neutral-600', dot: 'bg-neutral-400', border: 'border-neutral-200' },
};

const CATEGORIES = ['All', 'Urgent', 'Placement', 'General'];

const NoticesPage = () => {
  const dispatch = useDispatch();
  const { notices, total, isLoading, currentNotice, readNotices } = useSelector((state) => state.notices);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [page, setPage] = useState(1);
  const limit = 6;

  useEffect(() => {
    const params = {
      page,
      limit,
    };
    if (activeCategory !== 'All') {
      params.category = activeCategory;
    }
    // Search is handled on frontend in this simple implementation, 
    // but the backend could be updated later for server-side search.
    dispatch(getNotices(params));
    dispatch(fetchReadNotices());
  }, [dispatch, page, activeCategory]);

  const filteredNotices = notices.filter(notice => 
    notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    notice.body.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(total / limit);

  const handleOpenNotice = (id) => {
    dispatch(getNoticeById(id));
    dispatch(markNoticeAsRead(id));
  };

  const handleCloseNotice = () => {
    dispatch(clearCurrentNotice());
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-neutral-900 tracking-tight flex items-center gap-3">
            <Bell className="h-8 w-8 text-brand-orange" />
            Notice Board
          </h1>
          <p className="text-neutral-500 mt-1">Official announcements and placement updates.</p>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-neutral-400 bg-white px-4 py-2 rounded-xl border border-neutral-200">
          <Inbox className="h-4 w-4" />
          <span>{total} Total Notices</span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl w-fit">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  activeCategory === cat
                    ? 'bg-white text-brand-blue shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search notices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Notices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {isLoading ? (
            // Skeleton Loaders
            [...Array(6)].map((_, i) => (
              <div key={`skeleton-${i}`} className="bg-white rounded-2xl border border-neutral-200 p-6 animate-pulse space-y-4">
                <div className="flex justify-between items-start">
                  <div className="h-4 w-20 bg-neutral-100 rounded" />
                  <div className="h-6 w-16 bg-neutral-100 rounded-full" />
                </div>
                <div className="h-6 w-3/4 bg-neutral-100 rounded" />
                <div className="space-y-2">
                  <div className="h-3 w-full bg-neutral-100 rounded" />
                  <div className="h-3 w-5/6 bg-neutral-100 rounded" />
                </div>
                <div className="h-10 w-full bg-neutral-100 rounded-xl pt-4" />
              </div>
            ))
          ) : filteredNotices.length > 0 ? (
            filteredNotices.map((notice) => {
              const style = categoryStyles[notice.category] || categoryStyles.General;
              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={notice._id}
                  onClick={() => handleOpenNotice(notice._id)}
                  className="relative bg-white rounded-2xl border border-neutral-200 p-6 hover:shadow-xl hover:border-brand-blue/30 transition-all cursor-pointer group flex flex-col"
                >
                  {/* Unread Badge */}
                  {!readNotices.includes(notice._id) && (
                    <div className="absolute -top-2 -right-2 px-2 py-1 bg-brand-orange text-white text-[9px] font-black rounded-lg shadow-lg shadow-brand-orange/20 animate-bounce">
                      NEW
                    </div>
                  )}
                  
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2 text-neutral-400">
                      <Calendar className="h-3.5 w-3.5" />
                      <span className="text-[11px] font-bold uppercase tracking-wider">
                        {new Date(notice.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${style.bg} ${style.text} border ${style.border}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                      {notice.category}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-neutral-900 group-hover:text-brand-blue transition-colors line-clamp-1 mb-2">
                    {notice.title}
                  </h3>
                  <p className="text-sm text-neutral-500 line-clamp-3 mb-6 flex-1">
                    {notice.body}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-neutral-100 mt-auto">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-brand-blue/10 flex items-center justify-center">
                        <User className="h-3 w-3 text-brand-blue" />
                      </div>
                      <span className="text-[11px] font-semibold text-neutral-600 truncate max-w-[100px]">
                        {notice.postedBy?.fullName || 'TPO Cell'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {notice.attachmentUrl && (
                        <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center" title="Attachment available">
                          <FileDown className="h-4 w-4" />
                        </div>
                      )}
                      <div className="h-8 w-8 rounded-lg bg-neutral-100 text-neutral-400 group-hover:bg-brand-blue group-hover:text-white flex items-center justify-center transition-all">
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="col-span-full py-20 text-center">
              <div className="h-20 w-20 bg-neutral-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <Inbox className="h-10 w-10 text-neutral-300" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900">No notices found</h3>
              <p className="text-neutral-500">Try adjusting your search or category filters.</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 pt-8">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="p-2 rounded-xl border border-neutral-200 bg-white disabled:opacity-40 hover:bg-neutral-50 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-1">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`h-10 w-10 rounded-xl text-sm font-bold transition-all ${
                  page === i + 1
                    ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/20'
                    : 'bg-white text-neutral-500 hover:bg-neutral-50 border border-neutral-200'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
            className="p-2 rounded-xl border border-neutral-200 bg-white disabled:opacity-40 hover:bg-neutral-50 transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Notice Detail Modal */}
      <AnimatePresence>
        {currentNotice && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseNotice}
              className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="px-8 py-6 border-b border-neutral-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${categoryStyles[currentNotice.category]?.bg || 'bg-neutral-100'}`}>
                    <Bell className={`h-5 w-5 ${categoryStyles[currentNotice.category]?.text || 'text-neutral-500'}`} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-neutral-900 tracking-tight">Notice Details</h2>
                    <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest">
                      {currentNotice.category} • {new Date(currentNotice.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCloseNotice}
                  className="p-2 rounded-full hover:bg-neutral-100 text-neutral-400 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="px-8 py-8 overflow-y-auto max-h-[60vh]">
                <h1 className="text-2xl font-extrabold text-neutral-900 mb-6 leading-tight">
                  {currentNotice.title}
                </h1>
                
                <div className="prose prose-neutral max-w-none text-neutral-600 leading-relaxed whitespace-pre-wrap">
                  {currentNotice.body}
                </div>

                {currentNotice.attachmentUrl && (
                  <div className="mt-10 p-6 rounded-2xl bg-neutral-50 border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-white shadow-sm border border-neutral-200 flex items-center justify-center flex-shrink-0">
                        <FileDown className="h-6 w-6 text-emerald-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-neutral-900 truncate">
                          {currentNotice.attachmentName || 'Attachment Document'}
                        </p>
                        <p className="text-xs text-neutral-400">PDF Document • Ready to view or download</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <a
                        href={currentNotice.attachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-100 text-sm font-bold rounded-xl transition-all flex items-center gap-2 shadow-sm"
                      >
                        <ExternalLink className="h-4 w-4" /> View
                      </a>
                      <button
                        type="button"
                        onClick={() => downloadRemoteFile(currentNotice.attachmentUrl, currentNotice.attachmentName || `${(currentNotice.title || 'Notice').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`)}
                        className="px-4 py-2 bg-brand-blue text-white text-sm font-bold rounded-xl hover:bg-brand-blue-dark transition-all flex items-center gap-2 shadow-md shadow-brand-blue/20"
                      >
                        <Download className="h-4 w-4" /> Download
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-8 py-5 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-white border border-neutral-200 flex items-center justify-center">
                    <User className="h-4 w-4 text-neutral-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-neutral-900 leading-none">
                      {currentNotice.postedBy?.fullName || 'TPO Administrator'}
                    </p>
                    <p className="text-[10px] text-neutral-400 font-medium mt-0.5">Posted by {currentNotice.postedBy?.role || 'Admin'}</p>
                  </div>
                </div>
                <button
                  onClick={handleCloseNotice}
                  className="px-6 py-2.5 text-sm font-bold text-neutral-500 hover:text-neutral-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NoticesPage;
