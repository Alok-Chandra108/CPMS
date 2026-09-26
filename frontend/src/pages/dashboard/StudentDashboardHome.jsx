import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase,
  Award,
  CalendarCheck,
  Trophy,
  ChevronRight,
  Building2,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  FileText,
  IndianRupee,
  TrendingUp,
  Sparkles,
  FileDown,
  Download,
  ExternalLink,
  Bell,
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import useAuth from '../../hooks/useAuth';
import { getDrives } from '../../features/drives/driveSlice';
import { getMyApplicationsAction } from '../../features/applications/applicationSlice';
import { fetchProfile } from '../../features/profile/profileThunks';
import { getNotices } from '../../features/notices/noticeSlice';
import { calculateProfileCompletion } from '../../utils/profileUtils';
import { downloadRemoteFile } from '../../utils/exportUtils';

// ── Category badge helpers ───────────────────────────────────────────
const categoryStyles = {
  Urgent:    { bg: 'bg-rose-50',    text: 'text-rose-600',    dot: 'bg-rose-500' },
  Placement: { bg: 'bg-brand-blue-light', text: 'text-brand-blue', dot: 'bg-brand-blue' },
  General:   { bg: 'bg-neutral-100', text: 'text-neutral-600', dot: 'bg-neutral-400' },
};

// ── Animation Variants ──────────────────────────────────────────────
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

// ── Circular Progress Ring ──────────────────────────────────────────
const CircleProgress = ({ percent, size = 72, strokeWidth = 5 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={percent === 100 ? '#34D399' : '#F48120'}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeInOut', delay: 0.4 }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-white">{percent}%</span>
      </div>
    </div>
  );
};

// ── Animated Counter ────────────────────────────────────────────────
const AnimatedCounter = ({ value }) => {
  return (
    <motion.span
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="text-3xl font-black text-neutral-900 tracking-tight"
    >
      {value}
    </motion.span>
  );
};

const StudentDashboardHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { drives, isLoading: drivesLoading } = useSelector((state) => state.drives);
  const { applications } = useSelector((state) => state.applications);
  const { profile } = useSelector((state) => state.profile);
  const { notices, isLoading: noticesLoading, readNotices } = useSelector((state) => state.notices);

  useEffect(() => {
    dispatch(getDrives({ limit: 3 }));
    dispatch(getMyApplicationsAction());
    dispatch(fetchProfile());
  }, [dispatch]);

  // Calculate real stats
  const jobsApplied = applications.length;
  const shortlisted = applications.filter(app => ['shortlisted', 'test-cleared', 'selected'].includes(app.status)).length;
  const interviews = applications.filter(app => app.status === 'interview-scheduled').length;
  const offers = applications.filter(app => app.status === 'selected').length;

  const realStats = [
    { title: 'Jobs Applied', value: jobsApplied, icon: Briefcase, color: 'text-brand-blue', bgColor: 'bg-brand-blue-light', trend: 'Lifetime' },
    { title: 'Shortlisted', value: shortlisted, icon: Award, color: 'text-emerald-600', bgColor: 'bg-emerald-50', trend: 'Wait for updates' },
    { title: 'Interviews', value: interviews, icon: CalendarCheck, color: 'text-amber-600', bgColor: 'bg-amber-50', trend: 'Next: TBD' },
    { title: 'Offers', value: offers, icon: Trophy, color: 'text-violet-600', bgColor: 'bg-violet-50', trend: '🎉 Congrats!' },
  ];

  const profileCompletion = profile ? calculateProfileCompletion(profile) : 0;

  const initials = user?.fullName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '??';

  const deptShort = user?.department
    ?.replace(' (Master of Computer Applications)', '')
    ?.replace(' (Master of Business Administration)', '')
    ?.replace(' (Artificial Intelligence & Machine Learning)', '')
    ?.replace(' (IoT & Cyber Security with Blockchain Technology)', '')
    ?.replace('Computer Science & Engineering', 'CSE')
    ?.replace('Information Science & Engineering', 'ISE')
    ?.replace('Electronics & Communication Engineering', 'ECE')
    ?.replace('Artificial Intelligence & Machine Learning', 'AI/ML')
    ?.replace('Mechanical Engineering', 'ME')
    ?.replace('Aeronautical Engineering', 'AE')
    ?.replace('Civil Engineering', 'CE')
    ?.replace('Mechatronics Engineering', 'MCT')
    ?.replace('Robotics & Artificial Intelligence', 'R&AI')
    || user?.department;

  const urgentUnread = notices.find(n => n.category === 'Urgent' && !readNotices?.includes(n._id));

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6 max-w-[1200px] mx-auto"
    >
      {/* ── 0. URGENT BANNER ───────────────────────────────────── */}
      <AnimatePresence>
        {urgentUnread && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="overflow-hidden"
          >
            <div className="relative overflow-hidden bg-rose-500 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-rose-500/20 border border-rose-600">
              {/* Pulsing background effect */}
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/20 rounded-full blur-2xl animate-pulse" />
              
              <div className="flex items-start sm:items-center gap-3 sm:gap-4 relative z-10 text-white flex-1 min-w-0">
                <div className="h-10 w-10 rounded-xl bg-white/20 flex flex-shrink-0 items-center justify-center backdrop-blur-sm">
                  <AlertCircle className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-black text-sm sm:text-base uppercase tracking-wider mb-0.5 flex items-center gap-2">
                    Urgent Announcement
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                  </h3>
                  <p className="text-white/90 text-sm truncate">{urgentUnread.title}</p>
                </div>
              </div>

              <button
                onClick={() => navigate('/dashboard/student/notices')}
                className="relative z-10 w-full sm:w-auto px-5 py-2.5 bg-white text-rose-600 text-sm font-bold rounded-xl hover:bg-rose-50 transition-colors shadow-sm whitespace-nowrap"
              >
                View Notice
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 1. PROFILE HERO BANNER ─────────────────────────────── */}
      <motion.div
        variants={fadeUp}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-blue via-[#0a4a8a] to-brand-blue-dark p-6 sm:p-8 text-white"
      >
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-white/5 rounded-full" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-brand-orange/10 rounded-full" />
        <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-white/[0.03] rounded-full" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center flex-shrink-0 shadow-lg">
            <span className="text-2xl sm:text-3xl font-black text-white/90">{initials}</span>
          </div>

          <div className="flex-1 min-w-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-orange/90 text-white mb-2">
              <Sparkles className="h-3 w-3" />
              {deptShort}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight truncate">
              {user?.fullName || 'Student'}
            </h1>
            <p className="text-sm sm:text-base text-white/70 mt-1 flex items-center gap-2 flex-wrap">
              <span>{user?.yearOfStudy || 'Final Year'}</span>
              <span className="text-white/30">•</span>
              <span className="font-mono text-white/60">{user?.usnNumber}</span>
            </p>
          </div>

          <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
            <CircleProgress percent={profileCompletion} size={76} strokeWidth={5} />
            <span className="text-[11px] font-medium text-white/60 whitespace-nowrap">Profile Complete</span>
          </div>
        </div>
      </motion.div>

      {/* ── 2. QUICK STATS ROW ─────────────────────────────────── */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {realStats.map((stat, idx) => (
          <motion.div
            key={idx}
            whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}
            className="bg-white rounded-2xl border border-neutral-200/80 p-5 cursor-default transition-all duration-200 group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2.5 rounded-xl ${stat.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <TrendingUp className="h-4 w-4 text-neutral-200 group-hover:text-neutral-400 transition-colors" />
            </div>
            <AnimatedCounter value={stat.value} />
            <p className="text-sm font-medium text-neutral-500 mt-0.5">{stat.title}</p>
            <p className="text-[11px] text-neutral-400 mt-1">{stat.trend}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* ── 3. TWO-COLUMN GRID: Announcements + Drives ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-neutral-200/80 overflow-hidden">
          <div className="px-6 pt-5 pb-4 border-b border-neutral-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-brand-orange animate-pulse" />
              Notice Board
            </h2>
            <button
              onClick={() => navigate('/dashboard/student/notices')}
              className="text-xs font-semibold text-brand-blue hover:text-brand-blue-dark transition-colors"
            >
              View All
            </button>
          </div>
          <div className="divide-y divide-neutral-100">
            {noticesLoading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="px-6 py-4 animate-pulse">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-3 w-16 bg-neutral-100 rounded" />
                    <div className="h-4 w-14 bg-neutral-100 rounded-full" />
                  </div>
                  <div className="h-4 w-3/4 bg-neutral-100 rounded mb-2" />
                  <div className="h-3 w-full bg-neutral-100 rounded" />
                </div>
              ))
            ) : notices.length > 0 ? (
              notices.slice(0, 3).map((item) => {
                const style = categoryStyles[item.category] || categoryStyles.General;
                return (
                  <div key={item._id} className="px-6 py-4 hover:bg-neutral-50/50 transition-colors group cursor-pointer">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-xs font-medium text-brand-orange">
                            {new Date(item.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${style.bg} ${style.text}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                            {item.category}
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-neutral-900 group-hover:text-brand-blue transition-colors truncate">
                          {item.title}
                        </h4>
                        <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{item.body}</p>
                      </div>
                      {item.attachmentUrl && (
                        <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                          <a
                            href={item.attachmentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-700 transition-all"
                            title="View attachment (PDF)"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                          <button
                            type="button"
                            onClick={() => downloadRemoteFile(item.attachmentUrl, item.attachmentName || `${(item.title || 'Notice').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`)}
                            className="p-1.5 rounded-lg bg-brand-blue-light text-brand-blue hover:bg-brand-blue hover:text-white transition-all"
                            title={item.attachmentName ? `Download ${item.attachmentName}` : 'Download attachment'}
                          >
                            <Download className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="px-6 py-12 text-center">
                <Bell className="h-8 w-8 text-neutral-200 mx-auto mb-3" />
                <p className="text-sm text-neutral-500 font-medium">No notices yet</p>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-neutral-200/80 overflow-hidden">
          <div className="px-6 pt-5 pb-4 border-b border-neutral-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-brand-blue" />
              Placement Drives
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-neutral-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              {drives?.filter((d) => d.status === 'open').length || 0} Open
            </div>
          </div>
          <div className="divide-y divide-neutral-100">
            {drivesLoading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="px-6 py-4 animate-pulse">
                  <div className="h-4 w-1/3 bg-neutral-100 rounded mb-2"></div>
                  <div className="h-3 w-1/2 bg-neutral-100 rounded mb-3"></div>
                  <div className="flex gap-2">
                    <div className="h-3 w-12 bg-neutral-100 rounded"></div>
                    <div className="h-3 w-12 bg-neutral-100 rounded"></div>
                  </div>
                </div>
              ))
            ) : drives.length > 0 ? (
              drives.map((drive) => (
                <Link
                  key={drive._id}
                  to={`/dashboard/student/drives/${drive._id}`}
                  className="block px-6 py-4 hover:bg-neutral-50/50 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <h4 className="text-sm font-semibold text-neutral-900 group-hover:text-brand-blue transition-colors">
                      {drive.companyName}
                    </h4>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        drive.status === 'open'
                          ? 'bg-emerald-50 text-emerald-600'
                          : drive.status === 'upcoming'
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-rose-50 text-rose-600'
                      }`}
                    >
                      {drive.status}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 mb-2">{drive.jobRole}</p>
                  <div className="flex items-center gap-3 text-[11px] text-neutral-400 flex-wrap">
                    <span className="flex items-center gap-1">
                      <IndianRupee className="h-3 w-3" />
                      {drive.ctc}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {drive.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Deadline: {new Date(drive.registrationDeadline).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                    {drive.eligibility?.eligibleBranches?.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-medium px-2 py-0.5 rounded bg-brand-blue-light text-brand-blue"
                      >
                        {tag}
                      </span>
                    ))}
                    {drive.eligibility?.eligibleBranches?.length > 3 && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-neutral-100 text-neutral-500">
                        +{drive.eligibility.eligibleBranches.length - 3} more
                      </span>
                    )}
                  </div>
                </Link>
              ))
            ) : (
              <div className="px-6 py-12 text-center">
                <Briefcase className="h-8 w-8 text-neutral-200 mx-auto mb-3" />
                <p className="text-sm text-neutral-500 font-medium">No active drives found</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* ── 4. NEXT STEPS CHECKLIST ────────────────────────────── */}
      <AnimatePresence>
        {(profileCompletion !== 100 || !profile?.resumeUrl || jobsApplied === 0) && (
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, height: 0, marginTop: 0, paddingTop: 0, paddingBottom: 0, overflow: 'hidden' }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="bg-white rounded-2xl border border-neutral-200/80 p-6 sm:p-8"
          >
            <h2 className="text-lg font-bold text-neutral-900 mb-5 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-brand-blue" />
              Your Next Steps
            </h2>
            <div className="space-y-3">

              {/* Step 1: Profile — hidden once 100% complete */}
              <AnimatePresence>
                {profileCompletion !== 100 && (
                  <motion.div
                    key="step-profile"
                    initial={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: 'hidden' }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="flex gap-4 items-start p-4 rounded-xl border bg-brand-blue-light/40 border-brand-blue/10 transition-all"
                  >
                    <div className="mt-0.5 flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-brand-blue" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-neutral-900">Complete Student Profile</h4>
                      <p className="text-xs text-neutral-500 mt-0.5">Add your academic details, 10th &amp; 12th marks, and projects to get verified.</p>
                    </div>
                    <button
                      onClick={() => navigate('/dashboard/student/profile')}
                      className="hidden sm:flex items-center gap-1 px-4 py-2 bg-brand-blue text-white text-xs font-semibold rounded-lg hover:bg-brand-blue-dark transition-colors shadow-sm"
                    >
                      Start <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Step 2: Resume — hidden once uploaded */}
              <AnimatePresence>
                {!profile?.resumeUrl && (
                  <motion.div
                    key="step-resume"
                    initial={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: 'hidden' }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className={`flex gap-4 items-start p-4 rounded-xl border transition-all ${
                      profileCompletion === 100
                        ? 'bg-brand-orange/5 border-brand-orange/10'
                        : 'border-neutral-100 bg-neutral-50/50 opacity-60'
                    }`}
                  >
                    <div className="mt-0.5 flex-shrink-0">
                      <FileText className={`h-5 w-5 ${profileCompletion === 100 ? 'text-brand-orange' : 'text-neutral-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-sm font-bold ${profileCompletion === 100 ? 'text-neutral-900' : 'text-neutral-800'}`}>
                        Upload Placement Resume
                      </h4>
                      <p className="text-xs text-neutral-500 mt-0.5">Upload your PDF resume to start applying for drives.</p>
                    </div>
                    {profileCompletion === 100 ? (
                      <button
                        onClick={() => navigate('/dashboard/student/profile')}
                        className="hidden sm:flex items-center gap-1 px-4 py-2 bg-brand-orange text-white text-xs font-semibold rounded-lg hover:bg-brand-orange-dark transition-colors shadow-sm"
                      >
                        Upload <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <span className="hidden sm:inline-block px-3 py-1 bg-neutral-200 text-neutral-500 text-[10px] font-semibold rounded-full">Locked</span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Step 3: Apply — hidden once at least one application submitted */}
              <AnimatePresence>
                {jobsApplied === 0 && (
                  <motion.div
                    key="step-apply"
                    initial={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: 'hidden' }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className={`flex gap-4 items-start p-4 rounded-xl border transition-all ${
                      profile?.resumeUrl ? 'bg-brand-blue-light/40 border-brand-blue/10' : 'border-neutral-100 bg-neutral-50/50 opacity-60'
                    }`}
                  >
                    <div className="mt-0.5 flex-shrink-0">
                      <Briefcase className={`h-5 w-5 ${profile?.resumeUrl ? 'text-brand-blue' : 'text-neutral-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-sm font-bold ${profile?.resumeUrl ? 'text-neutral-900' : 'text-neutral-800'}`}>Apply to Placement Drives</h4>
                      <p className="text-xs text-neutral-500 mt-0.5">Browse eligible drives and apply with a single click once resume is uploaded.</p>
                    </div>
                    {profile?.resumeUrl ? (
                      <button
                        onClick={() => navigate('/dashboard/student/drives')}
                        className="hidden sm:flex items-center gap-1 px-4 py-2 bg-brand-blue text-white text-xs font-semibold rounded-lg hover:bg-brand-blue-dark transition-colors shadow-sm"
                      >
                        Browse <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <span className="hidden sm:inline-block px-3 py-1 bg-neutral-200 text-neutral-500 text-[10px] font-semibold rounded-full">Locked</span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default StudentDashboardHome;
