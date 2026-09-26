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
  Sparkles,
  Download,
  ExternalLink,
  Bell,
  ArrowUpRight,
  CircleDot,
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
  Placement: { bg: 'bg-brand-primary-light', text: 'text-brand-primary', dot: 'bg-brand-primary' },
  General:   { bg: 'bg-neutral-100', text: 'text-neutral-500', dot: 'bg-neutral-400' },
};

// ── Animation variants ──────────────────────────────────────────────
const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { y: 16, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 400, damping: 28 } },
};

// ── Progress bar (horizontal) ───────────────────────────────────────
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

  // ── Computed data ─────────────────────────────────────────────────
  const jobsApplied = applications.length;
  const shortlisted = applications.filter(app => ['shortlisted', 'test-cleared', 'selected'].includes(app.status)).length;
  const interviews = applications.filter(app => app.status === 'interview-scheduled').length;
  const offers = applications.filter(app => app.status === 'selected').length;

  const stats = [
    { label: 'Applied', value: jobsApplied, icon: Briefcase, accent: 'text-brand-primary', accentBg: 'bg-brand-primary/8' },
    { label: 'Shortlisted', value: shortlisted, icon: Award, accent: 'text-emerald-600', accentBg: 'bg-emerald-50' },
    { label: 'Interviews', value: interviews, icon: CalendarCheck, accent: 'text-amber-600', accentBg: 'bg-amber-50' },
    { label: 'Offers', value: offers, icon: Trophy, accent: 'text-violet-600', accentBg: 'bg-violet-50' },
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
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6 max-w-[1120px] mx-auto">

      {/* ═══════════════ ROW 1: GREETING ═══════════════ */}
      <motion.div variants={fadeUp} className="pb-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stripe-text tracking-tight flex items-center gap-2">
              Welcome back, {user?.fullName?.split(' ')[0]} <span className="text-xl">👋</span>
            </h1>
            <p className="text-sm text-stripe-textSecondary mt-1.5 flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-brand-primary">{deptShort}</span>
              <span className="text-stripe-border">·</span>
              <span>{user?.yearOfStudy || 'Final Year'}</span>
              <span className="text-stripe-border">·</span>
              <span className="font-mono text-xs">{user?.usnNumber}</span>
            </p>
          </div>
        </div>
      </motion.div>

      {/* ═══════════════ URGENT BANNER ═══════════════ */}
      <AnimatePresence>
        {urgentUnread && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-error/5 border border-error/20 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-8 w-8 rounded-lg bg-error/10 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="h-4 w-4 text-error" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-error uppercase tracking-wider">Urgent</p>
                  <p className="text-sm font-semibold text-stripe-text truncate">{urgentUnread.title}</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/dashboard/student/notices')}
                className="px-4 py-1.5 text-xs font-bold text-error bg-white border border-error/20 rounded-lg hover:bg-error/5 transition-colors whitespace-nowrap"
              >
                View Notice
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════ ROW 2: STAT CARDS ═══════════════ */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-stripe-border p-5 hover:shadow-stripe-card hover:-translate-y-0.5 transition-all duration-300 cursor-default group"
          >
            <div className={`inline-flex p-2 rounded-lg ${stat.accentBg} mb-3 group-hover:scale-110 transition-transform duration-300`}>
              <stat.icon className={`h-4 w-4 ${stat.accent}`} />
            </div>
            <motion.p
              className="text-2xl sm:text-3xl font-extrabold text-stripe-text tracking-tight"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.08 }}
            >
              {stat.value}
            </motion.p>
            <p className="text-[11px] font-bold text-stripe-textSecondary uppercase tracking-wider mt-1">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      {/* ═══════════════ ROW 3: NOTICES + DRIVES (2 column) ═══════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ── Notice Board ── */}
        <motion.div variants={fadeUp} className="bg-white rounded-xl border border-stripe-border overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-stripe-border flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-stripe-text flex items-center gap-2">
              <Bell className="h-4 w-4 text-brand-primary" />
              Notice Board
            </h2>
            <button
              onClick={() => navigate('/dashboard/student/notices')}
              className="text-[11px] font-bold text-brand-primary hover:text-brand-primary-dark transition-colors flex items-center gap-0.5"
            >
              View All <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className="divide-y divide-stripe-border/50 flex-1">
            {noticesLoading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="px-5 py-4 animate-pulse">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-3 w-16 bg-stripe-bg rounded" />
                    <div className="h-4 w-14 bg-stripe-bg rounded-full" />
                  </div>
                  <div className="h-4 w-3/4 bg-stripe-bg rounded mb-2" />
                  <div className="h-3 w-full bg-stripe-bg rounded" />
                </div>
              ))
            ) : notices.length > 0 ? (
              notices.slice(0, 3).map((item) => {
                const style = categoryStyles[item.category] || categoryStyles.General;
                return (
                  <div key={item._id} className="px-5 py-4 hover:bg-stripe-bg/50 transition-colors cursor-pointer group">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-[11px] font-semibold text-stripe-textSecondary">
                            {new Date(item.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${style.bg} ${style.text}`}>
                            <span className={`h-1 w-1 rounded-full ${style.dot}`} />
                            {item.category}
                          </span>
                        </div>
                        <h4 className="text-[13px] font-bold text-stripe-text group-hover:text-brand-primary transition-colors truncate">
                          {item.title}
                        </h4>
                        <p className="text-[11px] text-stripe-textSecondary mt-0.5 line-clamp-2">{item.body}</p>
                      </div>
                      {item.attachmentUrl && (
                        <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                          <a
                            href={item.attachmentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded bg-stripe-bg text-stripe-textSecondary hover:text-stripe-text transition-all"
                            title="View"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                          <button
                            type="button"
                            onClick={() => downloadRemoteFile(item.attachmentUrl, item.attachmentName || `${(item.title || 'Notice').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`)}
                            className="p-1 rounded bg-brand-primary-light text-brand-primary hover:bg-brand-primary hover:text-white transition-all"
                            title="Download"
                          >
                            <Download className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="px-5 py-12 text-center">
                <Bell className="h-7 w-7 text-stripe-border mx-auto mb-2" />
                <p className="text-xs text-stripe-textSecondary font-medium">No notices yet</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Placement Drives ── */}
        <motion.div variants={fadeUp} className="bg-white rounded-xl border border-stripe-border overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-stripe-border flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-stripe-text flex items-center gap-2">
              <Building2 className="h-4 w-4 text-brand-primary" />
              Placement Drives
            </h2>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-stripe-textSecondary">
              <CircleDot className="h-3 w-3 text-success" />
              {drives?.filter((d) => d.status === 'open').length || 0} Open
            </div>
          </div>
          <div className="divide-y divide-stripe-border/50 flex-1">
            {drivesLoading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="px-5 py-4 animate-pulse">
                  <div className="h-4 w-1/3 bg-stripe-bg rounded mb-2"></div>
                  <div className="h-3 w-1/2 bg-stripe-bg rounded mb-3"></div>
                  <div className="flex gap-2">
                    <div className="h-3 w-12 bg-stripe-bg rounded"></div>
                    <div className="h-3 w-12 bg-stripe-bg rounded"></div>
                  </div>
                </div>
              ))
            ) : drives.length > 0 ? (
              drives.map((drive) => (
                <Link
                  key={drive._id}
                  to={`/dashboard/student/drives/${drive._id}`}
                  className="block px-5 py-4 hover:bg-stripe-bg/50 transition-colors group"
                >
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <h4 className="text-[13px] font-bold text-stripe-text group-hover:text-brand-primary transition-colors">
                      {drive.companyName}
                    </h4>
                    <span
                      className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
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
                  <p className="text-[11px] text-stripe-textSecondary mb-2">{drive.jobRole}</p>
                  <div className="flex items-center gap-3 text-[10px] text-stripe-textSecondary flex-wrap">
                    <span className="flex items-center gap-0.5">
                      <IndianRupee className="h-2.5 w-2.5" />
                      {drive.ctc}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <MapPin className="h-2.5 w-2.5" />
                      {drive.location}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Clock className="h-2.5 w-2.5" />
                      {new Date(drive.registrationDeadline).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-2 flex-wrap">
                    {drive.eligibility?.eligibleBranches?.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-brand-primary-light text-brand-primary"
                      >
                        {tag}
                      </span>
                    ))}
                    {drive.eligibility?.eligibleBranches?.length > 2 && (
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-stripe-bg text-stripe-textSecondary">
                        +{drive.eligibility.eligibleBranches.length - 2}
                      </span>
                    )}
                  </div>
                </Link>
              ))
            ) : (
              <div className="px-5 py-12 text-center">
                <Briefcase className="h-7 w-7 text-stripe-border mx-auto mb-2" />
                <p className="text-xs text-stripe-textSecondary font-medium">No active drives</p>
              </div>
            )}
          </div>
        </motion.div>

      </div>

      {/* ═══════════════ ROW 4: NEXT STEPS ═══════════════ */}
      <AnimatePresence>
        {(profileCompletion !== 100 || !profile?.resumeUrl || jobsApplied === 0) && (
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-xl border border-stripe-border p-6"
          >
            <h2 className="text-sm font-extrabold text-stripe-text mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-brand-primary" />
              Quick Start Guide
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Step 1 */}
              <div className={`flex flex-col gap-3 p-4 rounded-lg border transition-all ${
                profileCompletion === 100 ? 'border-success/30 bg-success/5' : 'border-brand-primary/20 bg-brand-primary/5'
              }`}>
                <div className="flex items-center gap-2">
                  {profileCompletion === 100 ? (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  ) : (
                    <span className="h-5 w-5 rounded-full bg-brand-primary text-white text-[10px] font-bold flex items-center justify-center">1</span>
                  )}
                  <p className="text-xs font-bold text-stripe-text">Complete Profile</p>
                </div>
                <p className="text-[11px] text-stripe-textSecondary">Add academic details, marks, and projects.</p>
                {profileCompletion !== 100 && (
                  <button
                    onClick={() => navigate('/dashboard/student/profile')}
                    className="text-[11px] font-bold text-brand-primary hover:underline flex items-center gap-0.5 mt-auto"
                  >
                    Start <ChevronRight className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Step 2 */}
              <div className={`flex flex-col gap-3 p-4 rounded-lg border transition-all ${
                profile?.resumeUrl ? 'border-success/30 bg-success/5' : profileCompletion === 100 ? 'border-warning/20 bg-warning/5' : 'border-stripe-border bg-stripe-bg/50 opacity-60'
              }`}>
                <div className="flex items-center gap-2">
                  {profile?.resumeUrl ? (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  ) : (
                    <span className={`h-5 w-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center ${profileCompletion === 100 ? 'bg-warning' : 'bg-stripe-textSecondary/40'}`}>2</span>
                  )}
                  <p className="text-xs font-bold text-stripe-text">Upload Resume</p>
                </div>
                <p className="text-[11px] text-stripe-textSecondary">Upload your PDF resume to apply.</p>
                {!profile?.resumeUrl && profileCompletion === 100 && (
                  <button
                    onClick={() => navigate('/dashboard/student/profile')}
                    className="text-[11px] font-bold text-warning hover:underline flex items-center gap-0.5 mt-auto"
                  >
                    Upload <ChevronRight className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Step 3 */}
              <div className={`flex flex-col gap-3 p-4 rounded-lg border transition-all ${
                jobsApplied > 0 ? 'border-success/30 bg-success/5' : profile?.resumeUrl ? 'border-brand-primary/20 bg-brand-primary/5' : 'border-stripe-border bg-stripe-bg/50 opacity-60'
              }`}>
                <div className="flex items-center gap-2">
                  {jobsApplied > 0 ? (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  ) : (
                    <span className={`h-5 w-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center ${profile?.resumeUrl ? 'bg-brand-primary' : 'bg-stripe-textSecondary/40'}`}>3</span>
                  )}
                  <p className="text-xs font-bold text-stripe-text">Apply to Drives</p>
                </div>
                <p className="text-[11px] text-stripe-textSecondary">Browse and apply to eligible drives.</p>
                {jobsApplied === 0 && profile?.resumeUrl && (
                  <button
                    onClick={() => navigate('/dashboard/student/drives')}
                    className="text-[11px] font-bold text-brand-primary hover:underline flex items-center gap-0.5 mt-auto"
                  >
                    Browse <ChevronRight className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default StudentDashboardHome;
