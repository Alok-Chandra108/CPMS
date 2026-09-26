import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchDrives, createDrive, updateDrive, deleteDrive } from '../../../api/driveApi';
import toast from 'react-hot-toast';
import {
  Search,
  Filter,
  ChevronRight,
  Briefcase,
  Calendar,
  Plus,
  AlertCircle,
  MoreVertical,
  ExternalLink,
  MapPin,
  IndianRupee,
  Building2,
  Edit2,
  Trash2,
  ChevronLeft,
  Users
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DriveModal from './components/DriveModal';
import DriveDetailsModal from './components/DriveDetailsModal';
import CompanyLogo from '../../../components/CompanyLogo';

const AdminDrivesPage = () => {
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [limit] = useState(10);

  // Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Delete Confirmation State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [currentDrive, setCurrentDrive] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Details Modal State
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [viewingDrive, setViewingDrive] = useState(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset to first page
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle status filter change
  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(1); // Reset to first page
  };

  const loadDrives = async () => {
    try {
      setLoading(true);
      setError('');

      const params = {
        page,
        limit,
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
      };

      const response = await fetchDrives(params);

      if (response.success) {

        setDrives(response.data.drives);
        setTotalPages(response.data.pages);
        setTotalCount(response.data.total);
      } else {
        setError(response.message || 'Failed to fetch drives.');
      }
    } catch (err) {
      console.error('Error fetching drives:', err);
      setError(err.response?.data?.message || 'An error occurred while fetching drives.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrives();
  }, [page, statusFilter, debouncedSearch]);

  const handleOpenModal = (mode, drive = null) => {
    setModalMode(mode);
    setCurrentDrive(drive);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentDrive(null);
  };

  const handleViewDetails = (drive) => {
    setViewingDrive(drive);
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetails = () => {
    setIsDetailsModalOpen(false);
    setTimeout(() => setViewingDrive(null), 300); // delay clear for exit animation
  };

  const handleDeleteRequest = (id) => {
    setDeletingId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      setIsSubmitting(true);
      await deleteDrive(deletingId);
      toast.success('Drive deleted successfully');
      setShowDeleteConfirm(false);
      setDeletingId(null);
      loadDrives(); // Refresh list
    } catch (err) {
      console.error('Error deleting drive:', err);
      toast.error(err.response?.data?.message || 'Failed to delete drive');
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeletingId(null);
  };

  const handleDriveSubmit = async (formData) => {
    try {
      setIsSubmitting(true);

      // Clean up: remove empty companyLogo so it defaults to null in DB
      const payload = { ...formData };
      if (!payload.companyLogo || (typeof payload.companyLogo === 'string' && payload.companyLogo.trim() === '')) {
        delete payload.companyLogo;
      }

      if (modalMode === 'create') {
        const result = await createDrive(payload);
        toast.success('Drive created successfully');
      } else {
        const result = await updateDrive(currentDrive._id, payload);
        toast.success('Drive updated successfully');
      }
      handleCloseModal();
      loadDrives(); // Refresh the list
    } catch (error) {
      console.error('Error saving drive:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to save drive.';
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };


  const getStatusStyles = (status) => {
    switch (status) {
      case 'open':
        return 'bg-green-50 text-green-700 border-green-100';
      case 'upcoming':
        return 'bg-brand-blue-light text-brand-blue border-brand-blue-light';
      case 'closed':
        return 'bg-neutral-100 text-neutral-600 border-neutral-200';
      default:
        return 'bg-neutral-100 text-neutral-700 border-neutral-200';
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="max-w-7xl mx-auto space-y-8"
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">Placement Drives</h1>
          <p className="text-neutral-500 mt-2 flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Manage campus recruitment opportunities
          </p>
        </div>
        <button
          onClick={() => handleOpenModal('create')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-brand-orange text-white rounded-2xl hover:bg-brand-orange/90 transition-all duration-300 font-semibold shadow-lg shadow-brand-orange/20 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Create New Drive
        </button>
      </div>

      {/* Control Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-8 relative">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-neutral-400" />
          </div>
          <input
            type="text"
            placeholder="Search by company or job role..."
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
            value={statusFilter}
            onChange={handleStatusChange}
          >
            <option value="">All Statuses</option>
            <option value="upcoming">Upcoming</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
            <ChevronRight className="h-4 w-4 text-neutral-400 rotate-90" />
          </div>
        </div>
      </div>

      {/* Main Content Card */}
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
                <th className="px-8 py-5 text-left text-xs font-bold text-neutral-500 uppercase tracking-widest border-b border-neutral-100">
                  Company
                </th>
                <th className="px-6 py-5 text-left text-xs font-bold text-neutral-500 uppercase tracking-widest border-b border-neutral-100">
                  Role & Package
                </th>
                <th className="px-6 py-5 text-left text-xs font-bold text-neutral-500 uppercase tracking-widest border-b border-neutral-100">
                  Deadline
                </th>
                <th className="px-6 py-5 text-left text-xs font-bold text-neutral-500 uppercase tracking-widest border-b border-neutral-100">
                  Status
                </th>
                <th className="px-8 py-5 text-right text-xs font-bold text-neutral-500 uppercase tracking-widest border-b border-neutral-100">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              <AnimatePresence mode="wait">
                {loading ? (
                  [...Array(5)].map((_, index) => (
                    <motion.tr
                      key={`skeleton-${index}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="animate-pulse"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-neutral-100"></div>
                          <div>
                            <div className="h-4 w-32 bg-neutral-100 rounded-full mb-2"></div>
                            <div className="h-3 w-20 bg-neutral-50 rounded-full"></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="h-4 w-40 bg-neutral-100 rounded-full mb-2"></div>
                        <div className="h-3 w-24 bg-neutral-50 rounded-full"></div>
                      </td>
                      <td className="px-6 py-6"><div className="h-4 w-28 bg-neutral-100 rounded-full"></div></td>
                      <td className="px-6 py-6"><div className="h-7 w-20 bg-neutral-100 rounded-xl"></div></td>
                      <td className="px-8 py-6"><div className="h-8 w-8 bg-neutral-100 rounded-lg ml-auto"></div></td>
                    </motion.tr>
                  ))
                ) : drives.length > 0 ? (
                  drives.map((drive) => (
                    <motion.tr
                      key={drive._id}
                      variants={itemVariants}
                      className="group hover:bg-neutral-50/80 transition-all duration-300"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <CompanyLogo 
                            logo={drive.companyLogo} 
                            companyName={drive.companyName} 
                            className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0 border border-neutral-200 overflow-hidden"
                            iconClassName="w-5 h-5 text-neutral-400"
                            imgClassName="w-6 h-6 object-contain"
                          />
                          <div>
                            <span className="text-sm font-bold text-neutral-900 group-hover:text-brand-blue transition-colors block">
                              {drive.companyName}
                            </span>
                            <span className="text-xs text-neutral-500 mt-1 flex items-center gap-1 font-medium">
                              <MapPin className="w-3 h-3" />
                              {drive.location || 'Multiple Locations'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-sm font-bold text-neutral-800 flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5 text-neutral-400" />
                            {drive.jobRole}
                          </span>
                          <span className="text-xs font-semibold text-brand-green flex items-center gap-1">
                            <IndianRupee className="w-3 h-3" />
                            {drive.ctc}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-2 text-sm text-neutral-600 font-medium">
                          <Calendar className="w-4 h-4 text-neutral-400" />
                          {formatDate(drive.registrationDeadline)}
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <span className={`px-3.5 py-1.5 inline-flex text-[11px] font-bold rounded-xl border ${getStatusStyles(drive.status)} uppercase tracking-wider`}>
                          {drive.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <button
                            onClick={() => navigate(`/dashboard/admin/drives/${drive._id}/applications`)}
                            className="p-2 text-brand-blue hover:bg-brand-blue-light rounded-xl transition-all"
                            title="View Applicants"
                          >
                            <Users className="w-4.5 h-4.5" />
                          </button>
                          <button
                            onClick={() => handleOpenModal('edit', drive)}
                            className="p-2 text-brand-orange hover:bg-brand-orange/10 rounded-xl transition-all"
                            title="Edit Drive"
                          >
                            <Edit2 className="w-4.5 h-4.5" />
                          </button>
                          <button
                            onClick={() => handleViewDetails(drive)}
                            className="p-2 text-neutral-400 hover:text-brand-blue hover:bg-brand-blue-light rounded-xl transition-all"
                            title="View Details"
                          >
                            <ExternalLink className="w-4.5 h-4.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRequest(drive._id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            title="Delete Drive"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <td colSpan="5" className="px-8 py-24 text-center">
                      <div className="flex flex-col items-center justify-center max-w-md mx-auto">
                        <motion.div
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 200, damping: 20 }}
                          className="w-24 h-24 bg-brand-orange/5 rounded-[2rem] flex items-center justify-center mb-6 relative overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-gradient-to-tr from-brand-orange/10 to-transparent"></div>
                          <Briefcase className="h-10 w-10 text-brand-orange relative z-10" />
                        </motion.div>
                        <h3 className="text-2xl font-bold text-neutral-900 mb-2">No Drives Found</h3>
                        <p className="text-neutral-500 text-sm leading-relaxed">
                          We couldn't find any placement drives matching your current criteria. Try adjusting your search filters or create a new drive to get started.
                        </p>
                        {searchQuery || statusFilter ? (
                          <button
                            onClick={() => { setSearchQuery(''); setStatusFilter(''); }}
                            className="mt-6 px-6 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-sm font-semibold rounded-xl transition-colors"
                          >
                            Clear Filters
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </motion.tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Improved Pagination */}
        {!loading && drives.length > 0 && (
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
                    className={`min-w-[40px] h-10 rounded-xl text-sm font-bold transition-all shadow-sm ${page === i + 1
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

      <DriveModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        mode={modalMode}
        initialData={currentDrive}
        onSubmit={handleDriveSubmit}
        isSubmitting={isSubmitting}
      />

      <DriveDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetails}
        drive={viewingDrive}
      />

      {/* Delete Confirmation Dialog */}
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
                <AlertCircle className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-2">Delete Drive?</h2>
              <p className="text-neutral-500 mb-8 leading-relaxed">
                Are you sure you want to delete this drive? This action will hide it from students and cannot be undone easily.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={cancelDelete}
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
                  {isSubmitting ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : 'Yes, Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdminDrivesPage;
