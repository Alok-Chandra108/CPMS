import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2, Briefcase, GraduationCap, Calendar, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import DatePicker from '../../../../components/DatePicker';

import { DEPARTMENTS as BRANCHES } from '../../../../constants/roles';

const JOB_TYPES = ['Full-time', 'Internship', 'Internship + Full-time'];
const STATUSES = ['upcoming', 'open', 'closed'];

const DriveModal = ({ isOpen, onClose, mode = 'create', initialData = null, onSubmit, isSubmitting }) => {
  const [formData, setFormData] = useState({
    companyName: '',
    companyLogo: '',
    drivePdf: '',
    companyDescription: '',
    jobRole: '',
    ctc: '',
    location: '',
    jobType: 'Full-time',
    eligibility: {
      minCgpa: 0,
      minTenthPercent: 0,
      minTwelfthPercent: 0,
      maxBacklogs: 0,
      eligibleBranches: [],
    },
    registrationDeadline: '',
    driveDate: '',
    status: 'upcoming',
  });

  const [activeTab, setActiveTab] = useState('company'); // company, job, eligibility, dates

  const logoInputRef = useRef(null);
  const pdfInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (logoInputRef.current) logoInputRef.current.value = '';
      if (pdfInputRef.current) pdfInputRef.current.value = '';

      if (mode === 'edit' && initialData) {
        setFormData({
          ...initialData,
          drivePdf: initialData.drivePdf || '',
          registrationDeadline: initialData.registrationDeadline ? new Date(initialData.registrationDeadline).toISOString().split('T')[0] : '',
          driveDate: initialData.driveDate ? new Date(initialData.driveDate).toISOString().split('T')[0] : '',
          eligibility: {
            minCgpa: initialData.eligibility?.minCgpa || 0,
            minTenthPercent: initialData.eligibility?.minTenthPercent || 0,
            minTwelfthPercent: initialData.eligibility?.minTwelfthPercent || 0,
            maxBacklogs: initialData.eligibility?.maxBacklogs || 0,
            eligibleBranches: initialData.eligibility?.eligibleBranches || [],
          }
        });
      } else {
        setFormData({
          companyName: '',
          companyLogo: '',
          drivePdf: '',
          removeDrivePdf: false,
          companyDescription: '',
          jobRole: '',
          ctc: '',
          location: '',
          jobType: 'Full-time',
          eligibility: {
            minCgpa: 0,
            minTenthPercent: 0,
            minTwelfthPercent: 0,
            maxBacklogs: 0,
            eligibleBranches: [],
          },
          registrationDeadline: '',
          driveDate: '',
          status: 'upcoming',
        });
      }
      setActiveTab('company');
    }
  }, [isOpen, mode, initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('eligibility.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        eligibility: { ...prev.eligibility, [field]: value }
      }));
    } else if ((name === 'companyLogo' || name === 'drivePdf') && e.target.type === 'file') {
      setFormData(prev => ({ ...prev, [name]: e.target.files[0] }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleBranchToggle = (branch) => {
    setFormData(prev => {
      const branches = prev.eligibility.eligibleBranches;
      const newBranches = branches.includes(branch)
        ? branches.filter(b => b !== branch)
        : [...branches, branch];
      
      return {
        ...prev,
        eligibility: { ...prev.eligibility, eligibleBranches: newBranches }
      };
    });
  };

  const selectAllBranches = () => {
    setFormData(prev => ({
      ...prev,
      eligibility: { ...prev.eligibility, eligibleBranches: [...BRANCHES] }
    }));
  };

  const clearBranches = () => {
    setFormData(prev => ({
      ...prev,
      eligibility: { ...prev.eligibility, eligibleBranches: [] }
    }));
  };

  const validateForm = () => {
    if (!formData.companyName.trim()) return "Company name is required.";
    if (!formData.companyDescription.trim()) return "Company description is required.";
    if (!formData.jobRole.trim()) return "Job role is required.";
    if (!formData.ctc.trim()) return "CTC is required.";
    if (!formData.location.trim()) return "Location is required.";
    if (!formData.registrationDeadline) return "Registration deadline is required.";
    if (!formData.driveDate) return "Drive date is required.";
    
    const regDate = new Date(formData.registrationDeadline);
    const drvDate = new Date(formData.driveDate);
    if (regDate > drvDate) {
      return "Registration deadline must be before or on the drive date.";
    }

    if (formData.eligibility.minCgpa < 0 || formData.eligibility.minCgpa > 10) return "Min CGPA must be between 0 and 10.";
    if (formData.eligibility.minTenthPercent < 0 || formData.eligibility.minTenthPercent > 100) return "Min 10th % must be between 0 and 100.";
    if (formData.eligibility.minTwelfthPercent < 0 || formData.eligibility.minTwelfthPercent > 100) return "Min 12th % must be between 0 and 100.";
    if (formData.eligibility.maxBacklogs < 0) return "Max backlogs cannot be negative.";
    if (formData.eligibility.eligibleBranches.length === 0) return "Select at least one eligible branch.";

    return null; // Valid
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const error = validateForm();
    if (error) {
      toast.error(error);
      return;
    }
    onSubmit(formData);
  };

  const tabs = [
    { id: 'company', label: 'Company Info', icon: Building2 },
    { id: 'job', label: 'Job Details', icon: Briefcase },
    { id: 'eligibility', label: 'Eligibility', icon: GraduationCap },
    { id: 'dates', label: 'Dates & Status', icon: Calendar },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-neutral-900/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50 shrink-0">
          <h2 className="text-xl font-bold text-neutral-900">
            {mode === 'create' ? 'Create New Placement Drive' : 'Edit Placement Drive'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Sidebar Tabs */}
          <div className="w-full md:w-64 bg-neutral-50/50 border-r border-neutral-100 p-4 shrink-0 flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                    activeTab === tab.id 
                      ? 'bg-white text-brand-blue shadow-sm border border-neutral-100' 
                      : 'text-neutral-500 hover:bg-neutral-100/50 hover:text-neutral-700'
                  }`}
                >
                  <Icon className="w-4.5 h-4.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Form Area */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-white">
            <form id="driveForm" onSubmit={handleSubmit} className="space-y-6">
              
              {/* Tab 1: Company Info */}
              <div className={activeTab === 'company' ? 'block' : 'hidden'}>
                <h3 className="text-lg font-bold text-neutral-800 mb-4">Company Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Company Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      placeholder="e.g., Google, Microsoft"
                      className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Company Logo Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      name="companyLogo"
                      ref={logoInputRef}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all outline-none"
                    />
                    {typeof formData.companyLogo === 'string' && formData.companyLogo && (
                      <p className="text-xs text-neutral-500 mt-2">Current logo is uploaded. Selecting a new file will replace it.</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Company Description <span className="text-red-500">*</span></label>
                    <textarea
                      name="companyDescription"
                      value={formData.companyDescription}
                      onChange={handleChange}
                      placeholder="Brief description about the company..."
                      rows="4"
                      className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all outline-none resize-none"
                    ></textarea>
                  </div>
                </div>
              </div>

              {/* Tab 2: Job Details */}
              <div className={activeTab === 'job' ? 'block' : 'hidden'}>
                <h3 className="text-lg font-bold text-neutral-800 mb-4">Job Details</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Job Role <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        name="jobRole"
                        value={formData.jobRole}
                        onChange={handleChange}
                        placeholder="e.g., Software Engineer"
                        className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Job Type <span className="text-red-500">*</span></label>
                      <select
                        name="jobType"
                        value={formData.jobType}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all outline-none"
                      >
                        {JOB_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-1.5">CTC / Stipend <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        name="ctc"
                        value={formData.ctc}
                        onChange={handleChange}
                        placeholder="e.g., 12 LPA, 40k/month"
                        className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Location <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        placeholder="e.g., Bangalore, Remote"
                        className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Job Brochure (PDF) <span className="text-neutral-400 font-normal ml-1">(Optional)</span></label>
                    <input
                      type="file"
                      accept=".pdf"
                      name="drivePdf"
                      ref={pdfInputRef}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all outline-none text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-brand-blue/10 file:text-brand-blue hover:file:bg-brand-blue/20"
                    />
                    {typeof formData.drivePdf === 'string' && formData.drivePdf && (
                      <div className="flex items-center gap-3 mt-2 text-xs font-medium">
                        <a href={formData.drivePdf} target="_blank" rel="noopener noreferrer" className="text-brand-blue hover:underline">View Current PDF</a>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, drivePdf: '', removeDrivePdf: true }))}
                          className="text-red-500 hover:text-red-700 font-bold hover:underline"
                        >
                          Remove PDF
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Tab 3: Eligibility */}
              <div className={activeTab === 'eligibility' ? 'block' : 'hidden'}>
                <h3 className="text-lg font-bold text-neutral-800 mb-4">Eligibility Criteria</h3>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Min CGPA</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="10"
                        name="eligibility.minCgpa"
                        value={formData.eligibility.minCgpa}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Min 10th %</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        name="eligibility.minTenthPercent"
                        value={formData.eligibility.minTenthPercent}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Min 12th %</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        name="eligibility.minTwelfthPercent"
                        value={formData.eligibility.minTwelfthPercent}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Max Backlogs</label>
                      <input
                        type="number"
                        min="0"
                        name="eligibility.maxBacklogs"
                        value={formData.eligibility.maxBacklogs}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-semibold text-neutral-700">Eligible Branches <span className="text-red-500">*</span></label>
                      <div className="flex gap-2">
                        <button type="button" onClick={selectAllBranches} className="text-xs font-bold text-brand-blue hover:underline">Select All</button>
                        <button type="button" onClick={clearBranches} className="text-xs font-bold text-neutral-500 hover:underline">Clear</button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-3 bg-neutral-50 border border-neutral-200 rounded-xl">
                      {BRANCHES.map(branch => (
                        <label key={branch} className="flex items-start gap-2 cursor-pointer p-1">
                          <input
                            type="checkbox"
                            className="mt-1 w-4 h-4 rounded border-neutral-300 text-brand-blue focus:ring-brand-blue"
                            checked={formData.eligibility.eligibleBranches.includes(branch)}
                            onChange={() => handleBranchToggle(branch)}
                          />
                          <span className="text-sm text-neutral-700 leading-snug">{branch}</span>
                        </label>
                      ))}
                    </div>
                    {formData.eligibility.eligibleBranches.length === 0 && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Please select at least one branch.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Tab 4: Dates & Status */}
              <div className={activeTab === 'dates' ? 'block' : 'hidden'}>
                <h3 className="text-lg font-bold text-neutral-800 mb-4">Dates & Status</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Registration Deadline <span className="text-red-500">*</span></label>
                      <DatePicker
                        value={formData.registrationDeadline}
                        onChange={handleChange}
                        name="registrationDeadline"
                        placeholder="Select registration deadline"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Drive Date <span className="text-red-500">*</span></label>
                      <DatePicker
                        value={formData.driveDate}
                        onChange={handleChange}
                        name="driveDate"
                        placeholder="Select drive date"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Drive Status <span className="text-red-500">*</span></label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all outline-none"
                    >
                      {STATUSES.map(status => (
                        <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-100 bg-neutral-50/50 flex justify-between items-center shrink-0">
          <div className="flex gap-2">
            {/* Tab Navigation helpers */}
            {tabs.map((tab, idx) => {
              if (tab.id === activeTab) {
                const prev = tabs[idx - 1];
                const next = tabs[idx + 1];
                return (
                  <React.Fragment key="nav-buttons">
                    {prev && (
                      <button type="button" onClick={() => setActiveTab(prev.id)} className="px-4 py-2 text-sm font-semibold text-neutral-600 hover:text-neutral-900">
                        &larr; Back
                      </button>
                    )}
                    {next && (
                      <button type="button" onClick={() => setActiveTab(next.id)} className="px-4 py-2 text-sm font-semibold text-brand-blue hover:text-brand-blue-dark">
                        Next &rarr;
                      </button>
                    )}
                  </React.Fragment>
                );
              }
              return null;
            })}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl font-semibold text-neutral-600 hover:bg-neutral-200 transition-all"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="driveForm"
              className="px-6 py-2.5 rounded-xl font-semibold bg-brand-orange text-white hover:bg-brand-orange/90 shadow-lg shadow-brand-orange/20 transition-all flex items-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : null}
              {mode === 'create' ? 'Create Drive' : 'Save Changes'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DriveModal;
