import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  GraduationCap,
  BookOpen,
  Award,
  Globe,
  Edit2,
  Save,
  X,
  Plus,
  Trash2,
  FileText,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { profileSchema } from '../../schemas/profileSchema';
import { fetchProfile, updateProfile, uploadResume, deleteResume } from '../../features/profile/profileThunks';
import toast from 'react-hot-toast';
import useAuth from '../../hooks/useAuth';
import { useConfirm } from '../../context/ConfirmContext';
import { calculateProfileCompletion } from '../../utils/profileUtils';
import DatePicker from '../../components/DatePicker';

// ── Animation Variants ──────────────────────────────────────────────
const fadeUp = {
  hidden: { y: 16, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 400, damping: 28 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

// ── Components ──────────────────────────────────────────────────────
const ProgressBar = ({ percent }) => (
  <div className="w-full h-1.5 rounded-full bg-stripe-border/60 overflow-hidden">
    <motion.div
      className="h-full rounded-full"
      style={{ backgroundColor: percent === 100 ? '#00D924' : '#635BFF' }}
      initial={{ width: 0 }}
      animate={{ width: `${percent}%` }}
      transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
    />
  </div>
);

const SectionHeader = ({ icon: Icon, title }) => (
  <div className="flex items-center gap-2 mb-6 border-b border-stripe-border pb-4">
    <Icon className="h-4 w-4 text-brand-primary" />
    <h2 className="text-[15px] font-extrabold text-stripe-text">{title}</h2>
  </div>
);

const InfoItem = ({ label, value, isEditing, register, name, error, type = "text", placeholder, onChange, currentValue }) => (
  <div className="space-y-1.5 w-full">
    <label className="text-[11px] font-bold text-stripe-textSecondary uppercase tracking-wider">{label}</label>
    {isEditing ? (
      type === "date" ? (
        <DatePicker
          value={currentValue}
          onChange={onChange}
          name={name}
          error={error}
          placeholder={placeholder || label}
        />
      ) : (
        <div className="relative">
          <input
            type={type}
            {...register(name)}
            placeholder={placeholder || label}
            className={`w-full px-3 py-2 bg-stripe-bg/50 border rounded-lg text-[13px] text-stripe-text transition-all focus:ring-2 focus:ring-brand-primary/20 outline-none ${
              error ? 'border-error bg-error/5 focus:border-error' : 'border-stripe-border focus:border-brand-primary'
            }`}
          />
          {error && <p className="mt-1 text-[10px] font-bold text-error">{error.message}</p>}
        </div>
      )
    ) : (
      <p className="text-[13px] font-semibold text-stripe-text">
        {value || <span className="text-stripe-textSecondary/50 font-normal italic">Not provided</span>}
      </p>
    )}
  </div>
);

// ── Main Page Component ─────────────────────────────────────────────

const StudentProfilePage = () => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const confirm = useConfirm();
  const { profile, loading, saving, uploading } = useSelector((state) => state.profile);
  const [isEditing, setIsEditing] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
    watch,
    control,
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      phone: '',
      dateOfBirth: '',
      gender: '',
      address: '',
      tenthPercentage: '',
      tenthBoard: '',
      tenthPassingYear: '',
      twelfthPercentage: '',
      twelfthBoard: '',
      twelfthPassingYear: '',
      cgpa: '',
      backlogs: 0,
      skills: [],
      projects: [],
      linkedIn: '',
      github: '',
    },
  });

  const { fields: projectFields, append: appendProject, remove: removeProject } = useFieldArray({
    control,
    name: "projects",
  });

  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  useEffect(() => {
    if (profile) {
      const dob = profile.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split('T')[0] : '';
      
      reset({
        ...profile,
        dateOfBirth: dob,
        tenthPercentage: profile.tenthPercentage || '',
        tenthBoard: profile.tenthBoard || '',
        tenthPassingYear: profile.tenthPassingYear || '',
        twelfthPercentage: profile.twelfthPercentage || '',
        twelfthBoard: profile.twelfthBoard || '',
        twelfthPassingYear: profile.twelfthPassingYear || '',
        cgpa: profile.cgpa || '',
        backlogs: profile.backlogs || 0,
        skills: profile.skills ? profile.skills.join(', ') : '',
        projects: profile.projects ? profile.projects.map(p => ({
          ...p,
          techStack: Array.isArray(p.techStack) ? p.techStack.join(', ') : (p.techStack || '')
        })) : [],
        linkedIn: profile.linkedIn || '',
        github: profile.github || '',
      });
    }
  }, [profile, reset]);

  const onSaveProfile = async (data) => {
    try {
      await dispatch(updateProfile(data)).unwrap();
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (err) {
      if (err.errors && Array.isArray(err.errors) && err.errors.length > 0) {
        toast.error(err.errors[0].msg || err.message || 'Validation failed');
      } else {
        toast.error(err.message || 'Failed to save profile. Please try again.');
      }
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf' || file.size > 2 * 1024 * 1024) {
      return toast.error('Only PDF files under 2MB are allowed');
    }

    const formData = new FormData();
    formData.append('resume', file);

    try {
      await dispatch(uploadResume(formData)).unwrap();
      toast.success('Resume uploaded successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to upload resume');
    }
  };

  const handleResumeDelete = async () => {
    const isConfirmed = await confirm({
      title: 'Delete Resume?',
      message: 'Are you sure you want to delete your resume? This action cannot be undone.',
      confirmText: 'Yes, Delete',
      cancelText: 'Cancel',
      type: 'danger',
    });

    if (isConfirmed) {
      try {
        await dispatch(deleteResume()).unwrap();
        toast.success('Resume deleted');
      } catch (err) {
        toast.error(err.message || 'Failed to delete resume');
      }
    }
  };

  const handleDownloadOwnResume = async () => {
    const url = profile?.resumeUrl;
    if (!url) return;
    const usn = user?.usnNumber || 'UNKNOWN';
    const firstName = (user?.fullName || 'Student').split(' ')[0];
    const filename = `${usn}-${firstName}.pdf`;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Fetch failed');
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  if (loading && !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="h-8 w-8 text-brand-primary animate-spin" />
        <p className="text-[13px] font-bold text-stripe-textSecondary">Loading your profile...</p>
      </div>
    );
  }

  const profileCompletion = calculateProfileCompletion(profile);
  const initials = user?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="max-w-[1000px] mx-auto space-y-6 pb-12"
    >
      {/* ── 1. HEADER STRIPE ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-stripe-text tracking-tight">Your Profile</h1>
          <p className="text-[13px] text-stripe-textSecondary mt-1">Manage your academic details and resume to apply for drives.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-5 py-2 bg-white border border-stripe-border text-[13px] font-bold text-stripe-text rounded-lg hover:bg-stripe-bg transition-colors shadow-stripe-sm"
            >
              <Edit2 className="h-3.5 w-3.5 text-brand-primary" />
              Edit Details
            </button>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(false)}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-white border border-stripe-border text-[13px] font-bold text-stripe-textSecondary rounded-lg hover:bg-stripe-bg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit(onSaveProfile)}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-brand-primary text-white text-[13px] font-bold rounded-lg hover:bg-brand-primary-dark transition-colors shadow-stripe-sm disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save Changes
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── 2. HERO CARD ── */}
      <motion.div variants={fadeUp} className="bg-white rounded-xl border border-stripe-border p-6 sm:p-8 flex flex-col md:flex-row items-center md:items-start gap-8">
        {/* Avatar */}
        <div className="h-28 w-28 rounded-2xl bg-brand-primary/10 flex items-center justify-center flex-shrink-0 border border-brand-primary/20">
          <span className="text-3xl font-extrabold text-brand-primary">{initials}</span>
        </div>

        {/* Info */}
        <div className="flex-1 text-center md:text-left min-w-0">
          <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
            <h2 className="text-2xl font-extrabold text-stripe-text tracking-tight truncate">
              {user?.fullName}
            </h2>
            <span className="inline-flex items-center self-center md:self-auto px-2.5 py-0.5 rounded text-[10px] font-bold bg-stripe-bg border border-stripe-border text-stripe-text uppercase tracking-wider">
              {user?.department}
            </span>
          </div>
          
          <div className="flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-2 text-[13px] font-medium text-stripe-textSecondary">
            <span className="flex items-center gap-1.5">
              <GraduationCap className="h-4 w-4 text-stripe-border" />
              {user?.yearOfStudy || 'Final Year'}
            </span>
            <span className="flex items-center gap-1.5 font-mono text-[11px]">
              <BookOpen className="h-4 w-4 text-stripe-border" />
              {user?.usnNumber}
            </span>
            <span className="flex items-center gap-1.5">
              <Mail className="h-4 w-4 text-stripe-border" />
              {user?.email}
            </span>
          </div>
        </div>

        {/* Completion Progress */}
        <div className="w-full md:w-48 flex-shrink-0 bg-stripe-bg p-4 rounded-xl border border-stripe-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-stripe-textSecondary uppercase tracking-wider">Completion</span>
            <span className={`text-sm font-extrabold ${profileCompletion === 100 ? 'text-success' : 'text-brand-primary'}`}>
              {profileCompletion}%
            </span>
          </div>
          <ProgressBar percent={profileCompletion} />
          {profileCompletion < 100 && !isEditing && (
            <p className="text-[10px] font-medium text-stripe-textSecondary mt-2 leading-tight">Complete your profile to apply for drives.</p>
          )}
        </div>
      </motion.div>

      {/* ── 3. MAIN CONTENT GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          
          {/* Personal Info */}
          <motion.div variants={fadeUp} className="bg-white rounded-xl border border-stripe-border p-6">
            <SectionHeader icon={User} title="Personal Details" />
            
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <InfoItem label="Phone Number" value={profile?.phone} isEditing={isEditing} register={register} name="phone" error={errors.phone} placeholder="10-digit mobile" />
                <InfoItem label="Date of Birth" value={profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString('en-IN') : ''} isEditing={isEditing} register={register} name="dateOfBirth" error={errors.dateOfBirth} type="date" onChange={(e) => setValue('dateOfBirth', e.target.value)} currentValue={watch('dateOfBirth')} />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-stripe-textSecondary uppercase tracking-wider">Gender</label>
                {isEditing ? (
                  <select
                    {...register('gender')}
                    className="w-full px-3 py-2 bg-stripe-bg/50 border border-stripe-border rounded-lg text-[13px] text-stripe-text focus:ring-2 focus:ring-brand-primary/20 outline-none focus:border-brand-primary transition-all"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                ) : (
                  <p className="text-[13px] font-semibold text-stripe-text">{profile?.gender || <span className="text-stripe-textSecondary/50 font-normal italic">Not provided</span>}</p>
                )}
              </div>
              
              <InfoItem label="Current Address" value={profile?.address} isEditing={isEditing} register={register} name="address" error={errors.address} placeholder="Full address" />
            </div>
          </motion.div>

          {/* Social Profiles */}
          <motion.div variants={fadeUp} className="bg-white rounded-xl border border-stripe-border p-6">
            <SectionHeader icon={Globe} title="Social Links" />
            <div className="space-y-5">
              {isEditing ? (
                <>
                  <InfoItem label="LinkedIn Profile URL" value={profile?.linkedIn} isEditing={isEditing} register={register} name="linkedIn" error={errors.linkedIn} placeholder="https://linkedin.com/in/..." />
                  <InfoItem label="GitHub Profile URL" value={profile?.github} isEditing={isEditing} register={register} name="github" error={errors.github} placeholder="https://github.com/..." />
                </>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4">
                  {profile?.linkedIn ? (
                    <a href={profile.linkedIn.startsWith('http') ? profile.linkedIn : `https://${profile.linkedIn}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center gap-3 p-3 bg-stripe-bg border border-stripe-border rounded-lg hover:border-brand-primary/30 transition-all group">
                      <div className="bg-white p-1 rounded"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/linkedin/linkedin-original.svg" alt="LinkedIn" className="w-4 h-4 group-hover:scale-110 transition-transform" /></div>
                      <span className="text-[13px] font-bold text-stripe-text">LinkedIn Profile</span>
                    </a>
                  ) : (
                    <div className="flex-1 space-y-1.5"><label className="text-[11px] font-bold text-stripe-textSecondary uppercase tracking-wider">LinkedIn</label><p className="text-[13px] text-stripe-textSecondary/50 italic">Not provided</p></div>
                  )}

                  {profile?.github ? (
                    <a href={profile.github.startsWith('http') ? profile.github : `https://${profile.github}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center gap-3 p-3 bg-stripe-bg border border-stripe-border rounded-lg hover:border-brand-primary/30 transition-all group">
                      <div className="bg-white p-1 rounded"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/github/github-original.svg" alt="GitHub" className="w-4 h-4 group-hover:scale-110 transition-transform" /></div>
                      <span className="text-[13px] font-bold text-stripe-text">GitHub Profile</span>
                    </a>
                  ) : (
                    <div className="flex-1 space-y-1.5"><label className="text-[11px] font-bold text-stripe-textSecondary uppercase tracking-wider">GitHub</label><p className="text-[13px] text-stripe-textSecondary/50 italic">Not provided</p></div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
          
          {/* Placement Resume */}
          <motion.div variants={fadeUp} className="bg-white rounded-xl border border-stripe-border p-6">
            <SectionHeader icon={FileText} title="Placement Resume" />
            
            {profile?.resumeUrl ? (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-lg bg-stripe-bg border border-stripe-border">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-white border border-stripe-border flex items-center justify-center">
                    <FileText className="h-5 w-5 text-brand-primary" />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-stripe-text">Resume Uploaded</p>
                    <p className="text-[11px] font-medium text-stripe-textSecondary mt-0.5">Ready for placement drives</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadOwnResume}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stripe-border text-stripe-text text-[11px] font-bold rounded hover:bg-stripe-bg transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" /> Download
                  </button>
                  <button
                    onClick={handleResumeDelete}
                    disabled={saving}
                    className="p-1.5 text-error hover:bg-error/10 rounded transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center border-2 border-dashed border-stripe-border rounded-lg bg-stripe-bg/50">
                <div className="h-10 w-10 rounded-full bg-stripe-bg flex items-center justify-center mb-3">
                  <Upload className="h-4 w-4 text-stripe-textSecondary" />
                </div>
                <h4 className="text-[13px] font-bold text-stripe-text">Upload Your Resume</h4>
                <p className="text-[11px] text-stripe-textSecondary mt-1 max-w-[240px]">
                  PDF files only, maximum 2MB.
                </p>
                <label className="mt-4 cursor-pointer">
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf"
                    onChange={handleResumeUpload}
                    disabled={uploading}
                  />
                  <div className={`flex items-center gap-1.5 px-4 py-2 bg-white border border-stripe-border text-stripe-text text-[12px] font-bold rounded-lg hover:bg-stripe-bg transition-all shadow-stripe-sm ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                    {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                    {uploading ? 'Uploading...' : 'Select PDF File'}
                  </div>
                </label>
              </div>
            )}
          </motion.div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          
          {/* Academic Records */}
          <motion.div variants={fadeUp} className="bg-white rounded-xl border border-stripe-border p-6">
            <SectionHeader icon={GraduationCap} title="Academic History" />
            
            <div className="space-y-4">
              {/* 10th Marks */}
              <div className="p-4 rounded-lg bg-stripe-bg border border-stripe-border">
                <h4 className="text-[11px] font-bold text-stripe-textSecondary uppercase tracking-wider mb-3">10th Standard</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <InfoItem label="Percentage" value={profile?.tenthPercentage ? `${profile.tenthPercentage}%` : ''} isEditing={isEditing} register={register} name="tenthPercentage" error={errors.tenthPercentage} type="number" />
                  <InfoItem label="Board" value={profile?.tenthBoard} isEditing={isEditing} register={register} name="tenthBoard" error={errors.tenthBoard} placeholder="e.g., CBSE" />
                  <InfoItem label="Year" value={profile?.tenthPassingYear} isEditing={isEditing} register={register} name="tenthPassingYear" error={errors.tenthPassingYear} type="number" />
                </div>
              </div>

              {/* 12th Marks */}
              <div className="p-4 rounded-lg bg-stripe-bg border border-stripe-border">
                <h4 className="text-[11px] font-bold text-stripe-textSecondary uppercase tracking-wider mb-3">12th / Diploma</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <InfoItem label="Percentage" value={profile?.twelfthPercentage ? `${profile.twelfthPercentage}%` : ''} isEditing={isEditing} register={register} name="twelfthPercentage" error={errors.twelfthPercentage} type="number" />
                  <InfoItem label="Board" value={profile?.twelfthBoard} isEditing={isEditing} register={register} name="twelfthBoard" error={errors.twelfthBoard} placeholder="e.g., State Board" />
                  <InfoItem label="Year" value={profile?.twelfthPassingYear} isEditing={isEditing} register={register} name="twelfthPassingYear" error={errors.twelfthPassingYear} type="number" />
                </div>
              </div>

              {/* Engineering Marks */}
              <div className="p-4 rounded-lg bg-brand-primary/5 border border-brand-primary/20">
                <h4 className="text-[11px] font-bold text-brand-primary uppercase tracking-wider mb-3">Graduation (Current)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoItem label="Current CGPA" value={profile?.cgpa} isEditing={isEditing} register={register} name="cgpa" error={errors.cgpa} type="number" placeholder="0.00" />
                  <InfoItem label="Active Backlogs" value={profile?.backlogs} isEditing={isEditing} register={register} name="backlogs" error={errors.backlogs} type="number" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Skills & Projects */}
          <motion.div variants={fadeUp} className="bg-white rounded-xl border border-stripe-border p-6">
            <SectionHeader icon={Award} title="Skills & Projects" />
            
            <div className="space-y-6">
              {/* Skills */}
              <div>
                <label className="text-[11px] font-bold text-stripe-textSecondary uppercase tracking-wider block mb-2">Key Skills</label>
                {isEditing ? (
                  <div className="relative">
                    <input 
                      type="text"
                      {...register("skills")}
                      className={`w-full px-3 py-2 bg-stripe-bg/50 border rounded-lg text-[13px] text-stripe-text transition-all focus:ring-2 focus:ring-brand-primary/20 outline-none ${errors.skills ? 'border-error' : 'border-stripe-border focus:border-brand-primary'}`}
                      placeholder="e.g. React, Node.js, Python (comma separated)"
                    />
                    {errors.skills && <p className="mt-1 text-[10px] font-bold text-error">{errors.skills.message}</p>}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {profile?.skills?.length > 0 ? (
                      profile.skills.map((skill, i) => (
                        <span key={i} className="px-2.5 py-1 bg-stripe-bg border border-stripe-border text-stripe-text text-[11px] font-bold rounded-md">
                          {skill}
                        </span>
                      ))
                    ) : (
                      <p className="text-[13px] text-stripe-textSecondary/50 italic">No skills added yet</p>
                    )}
                  </div>
                )}
              </div>

              {/* Projects */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-bold text-stripe-textSecondary uppercase tracking-wider">Recent Projects</label>
                  {isEditing && projectFields.length < 5 && (
                    <button
                      type="button"
                      onClick={() => appendProject({ title: '', description: '', techStack: '', link: '' })}
                      className="text-[11px] font-bold text-brand-primary hover:underline"
                    >
                      + Add Project
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-3">
                    {projectFields.map((field, index) => (
                      <div key={field.id} className="p-4 rounded-lg bg-stripe-bg border border-stripe-border relative space-y-3">
                        <button
                          type="button"
                          onClick={() => removeProject(index)}
                          className="absolute top-2 right-2 p-1 text-stripe-textSecondary hover:text-error hover:bg-error/10 rounded transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                        
                        <div>
                          <input
                            {...register(`projects.${index}.title`)}
                            className="w-full px-3 py-1.5 bg-white border border-stripe-border rounded text-[13px] font-bold outline-none focus:border-brand-primary"
                            placeholder="Project Title"
                          />
                        </div>
                        <div>
                          <textarea
                            {...register(`projects.${index}.description`)}
                            className="w-full px-3 py-1.5 bg-white border border-stripe-border rounded text-[12px] outline-none focus:border-brand-primary resize-none"
                            rows="2"
                            placeholder="Brief description..."
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            {...register(`projects.${index}.techStack`)}
                            className="w-full px-3 py-1.5 bg-white border border-stripe-border rounded text-[11px] outline-none focus:border-brand-primary"
                            placeholder="Tech (e.g. React, Node)"
                          />
                          <input
                            {...register(`projects.${index}.link`)}
                            className="w-full px-3 py-1.5 bg-white border border-stripe-border rounded text-[11px] outline-none focus:border-brand-primary"
                            placeholder="Link (e.g. GitHub URL)"
                          />
                        </div>
                      </div>
                    ))}
                    {projectFields.length === 0 && (
                      <p className="text-[12px] text-stripe-textSecondary italic text-center py-4">No projects added. Add one above.</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {profile?.projects?.length > 0 ? (
                      profile.projects.map((proj, i) => (
                        <div key={i} className="p-4 rounded-lg bg-stripe-bg border border-stripe-border">
                          <div className="flex justify-between items-start mb-1.5">
                            <h5 className="font-extrabold text-[13px] text-stripe-text">{proj.title}</h5>
                            {proj.link && (
                              <a href={proj.link} target="_blank" rel="noopener noreferrer" className="text-stripe-textSecondary hover:text-brand-primary">
                                <Globe className="h-3.5 w-3.5" />
                              </a>
                            )}
                          </div>
                          <p className="text-[12px] text-stripe-textSecondary mb-2 leading-relaxed">{proj.description}</p>
                          {proj.techStack && proj.techStack.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {proj.techStack.map((tech, idx) => (
                                <span key={idx} className="text-[9px] font-bold px-1.5 py-0.5 bg-white border border-stripe-border text-stripe-text rounded">
                                  {tech}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-[13px] text-stripe-textSecondary/50 italic">No projects listed</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default StudentProfilePage;
