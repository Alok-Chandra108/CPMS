import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Building2, MapPin, Briefcase, IndianRupee, Calendar, 
  GraduationCap, BookOpen, AlertCircle, Users, ExternalLink, Download 
} from 'lucide-react';
import CompanyLogo from '../../../../components/CompanyLogo';
import { downloadRemoteFile } from '../../../../utils/exportUtils';

const DriveDetailsModal = ({ isOpen, onClose, drive }) => {
  if (!isOpen || !drive) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusStyles = (status) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'upcoming':
        return 'bg-brand-blue-light text-brand-blue border-brand-blue-light';
      case 'closed':
        return 'bg-neutral-100 text-neutral-600 border-neutral-200';
      default:
        return 'bg-neutral-100 text-neutral-700 border-neutral-200';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-neutral-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/80 sticky top-0 z-10 shrink-0">
              <div className="flex items-center gap-4">
                <CompanyLogo 
                  logo={drive.companyLogo} 
                  companyName={drive.companyName} 
                  className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shrink-0 border border-neutral-200 shadow-sm overflow-hidden"
                  iconClassName="w-6 h-6 text-neutral-400"
                  imgClassName="w-8 h-8 object-contain"
                />
                <div>
                  <h2 className="text-xl font-bold text-neutral-900">{drive.companyName}</h2>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`px-2.5 py-0.5 inline-flex text-[10px] font-bold rounded-lg border ${getStatusStyles(drive.status)} uppercase tracking-wider`}>
                      {drive.status}
                    </span>
                    <span className="text-sm text-neutral-500 font-medium flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {drive.location || 'Multiple Locations'}
                    </span>
                  </div>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200 rounded-full transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-neutral-50/30">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Column: Details */}
                <div className="lg:col-span-2 space-y-8">
                  
                  {/* About Company */}
                  <section className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100">
                    <h3 className="text-lg font-bold text-neutral-800 mb-4 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-brand-blue" />
                      About Company
                    </h3>
                    <p className="text-neutral-600 whitespace-pre-wrap leading-relaxed text-sm">
                      {drive.companyDescription || 'No description provided.'}
                    </p>
                  </section>

                  {/* Job Details */}
                  <section className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100">
                    <h3 className="text-lg font-bold text-neutral-800 mb-4 flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-brand-orange" />
                      Job Details
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                        <p className="text-xs font-bold text-neutral-500 mb-1 uppercase tracking-wider">Role</p>
                        <p className="font-semibold text-neutral-900">{drive.jobRole}</p>
                      </div>
                      <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                        <p className="text-xs font-bold text-neutral-500 mb-1 uppercase tracking-wider">Job Type</p>
                        <p className="font-semibold text-neutral-900">{drive.jobType || 'Full-time'}</p>
                      </div>
                      <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                        <p className="text-xs font-bold text-neutral-500 mb-1 uppercase tracking-wider">CTC / Stipend</p>
                        <p className="font-bold text-brand-green flex items-center gap-1">
                          <IndianRupee className="w-4 h-4" />
                          {drive.ctc}
                        </p>
                      </div>
                      <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                        <p className="text-xs font-bold text-neutral-500 mb-1 uppercase tracking-wider">Location</p>
                        <p className="font-semibold text-neutral-900">{drive.location}</p>
                      </div>
                    </div>
                    {drive.drivePdf && (
                      <div className="mt-4 pt-4 border-t border-neutral-100 flex flex-wrap items-center gap-3">
                        <a 
                          href={drive.drivePdf} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-100 text-neutral-800 rounded-lg text-sm font-bold hover:bg-neutral-200 transition-colors shadow-sm"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View Brochure
                        </a>
                        <button 
                          type="button"
                          onClick={() => downloadRemoteFile(drive.drivePdf, `${(drive.companyName || 'Job').replace(/[^a-zA-Z0-9_-]/g, '_')}_Brochure.pdf`)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue text-white rounded-lg text-sm font-bold hover:bg-brand-blue-dark transition-colors shadow-md shadow-brand-blue/20"
                        >
                          <Download className="w-4 h-4" />
                          Download Brochure
                        </button>
                      </div>
                    )}
                  </section>

                  {/* Eligibility */}
                  <section className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100">
                    <h3 className="text-lg font-bold text-neutral-800 mb-4 flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-purple-500" />
                      Eligibility Criteria
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                      <div className="flex flex-col items-center justify-center p-3 bg-purple-50 rounded-xl border border-purple-100">
                        <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider mb-1">Min CGPA</p>
                        <p className="text-lg font-extrabold text-purple-900">{drive.eligibility?.minCgpa || 'N/A'}</p>
                      </div>
                      <div className="flex flex-col items-center justify-center p-3 bg-purple-50 rounded-xl border border-purple-100">
                        <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider mb-1">10th %</p>
                        <p className="text-lg font-extrabold text-purple-900">{drive.eligibility?.minTenthPercent ? `${drive.eligibility.minTenthPercent}%` : 'N/A'}</p>
                      </div>
                      <div className="flex flex-col items-center justify-center p-3 bg-purple-50 rounded-xl border border-purple-100">
                        <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider mb-1">12th %</p>
                        <p className="text-lg font-extrabold text-purple-900">{drive.eligibility?.minTwelfthPercent ? `${drive.eligibility.minTwelfthPercent}%` : 'N/A'}</p>
                      </div>
                      <div className="flex flex-col items-center justify-center p-3 bg-purple-50 rounded-xl border border-purple-100">
                        <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider mb-1">Backlogs</p>
                        <p className="text-lg font-extrabold text-purple-900">{drive.eligibility?.maxBacklogs ?? 'N/A'}</p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-semibold text-neutral-700 mb-3">Eligible Branches:</p>
                      <div className="flex flex-wrap gap-2">
                        {drive.eligibility?.eligibleBranches?.length > 0 ? (
                          drive.eligibility.eligibleBranches.map((branch, idx) => (
                            <span key={idx} className="px-3 py-1.5 bg-neutral-100 text-neutral-700 text-xs font-semibold rounded-lg border border-neutral-200">
                              {branch}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-neutral-500 italic">No specific branches listed.</span>
                        )}
                      </div>
                    </div>
                  </section>

                </div>

                {/* Right Column: Important Dates & Actions */}
                <div className="space-y-6">
                  
                  <section className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100">
                    <h3 className="text-lg font-bold text-neutral-800 mb-4 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-500" />
                      Timeline
                    </h3>
                    <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-neutral-200 before:to-transparent">
                      <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-white bg-neutral-200 text-neutral-500 group-[.is-active]:bg-red-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 ml-[-9px] md:ml-0 z-10"></div>
                        <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded-xl bg-red-50 border border-red-100 ml-4 md:ml-0">
                          <p className="text-[10px] font-bold text-red-500 uppercase mb-1">Registration Closes</p>
                          <p className="text-sm font-bold text-neutral-900">{formatDate(drive.registrationDeadline)}</p>
                        </div>
                      </div>
                      <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-white bg-neutral-200 text-neutral-500 group-[.is-active]:bg-blue-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 ml-[-9px] md:ml-0 z-10"></div>
                        <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded-xl bg-blue-50 border border-blue-100 ml-4 md:ml-0">
                          <p className="text-[10px] font-bold text-blue-500 uppercase mb-1">Drive Date</p>
                          <p className="text-sm font-bold text-neutral-900">{formatDate(drive.driveDate)}</p>
                        </div>
                      </div>
                    </div>
                  </section>
                  
                  <section className="bg-brand-blue-light/30 p-5 rounded-2xl border border-brand-blue-light">
                     <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-brand-blue shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-bold text-brand-blue mb-1">Note for Admin</h4>
                          <p className="text-xs text-brand-blue/80 leading-relaxed">
                            Students can view these details from their dashboard. Ensure all eligibility criteria and dates are accurate.
                          </p>
                        </div>
                     </div>
                  </section>

                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="px-6 py-4 border-t border-neutral-100 bg-neutral-50/50 flex justify-end shrink-0">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl font-semibold bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50 shadow-sm transition-all"
              >
                Close Details
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DriveDetailsModal;
