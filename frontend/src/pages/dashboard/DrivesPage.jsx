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

const DriveCard = ({ drive, index, hasApplied }) => {
  const { isEligible, isProfileIncomplete, reason } = useEligibility(drive);

  const getStatusColor = (status) => {
    if (hasApplied) return 'bg-brand-blue-light text-brand-blue border-brand-blue/20';
    if (isProfileIncomplete) return 'bg-amber-100 text-amber-700 border-amber-200';
    if (!isEligible) return 'bg-rose-100 text-rose-700 border-rose-200';
    
    switch (status) {
      case 'open': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'upcoming': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'closed': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-neutral-100 text-neutral-700 border-neutral-200';
    }
  };

  const getStatusIcon = (status) => {
    if (hasApplied) return <CheckCircle2 className="w-3.5 h-3.5 mr-1" />;
    if (isProfileIncomplete) return <AlertCircle className="w-3.5 h-3.5 mr-1" />;
    if (!isEligible) return <AlertCircle className="w-3.5 h-3.5 mr-1" />;

    switch (status) {
      case 'open': return <CheckCircle2 className="w-3.5 h-3.5 mr-1" />;
      case 'upcoming': return <Clock className="w-3.5 h-3.5 mr-1" />;
      case 'closed': return <AlertCircle className="w-3.5 h-3.5 mr-1" />;
      default: return null;
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
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.05 }}
      className="group relative bg-white rounded-3xl border border-neutral-100 p-6 hover:shadow-2xl hover:shadow-neutral-200/50 hover:border-brand-orange/20 transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <CompanyLogo 
            logo={drive.companyLogo} 
            companyName={drive.companyName} 
            className="w-14 h-14 bg-neutral-50 rounded-2xl flex items-center justify-center border border-neutral-100 group-hover:scale-110 transition-transform overflow-hidden shadow-inner"
            iconClassName="w-7 h-7 text-neutral-400"
          />
          <div>
            <h3 className="text-lg font-bold text-neutral-900 leading-tight group-hover:text-brand-orange transition-colors">
              {drive.companyName}
            </h3>
            <div className="flex items-center text-neutral-500 text-sm font-medium mt-1">
              <MapPin className="w-3.5 h-3.5 mr-1" />
              {drive.location}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider border flex items-center ${getStatusColor(drive.status)}`}>
            {getStatusIcon(drive.status)}
            {getStatusText(drive.status)}
          </div>
          {(!isEligible && !hasApplied) && (
            <span className="text-[10px] font-bold text-rose-500 max-w-[150px] text-right leading-tight">
              {reason}
            </span>
          )}
        </div>
      </div>

      <div className="mb-6">
        <h4 className="text-neutral-900 font-bold mb-1 line-clamp-1">{drive.jobRole}</h4>
        <div className="flex items-center text-brand-blue font-bold text-sm bg-brand-blue-light/50 px-3 py-1 rounded-lg w-fit">
          <IndianRupee className="w-3.5 h-3.5 mr-0.5" />
          {drive.ctc}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 py-4 border-y border-neutral-50 mb-6">
        <div className="flex items-center text-neutral-500 text-sm font-medium">
          <Briefcase className="w-4 h-4 mr-2 text-neutral-400" />
          {drive.jobType}
        </div>
        <div className="flex items-center text-neutral-500 text-sm font-medium">
          <Calendar className="w-4 h-4 mr-2 text-neutral-400" />
          {new Date(drive.driveDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        </div>
      </div>

      <Link 
        to={`/dashboard/student/drives/${drive._id}`}
        className={`flex items-center justify-center w-full py-3.5 rounded-2xl font-bold transition-all duration-300 group-hover:shadow-lg ${
          hasApplied 
            ? 'bg-brand-blue text-white hover:bg-brand-blue-dark'
            : 'bg-neutral-900 text-white hover:bg-brand-orange group-hover:shadow-brand-orange/30'
        }`}
      >
        {hasApplied ? 'View Application' : 'View Details'}
        <ArrowRight className="w-4 h-4 ml-2" />
      </Link>
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

  const DriveCardSkeleton = () => (
    <div className="bg-white rounded-2xl border border-neutral-100 p-6 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-neutral-100 rounded-xl"></div>
          <div>
            <div className="h-5 w-32 bg-neutral-100 rounded mb-2"></div>
            <div className="h-4 w-24 bg-neutral-100 rounded"></div>
          </div>
        </div>
        <div className="h-6 w-20 bg-neutral-100 rounded-full"></div>
      </div>
      <div className="space-y-3 mb-6">
        <div className="h-4 w-full bg-neutral-100 rounded"></div>
        <div className="h-4 w-2/3 bg-neutral-100 rounded"></div>
      </div>
      <div className="flex gap-3 pt-4 border-t border-neutral-50">
        <div className="h-4 w-24 bg-neutral-100 rounded"></div>
        <div className="h-4 w-24 bg-neutral-100 rounded"></div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight mb-2">
            Placement Drives
          </h1>
          <p className="text-neutral-500 font-medium">
            Discover and apply to the latest career opportunities.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Bar */}
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 group-focus-within:text-brand-orange transition-colors" />
            <input 
              type="text"
              placeholder="Search companies or roles..."
              className="pl-11 pr-4 py-3 bg-white border border-neutral-200 rounded-xl w-full sm:w-72 focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange transition-all font-medium text-neutral-700"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filter Dropdown */}
          <div className="relative group">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <select
              className="pl-10 pr-8 py-3 bg-white border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange transition-all appearance-none font-medium text-neutral-700 cursor-pointer"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="upcoming">Upcoming</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => <DriveCardSkeleton key={i} />)}
        </div>
      ) : isError ? (
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-rose-900 mb-1">Failed to load drives</h3>
          <p className="text-rose-600 font-medium mb-6">{message}</p>
          <button 
            onClick={() => dispatch(getDrives())}
            className="px-6 py-2.5 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : filteredDrives.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white border border-neutral-100 rounded-3xl p-16 text-center shadow-sm"
        >
          <div className="w-20 h-20 bg-neutral-50 text-neutral-400 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Briefcase className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-neutral-900 mb-2">No placement drives found</h3>
          <p className="text-neutral-500 max-w-sm mx-auto mb-8 font-medium">
            {searchTerm || statusFilter !== 'all' 
              ? "We couldn't find any drives matching your current filters."
              : "There are currently no placement drives scheduled. Check back later!"}
          </p>
          {(searchTerm || statusFilter !== 'all') && (
            <button 
              onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
              className="text-brand-orange font-bold hover:underline underline-offset-4"
            >
              Clear all filters
            </button>
          )}
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredDrives.map((drive, index) => {
              const hasApplied = applications.some(app => app.driveId?._id === drive._id || app.driveId === drive._id);
              return <DriveCard key={drive._id} drive={drive} index={index} hasApplied={hasApplied} />;
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default DrivesPage;
