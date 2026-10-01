import React, { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  GraduationCap,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Download,
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
        <div className="w-12 h-12 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isError || !currentDrive) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 bg-error/10 text-error rounded-2xl flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-stripe-text mb-2">Drive not found</h2>
        <p className="text-stripe-textSecondary mb-8">{message || "The placement drive you're looking for doesn't exist or has been removed."}</p>
        <button
          onClick={() => navigate('/dashboard/student/drives')}
          className="px-6 py-3 bg-stripe-text text-white rounded-xl font-bold hover:bg-brand-primary transition-colors"
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
   */
  const getStepState = (stepIndex) => {
    if (!appStatus) {
      return stepIndex === 0 ? 'current' : 'upcoming';
    }

    const statusToCurrentStep = {
      'applied': 0, 
      'shortlisted': 1,
      'not-shortlisted': 1, 
      'test-cleared': 2,
      'test-failed': 2, 
      'interview-scheduled': 3,
      'selected': 4,
      'rejected': 4,
    };

    const currentStepIndex = statusToCurrentStep[appStatus] ?? 0;
    const isFinalNegative = ['not-shortlisted', 'test-failed', 'rejected'].includes(appStatus);

    if (stepIndex < currentStepIndex) return 'completed';
    if (stepIndex === currentStepIndex) {
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
        className="inline-flex items-center text-stripe-textSecondary hover:text-stripe-text font-bold mb-8 group transition-colors text-sm"
      >
        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
        Back to Placement Drives
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Left Column: Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-stripe-border p-6 sm:p-8 shadow-sm"
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-8">
              <CompanyLogo
                logo={currentDrive.companyLogo}
                companyName={currentDrive.companyName}
                className="w-20 h-20 bg-white rounded-xl flex items-center justify-center border border-stripe-border overflow-hidden shrink-0"
                iconClassName="w-10 h-10 text-stripe-textSecondary"
              />
              <div>
                <h1 className="text-3xl font-extrabold text-stripe-text mb-2 tracking-tight">{currentDrive.companyName}</h1>
                <div className="flex flex-wrap items-center gap-4 text-stripe-textSecondary text-sm font-medium">
                  <span className="flex items-center"><MapPin className="w-4 h-4 mr-1.5" />{currentDrive.location}</span>
                  <span className="flex items-center"><Briefcase className="w-4 h-4 mr-1.5" />{currentDrive.jobType}</span>
                </div>
              </div>
              <div className="sm:ml-auto flex flex-col items-start sm:items-end gap-2">
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest border ${
                  isProfileIncomplete ? 'border-warning/20 bg-warning/5 text-warning' :
                    !isEligible ? 'border-error/20 bg-error/5 text-error' :
                      'border-success/20 bg-success/5 text-success'
                  }`}>
                  {isProfileIncomplete ? 'Incomplete Profile' : !isEligible ? 'Not Eligible' : currentDrive.status}
                </span>
                {!isEligible && (
                  <p className="text-[10px] font-bold text-error max-w-[150px] text-left sm:text-right">{reason}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 p-5 bg-stripe-bg rounded-xl border border-stripe-border/50">
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-stripe-textSecondary uppercase tracking-widest">Job Role</p>
                <p className="font-bold text-stripe-text text-sm">{currentDrive.jobRole}</p>
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-stripe-textSecondary uppercase tracking-widest">Salary (CTC)</p>
                <p className="font-bold text-stripe-text text-sm">{currentDrive.ctc}</p>
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-stripe-textSecondary uppercase tracking-widest">Deadline</p>
                <p className="font-bold text-error text-sm">{new Date(currentDrive.registrationDeadline).toLocaleDateString()}</p>
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-stripe-textSecondary uppercase tracking-widest">Drive Date</p>
                <p className="font-bold text-stripe-text text-sm">{new Date(currentDrive.driveDate).toLocaleDateString()}</p>
              </div>
            </div>
          </motion.div>

          {/* Job Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-stripe-border p-6 sm:p-8 shadow-sm"
          >
            <h2 className="text-lg font-bold text-stripe-text mb-6 flex items-center">
              <Info className="w-5 h-5 mr-3 text-stripe-textSecondary" />
              About the Company & Role
            </h2>
            <div className="prose prose-neutral max-w-none text-stripe-textSecondary text-sm font-medium leading-relaxed">
              <p className="whitespace-pre-wrap">{currentDrive.companyDescription}</p>
            </div>
            
            {currentDrive.drivePdf && (
              <div className="mt-8 pt-6 border-t border-stripe-border flex flex-wrap items-center gap-3">
                <a
                  href={currentDrive.drivePdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-stripe-bg hover:bg-stripe-border/50 text-stripe-text rounded-xl text-sm font-bold transition-all shadow-sm border border-stripe-border"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Brochure
                </a>
                <button
                  type="button"
                  onClick={() => downloadRemoteFile(currentDrive.drivePdf, `${(currentDrive.companyName || 'Job').replace(/[^a-zA-Z0-9_-]/g, '_')}_Brochure.pdf`)}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-primary hover:bg-brand-primary-dark text-white rounded-xl text-sm font-bold transition-all shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            )}
          </motion.div>

          {/* Recruitment Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl border border-stripe-border p-6 sm:p-8 shadow-sm"
          >
            <h2 className="text-lg font-bold text-stripe-text mb-8 flex items-center">
              <Clock className="w-5 h-5 mr-3 text-stripe-textSecondary" />
              Recruitment Process
            </h2>

            <div className="relative">
              {/* Vertical Line */}
              <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-stripe-border"></div>

              <div className="space-y-8 relative">
                {driveSteps.map((step, index) => (
                  <div key={index} className="flex items-start gap-6 group">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 transition-colors ${
                      step.state === 'completed' ? 'bg-success text-white ring-4 ring-white' :
                        step.state === 'current' ? 'bg-brand-primary text-white ring-4 ring-white shadow-sm' :
                          step.state === 'failed' ? 'bg-error text-white ring-4 ring-white' :
                            'bg-stripe-bg text-stripe-border ring-4 ring-white border border-stripe-border'
                      }`}>
                      {step.state === 'completed' ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : step.state === 'failed' ? (
                        <AlertTriangle className="w-3.5 h-3.5" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-current" />
                      )}
                    </div>
                    <div>
                      <h3 className={`text-sm font-bold transition-colors ${
                        step.state === 'upcoming' ? 'text-stripe-textSecondary' :
                          step.state === 'failed' ? 'text-error line-through' :
                            'text-stripe-text'
                        }`}>
                        {step.name}
                      </h3>
                      {step.date && (
                        <p className="text-xs text-stripe-textSecondary font-medium mt-1">
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

        {/* Right Column: Sticky Sidebar */}
        <div className="sticky top-8 space-y-6 self-start">
          {/* Eligibility Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl border border-stripe-border p-6 sm:p-8 shadow-sm"
          >
            <h2 className="text-lg font-bold text-stripe-text mb-6 flex items-center">
              <GraduationCap className="w-5 h-5 mr-3 text-stripe-textSecondary" />
              Eligibility Criteria
            </h2>

            <div className="space-y-3 mb-8">
              <div className="flex items-center justify-between p-3.5 bg-stripe-bg rounded-xl border border-stripe-border/50">
                <div className="flex items-center text-stripe-textSecondary font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 mr-2.5 text-success" />
                  Min. CGPA
                </div>
                <span className="font-extrabold text-stripe-text text-sm">{currentDrive.eligibility.minCgpa}</span>
              </div>
              <div className="flex items-center justify-between p-3.5 bg-stripe-bg rounded-xl border border-stripe-border/50">
                <div className="flex items-center text-stripe-textSecondary font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 mr-2.5 text-success" />
                  10th / 12th %
                </div>
                <span className="font-extrabold text-stripe-text text-sm">{currentDrive.eligibility.minTenthPercent}%</span>
              </div>
              <div className="flex items-center justify-between p-3.5 bg-stripe-bg rounded-xl border border-stripe-border/50">
                <div className="flex items-center text-stripe-textSecondary font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 mr-2.5 text-success" />
                  Max Backlogs
                </div>
                <span className="font-extrabold text-stripe-text text-sm">{currentDrive.eligibility.maxBacklogs}</span>
              </div>
            </div>

            <div className="mb-8">
              <h4 className="text-[10px] font-bold text-stripe-textSecondary uppercase tracking-widest mb-3">Eligible Branches</h4>
              <div className="flex flex-wrap gap-2">
                {currentDrive.eligibility.eligibleBranches.map((branch, i) => (
                  <span key={i} className="px-3 py-1 bg-white border border-stripe-border text-stripe-textSecondary rounded-lg text-xs font-bold shadow-sm">
                    {branch}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={handleApply}
              disabled={currentDrive.status === 'closed' || isDeadlinePassed || !isEligible || isProfileIncomplete || hasApplied || isApplying}
              className={`w-full py-3.5 rounded-xl font-bold text-sm shadow-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                currentDrive.status === 'closed' || isDeadlinePassed || !isEligible || isProfileIncomplete || hasApplied || isApplying
                  ? 'bg-stripe-bg border border-stripe-border text-stripe-textSecondary cursor-not-allowed'
                  : 'bg-brand-primary text-white hover:bg-brand-primary-dark hover:shadow'
                }`}
            >
              {isApplying ? 'Processing...' :
                hasApplied ? 'Already Applied' :
                  currentDrive.status === 'closed' ? 'Application Closed' :
                    isDeadlinePassed ? 'Deadline Passed' :
                      !isEligible ? 'Not Eligible' :
                        isProfileIncomplete ? 'Complete Profile' : 'Apply Now'}
            </button>
            <p className={`text-center text-[10px] font-bold mt-3 uppercase tracking-widest ${isDeadlinePassed || !isEligible ? 'text-error' : 'text-stripe-textSecondary'}`}>
              {isDeadlinePassed ? 'Registration deadline has passed' : !isEligible ? reason : ''}
            </p>
          </motion.div>

          {/* Quick Support/Help Card */}
          <div className="bg-brand-primary/5 rounded-2xl border border-brand-primary/20 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-stripe-text mb-2 flex items-center">
              <Users className="w-4 h-4 mr-2 text-brand-primary" />
              Need Help?
            </h3>
            <p className="text-stripe-textSecondary font-medium text-xs mb-4 leading-relaxed">
              Have questions regarding this drive or your eligibility? Contact the placement cell.
            </p>
            <button className="w-full py-2.5 bg-white hover:bg-stripe-bg text-stripe-text text-xs border border-stripe-border rounded-xl font-bold transition-colors shadow-sm">
              Contact T&P Office
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriveDetail;
