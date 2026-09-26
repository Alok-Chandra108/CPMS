import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Briefcase, 
  MapPin, 
  Calendar, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Building2,
  IndianRupee,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getDrives, resetDriveState } from '../../features/drives/driveSlice';
import { getMyApplicationsAction } from '../../features/applications/applicationSlice';
import useEligibility from '../../hooks/useEligibility';
import CompanyLogo from '../../components/CompanyLogo';

// ── Animation Variants ──
const fadeUp = {
  hidden: { y: 10, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 400, damping: 30 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

// ── Components ──

const DriveListItem = ({ drive, hasApplied }) => {
  const { isEligible, isProfileIncomplete, reason } = useEligibility(drive);

  const getStatusColor = (status) => {
    if (hasApplied) return 'bg-brand-primary/10 text-brand-primary border-brand-primary/20';
    if (isProfileIncomplete) return 'bg-amber-100 text-amber-700 border-amber-200';
    if (!isEligible) return 'bg-error/10 text-error border-error/20';
    
    switch (status) {
      case 'open': return 'bg-success/10 text-success border-success/20';
      case 'upcoming': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'closed': return 'bg-stripe-bg border-stripe-border text-stripe-textSecondary';
      default: return 'bg-stripe-bg text-stripe-textSecondary border-stripe-border';
    }
  };

  const getStatusText = (status) => {
    if (hasApplied) return 'Applied';
    if (isProfileIncomplete) return 'Incomplete Profile';
    if (!isEligible) return 'Not Eligible';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <motion.div
      variants={fadeUp}
      layout
      className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-5 bg-white border-b border-stripe-border hover:bg-stripe-bg transition-colors relative"
    >
      {/* Active Indicator on hover */}
      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-brand-primary opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Main Info */}
      <div className="flex items-center gap-4 flex-1 min-w-0 w-full sm:w-auto">
        <CompanyLogo 
          logo={drive.companyLogo} 
          companyName={drive.companyName} 
          className="w-12 h-12 bg-white rounded-lg flex items-center justify-center border border-stripe-border flex-shrink-0"
          iconClassName="w-6 h-6 text-stripe-textSecondary"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-[14px] font-extrabold text-stripe-text truncate group-hover:text-brand-primary transition-colors">
              {drive.companyName}
            </h3>
            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${getStatusColor(drive.status)}`}>
              {getStatusText(drive.status)}
            </span>
          </div>
          <h4 className="text-[12px] font-bold text-stripe-textSecondary truncate">{drive.jobRole}</h4>
        </div>
      </div>

      {/* Meta Data */}
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 sm:gap-8 mt-4 sm:mt-0 flex-1 sm:justify-end w-full sm:w-auto">
        <div className="flex flex-col items-start sm:items-end w-1/2 sm:w-auto">
          <span className="text-[10px] font-bold text-stripe-textSecondary uppercase tracking-wider">Package</span>
          <span className="text-[12px] font-extrabold text-stripe-text flex items-center">
            <IndianRupee className="w-3 h-3 mr-0.5" />{drive.ctc}
          </span>
        </div>
        
        <div className="flex flex-col items-start sm:items-end w-1/2 sm:w-auto">
          <span className="text-[10px] font-bold text-stripe-textSecondary uppercase tracking-wider">Location</span>
          <span className="text-[12px] font-bold text-stripe-text truncate max-w-[120px]">
            {drive.location}
          </span>
        </div>

        <div className="flex flex-col items-start sm:items-end w-1/2 sm:w-auto hidden md:flex">
          <span className="text-[10px] font-bold text-stripe-textSecondary uppercase tracking-wider">Date</span>
          <span className="text-[12px] font-bold text-stripe-text">
            {new Date(drive.driveDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </span>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end w-1/2 sm:w-auto ml-auto">
          <Link 
            to={`/dashboard/student/drives/${drive._id}`}
            className={`flex items-center justify-center px-4 py-2 rounded-lg text-[12px] font-bold transition-all whitespace-nowrap shadow-stripe-sm ${
              hasApplied 
                ? 'bg-stripe-bg border border-stripe-border text-stripe-text hover:border-brand-primary/30'
                : 'bg-brand-primary text-white hover:bg-brand-primary-dark'
            }`}
          >
            {hasApplied ? 'View Status' : 'Details'}
            <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>
      </div>

      {/* Eligibility Warning */}
      {(!isEligible && !hasApplied) && (
        <div className="w-full sm:hidden mt-3 text-[10px] font-bold text-error bg-error/5 p-2 rounded">
          {reason}
        </div>
      )}
    </motion.div>
  );
};

const DrivesPage = () => {
  const dispatch = useDispatch();
  const { drives, isLoading, isError, message } = useSelector((state) => state.drives);
  const { applications } = useSelector((state) => state.applications);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    dispatch(getDrives());
    dispatch(getMyApplicationsAction());
    
    return () => {
      dispatch(resetDriveState());
    };
  }, [dispatch]);

  const filteredDrives = drives.filter(drive => {
    const matchesSearch = drive.companyName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          drive.jobRole.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || drive.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const DriveListSkeleton = () => (
    <div className="animate-pulse">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="flex items-center justify-between p-5 border-b border-stripe-border">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-stripe-bg rounded-lg"></div>
            <div>
              <div className="h-4 w-32 bg-stripe-bg rounded mb-2"></div>
              <div className="h-3 w-24 bg-stripe-bg rounded"></div>
            </div>
          </div>
          <div className="hidden sm:flex gap-8">
            <div className="h-4 w-16 bg-stripe-bg rounded"></div>
            <div className="h-4 w-16 bg-stripe-bg rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="max-w-[1000px] mx-auto pb-12">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-stripe-text tracking-tight">Placement Drives</h1>
          <p className="text-[13px] text-stripe-textSecondary mt-1">
            Discover and apply to the latest career opportunities.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Bar */}
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stripe-textSecondary" />
            <input 
              type="text"
              placeholder="Search companies or roles..."
              className="pl-9 pr-3 py-2 bg-white border border-stripe-border rounded-lg w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-[13px] font-bold text-stripe-text shadow-stripe-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filter Dropdown */}
          <div className="relative group">
            <select
              className="pl-3 pr-8 py-2 bg-white border border-stripe-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all appearance-none text-[13px] font-bold text-stripe-text shadow-stripe-sm cursor-pointer w-full"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="upcoming">Upcoming</option>
              <option value="closed">Closed</option>
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stripe-textSecondary pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="bg-white rounded-xl border border-stripe-border overflow-hidden shadow-stripe-sm">
        {isLoading ? (
          <DriveListSkeleton />
        ) : isError ? (
          <div className="bg-error/5 p-8 text-center">
            <div className="w-12 h-12 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-[14px] font-bold text-error mb-1">Failed to load drives</h3>
            <p className="text-[12px] font-medium text-error/80 mb-4">{message}</p>
            <button 
              onClick={() => dispatch(getDrives())}
              className="px-4 py-2 bg-error text-white text-[12px] font-bold rounded-lg hover:bg-error/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : filteredDrives.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 bg-stripe-bg rounded-full flex items-center justify-center mx-auto mb-4 border border-stripe-border">
              <Briefcase className="w-6 h-6 text-stripe-textSecondary" />
            </div>
            <h3 className="text-[15px] font-extrabold text-stripe-text mb-1">No placement drives found</h3>
            <p className="text-[13px] text-stripe-textSecondary max-w-sm mx-auto mb-6">
              {searchTerm || statusFilter !== 'all' 
                ? "We couldn't find any drives matching your current filters."
                : "There are currently no placement drives scheduled. Check back later!"}
            </p>
            {(searchTerm || statusFilter !== 'all') && (
              <button 
                onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
                className="text-[12px] font-bold text-brand-primary hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col">
            <AnimatePresence mode="popLayout">
              {filteredDrives.map((drive, index) => {
                const hasApplied = applications.some(app => app.driveId?._id === drive._id || app.driveId === drive._id);
                return <DriveListItem key={drive._id} drive={drive} index={index} hasApplied={hasApplied} />;
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default DrivesPage;
