import React, { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Calendar,
  Briefcase,
  GraduationCap,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Download,
  ChevronRight,
  Info
} from 'lucide-react';
import { getDriveById, clearCurrentDrive } from '../../features/drives/driveSlice';
import { applyToDriveAction, getMyApplicationsAction, resetApplicationState } from '../../features/applications/applicationSlice';
import useEligibility from '../../hooks/useEligibility';
import toast from 'react-hot-toast';
import CompanyLogo from '../../components/CompanyLogo';
import { downloadRemoteFile } from '../../utils/exportUtils';

const DriveDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { currentDrive, isLoading, isError, message } = useSelector((state) => state.drives);
  const { applications, isLoading: isApplying, isSuccess: applicationSuccess, isError: applicationError, message: applicationMessage } = useSelector((state) => state.applications);

  const hasApplied = applications.some(app => app.driveId?._id === id || app.driveId === id);
  const { isEligible, reason, isProfileIncomplete } = useEligibility(currentDrive);

  useEffect(() => {
    dispatch(getDriveById(id));
    dispatch(getMyApplicationsAction());

    return () => {
      dispatch(clearCurrentDrive());
      dispatch(resetApplicationState());
    };
  }, [id, dispatch]);

  useEffect(() => {
    if (applicationSuccess) {
      toast.success(applicationMessage || 'Application submitted successfully!');
      dispatch(getMyApplicationsAction()); // Refresh applications
      dispatch(resetApplicationState());
    }
    if (applicationError) {
      dispatch(resetApplicationState());
    }
  }, [applicationSuccess, applicationError, applicationMessage, dispatch]);

  const handleApply = () => {
    if (!isEligible) {
      toast.error(reason);
      return;
    }
    dispatch(applyToDriveAction(id));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-brand-orange/20 border-t-brand-orange rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isError || !currentDrive) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">Drive not found</h2>
        <p className="text-neutral-500 mb-8">{message || "The placement drive you're looking for doesn't exist or has been removed."}</p>
        <button
          onClick={() => navigate('/dashboard/student/drives')}
          className="px-6 py-3 bg-neutral-900 text-white rounded-xl font-bold hover:bg-brand-orange transition-colors"
        >
          Back to Drives
        </button>
      </div>
    );
  }

  // Derive which application (if any) this student has for this drive
  const currentApplication = applications.find(app => app.driveId?._id === id || app.driveId === id);
  const appStatus = currentApplication?.status;

  const isDeadlinePassed = new Date() > new Date(currentDrive.registrationDeadline);

  /**
   * Map application status → which recruitment step is "current".
   * Steps in order: Registration → Shortlisting → Online Test → Technical Interview → HR Interview
   *
   * step index: 0=Registration, 1=Shortlisting, 2=OnlineTest, 3=TechInterview, 4=HRInterview
   */
  const getStepState = (stepIndex) => {
    if (!appStatus) {
      // Not applied yet — everything upcoming, Registration is current
      return stepIndex === 0 ? 'current' : 'upcoming';
    }

    const statusToCurrentStep = {
      'applied': 0, // registration done, shortlisting current
      'shortlisted': 1,
      'not-shortlisted': 1, // stuck at shortlisting (failed)
      'test-cleared': 2,
      'test-failed': 2, // stuck at online test (failed)
      'interview-scheduled': 3,
      'selected': 4,
      'rejected': 4,
    };

    const currentStepIndex = statusToCurrentStep[appStatus] ?? 0;
    const isFinalNegative = ['not-shortlisted', 'test-failed', 'rejected'].includes(appStatus);

    if (stepIndex < currentStepIndex) return 'completed';
    if (stepIndex === currentStepIndex) {
      // For terminal-failure statuses the current step shows as failed (we still use 'current' class
      // but the label will indicate it in the UI via the application status badge)
      return isFinalNegative && stepIndex === currentStepIndex ? 'failed' : 'current';
    }
    return 'upcoming';
  };

  const driveSteps = [
    { name: 'Registration', date: currentDrive.registrationDeadline, state: getStepState(0) },
    { name: 'Shortlisting', date: null, state: getStepState(1) },
    { name: 'Online Test', date: currentDrive.driveDate, state: getStepState(2) },
    { name: 'Technical Interview', date: null, state: getStepState(3) },
    { name: 'HR Interview', date: null, state: getStepState(4) },
  ];


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <Link
        to="/dashboard/student/drives"
        className="inline-flex items-center text-neutral-500 hover:text-brand-orange font-bold mb-8 group transition-colors"
      >
        <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
        Back to Placement Drives
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Main Info */}
        <div className="lg:col-span-2 space-y-8">
          {/* Company Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-neutral-100 p-8 shadow-sm"
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-8">
              <CompanyLogo
                logo={currentDrive.companyLogo}
                companyName={currentDrive.companyName}
                className="w-20 h-20 bg-neutral-50 rounded-3xl flex items-center justify-center border border-neutral-100 shadow-inner overflow-hidden shrink-0"
                iconClassName="w-10 h-10 text-neutral-400"
              />
              <div>
                <h1 className="text-3xl font-extrabold text-neutral-900 mb-2">{currentDrive.companyName}</h1>
                <div className="flex flex-wrap items-center gap-4 text-neutral-500 font-medium">
                  <span className="flex items-center"><MapPin className="w-4 h-4 mr-1.5 text-brand-orange" />{currentDrive.location}</span>
                  <span className="flex items-center"><Briefcase className="w-4 h-4 mr-1.5 text-brand-orange" />{currentDrive.jobType}</span>
                </div>
              </div>
              <div className="sm:ml-auto flex flex-col items-end gap-2">
                <span className={`px-4 py-2 rounded-full text-xs font-extrabold uppercase tracking-widest border ${isProfileIncomplete ? 'border-amber-200 bg-amber-50 text-amber-700' :
                    !isEligible ? 'border-rose-200 bg-rose-50 text-rose-700' :
                      'border-emerald-200 bg-emerald-50 text-emerald-700'
                  }`}>
                  {isProfileIncomplete ? 'Incomplete Profile' : !isEligible ? 'Not Eligible' : currentDrive.status}
                </span>
                {!isEligible && (
                  <p className="text-[10px] font-bold text-rose-500 max-w-[150px] text-right">{reason}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 p-6 bg-neutral-50 rounded-2xl border border-neutral-100">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Job Role</p>
                <p className="font-bold text-neutral-900">{currentDrive.jobRole}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Salary (CTC)</p>
                <p className="font-bold text-brand-blue">{currentDrive.ctc}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Deadline</p>
                <p className="font-bold text-rose-600">{new Date(currentDrive.registrationDeadline).toLocaleDateString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Drive Date</p>
                <p className="font-bold text-neutral-900">{new Date(currentDrive.driveDate).toLocaleDateString()}</p>
              </div>
            </div>
          </motion.div>

          {/* Job Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl border border-neutral-100 p-8 shadow-sm"
          >
            <h2 className="text-xl font-bold text-neutral-900 mb-6 flex items-center">
              <Info className="w-5 h-5 mr-3 text-brand-orange" />
              About the Company & Role
            </h2>
            <div className="prose prose-neutral max-w-none text-neutral-600 font-medium leading-relaxed">
              <p className="whitespace-pre-wrap">{currentDrive.companyDescription}</p>
            </div>
            
            {currentDrive.drivePdf && (
              <div className="mt-6 pt-6 border-t border-neutral-100 flex flex-wrap items-center gap-3">
                <a
                  href={currentDrive.drivePdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl font-bold transition-all shadow-sm"
                >
                  <ExternalLink className="w-5 h-5 text-neutral-600" />
                  View Job Brochure (PDF)
                </a>
                <button
                  type="button"
                  onClick={() => downloadRemoteFile(currentDrive.drivePdf, `${(currentDrive.companyName || 'Job').replace(/[^a-zA-Z0-9_-]/g, '_')}_Brochure.pdf`)}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-blue hover:bg-brand-blue-dark text-white rounded-xl font-bold transition-all shadow-md shadow-brand-blue/20"
                >
                  <Download className="w-5 h-5" />
                  Download Brochure
                </button>
              </div>
            )}
          </motion.div>

          {/* Recruitment Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl border border-neutral-100 p-8 shadow-sm"
          >
            <h2 className="text-xl font-bold text-neutral-900 mb-8 flex items-center">
              <Clock className="w-5 h-5 mr-3 text-brand-orange" />
              Recruitment Process
            </h2>

            <div className="relative">
              {/* Vertical Line */}
              <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-neutral-100"></div>

              <div className="space-y-8 relative">
                {driveSteps.map((step, index) => (
                  <div key={index} className="flex items-start gap-6 group">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 transition-colors ${step.state === 'completed' ? 'bg-emerald-500 text-white' :
                        step.state === 'current' ? 'bg-brand-orange text-white shadow-lg shadow-brand-orange/30' :
                          step.state === 'failed' ? 'bg-rose-500 text-white' :
                            'bg-neutral-100 text-neutral-400'
                      }`}>
                      {step.state === 'completed' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : step.state === 'failed' ? (
                        <AlertTriangle className="w-3.5 h-3.5" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-current" />
                      )}
                    </div>
                    <div>
                      <h3 className={`font-bold transition-colors ${step.state === 'upcoming' ? 'text-neutral-400' :
                          step.state === 'failed' ? 'text-rose-500 line-through' :
                            'text-neutral-900'
                        }`}>
                        {step.name}
                      </h3>
                      {step.date && (
                        <p className="text-sm text-neutral-500 font-medium mt-1">
                          {new Date(step.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </motion.div>
        </div>

        {/* Right Column: Sticky Sidebar - both cards in one sticky wrapper */}
        <div className="sticky top-8 space-y-6 self-start">
          {/* Eligibility Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-3xl border border-neutral-100 p-8 shadow-sm"
          >
            <h2 className="text-xl font-bold text-neutral-900 mb-6 flex items-center">
              <GraduationCap className="w-5 h-5 mr-3 text-brand-orange" />
              Eligibility Criteria
            </h2>

            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
                <div className="flex items-center text-neutral-600 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4 mr-3 text-emerald-500" />
                  Min. CGPA
                </div>
                <span className="font-extrabold text-neutral-900">{currentDrive.eligibility.minCgpa}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
                <div className="flex items-center text-neutral-600 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4 mr-3 text-emerald-500" />
                  10th / 12th %
                </div>
                <span className="font-extrabold text-neutral-900">{currentDrive.eligibility.minTenthPercent}%</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
                <div className="flex items-center text-neutral-600 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4 mr-3 text-emerald-500" />
                  Max Backlogs
                </div>
                <span className="font-extrabold text-neutral-900">{currentDrive.eligibility.maxBacklogs}</span>
              </div>
            </div>

            <div className="mb-8">
              <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4">Eligible Branches</h4>
              <div className="flex flex-wrap gap-2">
                {currentDrive.eligibility.eligibleBranches.map((branch, i) => (
                  <span key={i} className="px-3 py-1.5 bg-brand-blue-light text-brand-blue rounded-lg text-xs font-bold border border-brand-blue/10">
                    {branch}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={handleApply}
              disabled={currentDrive.status === 'closed' || isDeadlinePassed || !isEligible || isProfileIncomplete || hasApplied || isApplying}
              className={`w-full py-4 rounded-2xl font-extrabold text-lg shadow-xl transition-all duration-300 flex items-center justify-center gap-2 ${currentDrive.status === 'closed' || isDeadlinePassed || !isEligible || isProfileIncomplete || hasApplied || isApplying
                  ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                  : 'bg-neutral-900 text-white hover:bg-brand-orange hover:shadow-brand-orange/30'
                }`}
            >
              {isApplying ? 'Processing...' :
                hasApplied ? 'Already Applied' :
                  currentDrive.status === 'closed' ? 'Application Closed' :
                    isDeadlinePassed ? 'Deadline Passed' :
                      !isEligible ? 'Not Eligible' :
                        isProfileIncomplete ? 'Complete Profile' : 'Apply Now'}
              {currentDrive.status === 'open' && !isDeadlinePassed && isEligible && !isProfileIncomplete && !hasApplied && !isApplying && <ExternalLink className="w-5 h-5" />}
            </button>
            <p className={`text-center text-[11px] font-bold mt-4 uppercase tracking-widest ${isDeadlinePassed || !isEligible ? 'text-rose-500' : 'text-neutral-400'}`}>
              {isDeadlinePassed ? 'Registration deadline has passed' : !isEligible ? reason : 'Review eligibility before applying'}
            </p>
          </motion.div>

          {/* Quick Support/Help Card */}
          <div className="bg-brand-blue text-white rounded-3xl p-8 shadow-xl shadow-brand-blue/20">
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <Users className="w-5 h-5 mr-3 text-brand-orange" />
              Need Help?
            </h3>
            <p className="text-brand-blue-light font-medium text-sm mb-6 leading-relaxed">
              Have questions regarding this drive or your eligibility? Contact the placement cell.
            </p>
            <button className="w-full py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl font-bold transition-colors">
              Contact T&P Office
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriveDetail;
