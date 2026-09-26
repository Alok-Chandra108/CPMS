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
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

// ── Components ──────────────────────────────────────────────────────

const SectionHeader = ({ icon: Icon, title, isEditing, onEdit, onCancel, onSave, isLoading }) => (
  <div className="flex items-center justify-between mb-6">
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-lg bg-brand-blue/10 text-brand-blue">
        <Icon className="h-5 w-5" />
      </div>
      <h2 className="text-xl font-bold text-neutral-900">{title}</h2>
    </div>
    {onEdit && !isEditing && (
      <button
        onClick={onEdit}
        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-brand-blue hover:bg-brand-blue/5 rounded-xl transition-all"
      >
        <Edit2 className="h-4 w-4" />
        Edit
      </button>
    )}
    {isEditing && onSave && (
      <div className="flex items-center gap-2">
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-all"
        >
          <X className="h-5 w-5" />
        </button>
        <button
          onClick={onSave}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-brand-blue text-white text-sm font-semibold rounded-xl hover:bg-brand-blue-dark transition-all shadow-sm disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save
        </button>
      </div>
    )}
  </div>
);

const InfoItem = ({ label, value, icon: Icon, isEditing, register, name, error, type = "text", placeholder, onChange, currentValue }) => (
  <div className="space-y-1.5">
    <div className="flex items-center gap-2 text-xs font-medium text-neutral-500 uppercase tracking-wider">
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {label}
    </div>
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
            className={`w-full px-4 py-2.5 bg-neutral-50 border rounded-xl text-sm transition-all focus:ring-2 focus:ring-brand-blue/20 outline-none ${
              error ? 'border-red-300 bg-red-50' : 'border-neutral-200 focus:border-brand-blue'
            }`}
          />
          {error && <p className="mt-1 text-[11px] text-red-500 font-medium pl-1">{error.message}</p>}
        </div>
      )
    ) : (
      <p className="text-[15px] font-semibold text-neutral-800 break-words">
        {value || <span className="text-neutral-400 font-normal italic">Not provided</span>}
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
      // Format date for input field (YYYY-MM-DD)
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
      // NOTE: Zod schema handles the string -> array transformation for skills and techStack via preprocess.
      // So 'data' already contains the correctly formatted payload.
      await dispatch(updateProfile(data)).unwrap();
      toast.success('Profile updated successfully ✓');
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
      toast.success('Resume uploaded successfully ✓');
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
        <Loader2 className="h-10 w-10 text-brand-blue animate-spin" />
        <p className="text-neutral-500 font-medium">Loading your profile...</p>
      </div>
    );
  }

  const profileCompletion = calculateProfileCompletion(profile);

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="max-w-5xl mx-auto space-y-8 pb-12"
    >
      {/* ── 1. HERO SECTION ───────────────────────────────────── */}
      <motion.div
        variants={fadeUp}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-blue via-[#0a4a8a] to-brand-blue-dark p-8 sm:p-10 text-white shadow-xl shadow-brand-blue/20"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-orange/10 rounded-full translate-y-1/2 -translate-x-1/4" />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
          {/* Large Avatar */}
          <div className="relative">
            <div className="h-32 w-32 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-2xl">
              <span className="text-4xl font-black text-white/90">
                {user?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </span>
            </div>
            <div className="absolute -bottom-2 -right-2 p-2 bg-brand-orange rounded-xl shadow-lg border-2 border-brand-blue">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-3">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                {user?.fullName}
              </h1>
              <span className="inline-flex items-center self-center md:self-auto px-3 py-1 rounded-full text-xs font-bold bg-brand-orange text-white uppercase tracking-wider">
                {user?.department}
              </span>
            </div>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-white/70 font-medium">
              <span className="flex items-center gap-1.5">
                <GraduationCap className="h-4 w-4" />
                {user?.yearOfStudy}
              </span>
              <span className="text-white/30">•</span>
              <span className="flex items-center gap-1.5 font-mono">
                <BookOpen className="h-4 w-4" />
                {user?.usnNumber}
              </span>
              <span className="text-white/30">•</span>
              <span className="flex items-center gap-1.5">
                <Mail className="h-4 w-4" />
                {user?.email}
              </span>
            </div>

            <div className="mt-8 flex flex-wrap justify-center md:justify-start gap-3">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-6 py-2.5 bg-white text-brand-blue font-bold rounded-xl hover:bg-neutral-100 transition-all shadow-lg"
                >
                  <Edit2 className="h-4 w-4" />
                  Edit Profile
                </button>
              ) : (
                <>
                  <button
                    onClick={handleSubmit(onSaveProfile)}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-brand-orange text-white font-bold rounded-xl hover:bg-brand-orange/90 transition-all shadow-lg disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Changes
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all border border-white/20"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Completion Progress */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative h-24 w-24">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  className="text-white/10"
                  strokeWidth="8"
                  stroke="currentColor"
                  fill="transparent"
                  r="40"
                  cx="50"
                  cy="50"
                />
                <motion.circle
                  className={profileCompletion === 100 ? "text-emerald-400" : "text-brand-orange"}
                  strokeWidth="8"
                  strokeDasharray={251.2}
                  initial={{ strokeDashoffset: 251.2 }}
                  animate={{ strokeDashoffset: 251.2 - (251.2 * profileCompletion) / 100 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="40"
                  cx="50"
                  cy="50"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-black">{profileCompletion}%</span>
              </div>
            </div>
            <span className="text-xs font-bold text-white/60 tracking-wider uppercase">Completion</span>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── 2. LEFT COLUMN: PERSONAL & SOCIAL ──────────────────── */}
        <div className="lg:col-span-1 space-y-8">
          {/* Personal Info */}
          <motion.div
            variants={fadeUp}
            className="bg-white rounded-3xl border border-neutral-200/60 p-6 shadow-sm"
          >
            <SectionHeader
              icon={User}
              title="Personal"
              isEditing={isEditing}
              // We use the hero's save/edit buttons instead of per-section
            />
            
            <div className="space-y-6">
              <InfoItem
                label="Phone Number"
                value={profile?.phone}
                icon={Phone}
                isEditing={isEditing}
                register={register}
                name="phone"
                error={errors.phone}
                placeholder="10-digit mobile"
              />
              <InfoItem
                label="Date of Birth"
                value={profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString('en-IN') : ''}
                icon={Calendar}
                isEditing={isEditing}
                register={register}
                name="dateOfBirth"
                error={errors.dateOfBirth}
                type="date"
                onChange={(e) => setValue('dateOfBirth', e.target.value)}
                currentValue={watch('dateOfBirth')}
              />
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  <User className="h-3.5 w-3.5" />
                  Gender
                </div>
                {isEditing ? (
                  <select
                    {...register('gender')}
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-blue/20 outline-none focus:border-brand-blue transition-all"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                ) : (
                  <p className="text-[15px] font-semibold text-neutral-800">{profile?.gender || 'Not specified'}</p>
                )}
              </div>
              <InfoItem
                label="Current Address"
                value={profile?.address}
                icon={MapPin}
                isEditing={isEditing}
                register={register}
                name="address"
                error={errors.address}
                placeholder="Full address"
              />
            </div>
          </motion.div>

          {/* Social Profiles */}
          <motion.div
            variants={fadeUp}
            className="bg-white rounded-3xl border border-neutral-200/60 p-6 shadow-sm"
          >
            <SectionHeader icon={Globe} title="Social" />
            <div className="space-y-6">
              {isEditing ? (
                <>
                  <InfoItem
                    label="LinkedIn Profile"
                    value={profile?.linkedIn}
                    icon={Globe}
                    isEditing={isEditing}
                    register={register}
                    name="linkedIn"
                    error={errors.linkedIn}
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                  <InfoItem
                    label="GitHub Profile"
                    value={profile?.github}
                    icon={Globe}
                    isEditing={isEditing}
                    register={register}
                    name="github"
                    error={errors.github}
                    placeholder="https://github.com/yourusername"
                  />
                </>
              ) : (
                <div className="flex flex-wrap gap-4">
                  {profile?.linkedIn ? (
                    <a
                      href={profile.linkedIn.startsWith('http') ? profile.linkedIn : `https://${profile.linkedIn}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 px-5 py-2.5 bg-white border border-neutral-200 rounded-xl hover:bg-neutral-50 hover:border-neutral-300 transition-all shadow-sm group"
                    >
                      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/linkedin/linkedin-original.svg" alt="LinkedIn" className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-bold text-neutral-700">LinkedIn</span>
                    </a>
                  ) : (
                    <div className="space-y-1.5 w-full">
                      <div className="flex items-center gap-2 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        <Globe className="h-3.5 w-3.5" />
                        LinkedIn Profile
                      </div>
                      <p className="text-[15px] font-semibold text-neutral-800 break-words">
                        <span className="text-neutral-400 font-normal italic">Not provided</span>
                      </p>
                    </div>
                  )}

                  {profile?.github ? (
                    <a
                      href={profile.github.startsWith('http') ? profile.github : `https://${profile.github}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 px-5 py-2.5 bg-white border border-neutral-200 rounded-xl hover:bg-neutral-50 hover:border-neutral-300 transition-all shadow-sm group"
                    >
                      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/github/github-original.svg" alt="GitHub" className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-bold text-neutral-700">GitHub</span>
                    </a>
                  ) : (
                    <div className="space-y-1.5 w-full">
                      <div className="flex items-center gap-2 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        <Globe className="h-3.5 w-3.5" />
                        GitHub Profile
                      </div>
                      <p className="text-[15px] font-semibold text-neutral-800 break-words">
                        <span className="text-neutral-400 font-normal italic">Not provided</span>
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* ── 3. RIGHT COLUMN: ACADEMIC & SKILLS ────────────────── */}
        <div className="lg:col-span-2 space-y-8">
          {/* Academic Records */}
          <motion.div
            variants={fadeUp}
            className="bg-white rounded-3xl border border-neutral-200/60 p-6 sm:p-8 shadow-sm"
          >
            <SectionHeader icon={GraduationCap} title="Academic Records" />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* 10th Marks */}
              <div className="space-y-6 p-5 rounded-2xl bg-neutral-50/50 border border-neutral-100">
                <h4 className="text-sm font-bold text-neutral-900 border-b border-neutral-200 pb-2">10th Standard</h4>
                <InfoItem label="Percentage" value={profile?.tenthPercentage ? `${profile.tenthPercentage}%` : ''} isEditing={isEditing} register={register} name="tenthPercentage" error={errors.tenthPercentage} type="number" />
                <InfoItem label="Board" value={profile?.tenthBoard} isEditing={isEditing} register={register} name="tenthBoard" error={errors.tenthBoard} placeholder="e.g., CBSE" />
                <InfoItem label="Passing Year" value={profile?.tenthPassingYear} isEditing={isEditing} register={register} name="tenthPassingYear" error={errors.tenthPassingYear} type="number" />
              </div>

              {/* 12th Marks */}
              <div className="space-y-6 p-5 rounded-2xl bg-neutral-50/50 border border-neutral-100">
                <h4 className="text-sm font-bold text-neutral-900 border-b border-neutral-200 pb-2">12th / Diploma</h4>
                <InfoItem label="Percentage" value={profile?.twelfthPercentage ? `${profile.twelfthPercentage}%` : ''} isEditing={isEditing} register={register} name="twelfthPercentage" error={errors.twelfthPercentage} type="number" />
                <InfoItem label="Board" value={profile?.twelfthBoard} isEditing={isEditing} register={register} name="twelfthBoard" error={errors.twelfthBoard} placeholder="e.g., KSEEB" />
                <InfoItem label="Passing Year" value={profile?.twelfthPassingYear} isEditing={isEditing} register={register} name="twelfthPassingYear" error={errors.twelfthPassingYear} type="number" />
              </div>

              {/* Engineering Marks */}
              <div className="space-y-6 p-5 rounded-2xl bg-brand-blue/[0.02] border border-brand-blue/10">
                <h4 className="text-sm font-bold text-brand-blue border-b border-brand-blue/10 pb-2">Graduation (Engg)</h4>
                <InfoItem label="Current CGPA" value={profile?.cgpa} isEditing={isEditing} register={register} name="cgpa" error={errors.cgpa} type="number" placeholder="0.00" />
                <InfoItem label="Active Backlogs" value={profile?.backlogs} isEditing={isEditing} register={register} name="backlogs" error={errors.backlogs} type="number" />
              </div>
            </div>
          </motion.div>

          {/* Skills & Projects (Simplified for now) */}
          <motion.div
            variants={fadeUp}
            className="bg-white rounded-3xl border border-neutral-200/60 p-6 sm:p-8 shadow-sm"
          >
            <SectionHeader icon={Award} title="Skills & Projects" />
            <div className="space-y-8">
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-neutral-800">Key Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {profile?.skills?.length > 0 ? (
                    profile.skills.map((skill, i) => (
                      <span key={i} className="px-3 py-1.5 bg-brand-blue-light text-brand-blue text-xs font-bold rounded-lg border border-brand-blue/10">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <p className="text-xs text-neutral-400 italic">No skills added yet</p>
                  )}
                </div>
                {isEditing ? (
                  <InfoItem 
                    label="Comma-separated skills" 
                    value={profile?.skills ? profile.skills.join(', ') : ''} 
                    isEditing={isEditing} 
                    register={register} 
                    name="skills" 
                    error={errors.skills} 
                    placeholder="e.g. React, Python, Java"
                  />
                ) : (
                  <p className="text-[10px] text-neutral-400 mt-2">Click Edit Profile to add or manage your skills.</p>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-neutral-800">Recent Projects</h4>
                  {isEditing && projectFields.length < 5 && (
                    <button
                      type="button"
                      onClick={() => appendProject({ title: '', description: '', techStack: '', link: '' })}
                      className="flex items-center gap-1 text-xs font-bold text-brand-blue hover:text-brand-blue-dark transition-all"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Project
                    </button>
                  )}
                </div>
                
                {isEditing ? (
                  <div className="space-y-4">
                    {projectFields.map((field, index) => (
                      <div key={field.id} className="p-4 rounded-xl border border-brand-blue/20 bg-brand-blue/[0.02] space-y-3 relative">
                        <button
                          type="button"
                          onClick={() => removeProject(index)}
                          className="absolute top-3 right-3 p-1 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        
                        <div>
                          <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Project Title</label>
                          <input
                            {...register(`projects.${index}.title`)}
                            className={`w-full mt-1 px-3 py-2 bg-white border rounded-lg text-sm transition-all focus:ring-2 focus:ring-brand-blue/20 outline-none ${
                              errors.projects?.[index]?.title ? 'border-red-300' : 'border-neutral-200 focus:border-brand-blue'
                            }`}
                            placeholder="e.g. E-commerce Website"
                          />
                          {errors.projects?.[index]?.title && (
                            <p className="text-xs text-red-500 mt-1">{errors.projects[index].title.message}</p>
                          )}
                        </div>
                        
                        <div>
                          <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Description</label>
                          <textarea
                            {...register(`projects.${index}.description`)}
                            className={`w-full mt-1 px-3 py-2 bg-white border rounded-lg text-sm transition-all focus:ring-2 focus:ring-brand-blue/20 outline-none resize-none ${
                              errors.projects?.[index]?.description ? 'border-red-300' : 'border-neutral-200 focus:border-brand-blue'
                            }`}
                            rows="2"
                            placeholder="Briefly describe the project..."
                          />
                          {errors.projects?.[index]?.description && (
                            <p className="text-xs text-red-500 mt-1">{errors.projects[index].description.message}</p>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Tech Stack (comma separated)</label>
                            <input
                              {...register(`projects.${index}.techStack`)}
                              className={`w-full mt-1 px-3 py-2 bg-white border rounded-lg text-sm transition-all focus:ring-2 focus:ring-brand-blue/20 outline-none ${
                                errors.projects?.[index]?.techStack ? 'border-red-300' : 'border-neutral-200 focus:border-brand-blue'
                              }`}
                              placeholder="e.g. React, Node.js, MongoDB"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Project Link</label>
                            <input
                              {...register(`projects.${index}.link`)}
                              className={`w-full mt-1 px-3 py-2 bg-white border rounded-lg text-sm transition-all focus:ring-2 focus:ring-brand-blue/20 outline-none ${
                                errors.projects?.[index]?.link ? 'border-red-300' : 'border-neutral-200 focus:border-brand-blue'
                              }`}
                              placeholder="https://github.com/..."
                            />
                            {errors.projects?.[index]?.link && (
                              <p className="text-xs text-red-500 mt-1">{errors.projects[index].link.message}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {projectFields.length === 0 && (
                      <div className="p-6 rounded-xl border-2 border-dashed border-neutral-200 flex flex-col items-center justify-center text-center">
                        <p className="text-sm text-neutral-500 font-medium">No projects added yet</p>
                        <p className="text-xs text-neutral-400 mt-1">Add projects to increase your profile completion.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {profile?.projects?.length > 0 ? (
                        profile.projects.map((proj, i) => (
                          <div key={i} className="p-4 rounded-xl border border-neutral-100 bg-neutral-50/50 hover:bg-white hover:shadow-md transition-all">
                            <div className="flex justify-between items-start mb-2">
                              <h5 className="font-bold text-neutral-900 text-sm">{proj.title}</h5>
                              {proj.link && (
                                <a href={proj.link} target="_blank" rel="noopener noreferrer" className="text-brand-blue hover:text-brand-blue-dark">
                                  <Globe className="h-3.5 w-3.5" />
                                </a>
                              )}
                            </div>
                            <p className="text-xs text-neutral-500 line-clamp-3 leading-relaxed mb-3">{proj.description}</p>
                            {proj.techStack && proj.techStack.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {proj.techStack.map((tech, idx) => (
                                  <span key={idx} className="text-[9px] font-bold px-1.5 py-0.5 bg-neutral-200 text-neutral-600 rounded">
                                    {tech}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))
                     ) : (
                       <p className="text-xs text-neutral-400 italic">No projects listed</p>
                     )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Resume Section */}
          <motion.div
            variants={fadeUp}
            className="bg-white rounded-3xl border border-neutral-200/60 p-6 sm:p-8 shadow-sm"
          >
            <SectionHeader icon={FileText} title="Placement Resume" />
            
            <div className="p-6 rounded-2xl bg-neutral-50 border-2 border-dashed border-neutral-200">
              {profile?.resumeUrl ? (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-xl bg-brand-orange/10 text-brand-orange flex items-center justify-center">
                      <FileText className="h-8 w-8" />
                    </div>
                    <div>
                      <p className="font-bold text-neutral-900">Your Resume is Uploaded</p>
                      <p className="text-xs text-neutral-500 mt-0.5">Ready for placement drives</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleDownloadOwnResume}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 text-brand-blue text-xs font-bold rounded-xl hover:bg-brand-blue/5 transition-all shadow-sm"
                      title={`Download as ${user?.usnNumber}-${(user?.fullName || '').split(' ')[0]}.pdf`}
                    >
                      Download Resume
                      <Download className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={handleResumeDelete}
                      disabled={saving}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-4 text-center">
                  <div className="h-16 w-16 rounded-2xl bg-brand-blue/5 text-brand-blue/40 flex items-center justify-center mb-4">
                    <Upload className="h-8 w-8" />
                  </div>
                  <h4 className="font-bold text-neutral-900">Upload Your Resume</h4>
                  <p className="text-xs text-neutral-500 mt-1 max-w-[240px]">
                    PDF files only, maximum 2MB. A good resume increases shortlist chances.
                  </p>
                  <label className="mt-6 cursor-pointer">
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf"
                      onChange={handleResumeUpload}
                      disabled={uploading}
                    />
                    <div className={`flex items-center gap-2 px-6 py-2.5 bg-brand-blue text-white text-xs font-bold rounded-xl hover:bg-brand-blue-dark transition-all shadow-lg ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      {uploading ? 'Uploading...' : 'Select File'}
                    </div>
                  </label>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default StudentProfilePage;
