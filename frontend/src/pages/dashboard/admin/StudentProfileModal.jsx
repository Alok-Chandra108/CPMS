import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../../api/adminApi';
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  BookOpen,
  Award,
  Briefcase,
  Code2,
  Link,
  Globe,
  FileText,
  Download,
  ExternalLink,
  GraduationCap,
  Tag,
  AlertCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react';

/* ─── helpers ───────────────────────────────────────────────── */
const fmt = (v) => (v !== null && v !== undefined && v !== '' ? v : '—');
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

function InfoRow({ icon: Icon, label, value, className = '' }) {
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
        <Icon className="w-4 h-4 text-indigo-500" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-medium text-gray-800 mt-0.5 break-words">{fmt(value)}</p>
      </div>
    </div>
  );
}

function SectionHeading({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="w-4 h-4 text-indigo-500" />
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-widest">{title}</h3>
    </div>
  );
}

function Pill({ text, color = 'indigo' }) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    rose: 'bg-rose-50 text-rose-700 border-rose-100',
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[color] ?? colors.indigo}`}
    >
      {text}
    </span>
  );
}

/* ─── skeleton ──────────────────────────────────────────────── */
function ModalSkeleton() {
  return (
    <div className="animate-pulse space-y-6 p-6">
      {/* header */}
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-gray-200" />
        <div className="space-y-2">
          <div className="h-5 w-48 bg-gray-200 rounded" />
          <div className="h-3 w-32 bg-gray-200 rounded" />
          <div className="h-3 w-40 bg-gray-200 rounded" />
        </div>
      </div>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="space-y-3">
          <div className="h-4 w-32 bg-gray-200 rounded" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-10 bg-gray-100 rounded-lg" />
            <div className="h-10 bg-gray-100 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── main modal ────────────────────────────────────────────── */
const StudentProfileModal = ({ studentId, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  const handleDownloadResume = async () => {
    const url = data?.profile?.resumeUrl;
    const usn = data?.user?.usnNumber || 'UNKNOWN';
    const firstName = (data?.user?.fullName || 'Student').split(' ')[0];
    const filename = `${usn}-${firstName}.pdf`;

    try {
      setDownloading(true);
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch resume');
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      // Fallback: open in new tab if fetch fails (e.g. strict CORS)
      window.open(url, '_blank', 'noopener,noreferrer');
    } finally {
      setDownloading(false);
    }
  };

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await adminApi.getStudentById(studentId);
      if (res.success) {
        setData(res.data);
      } else {
        setError(res.message || 'Failed to load student profile.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const { user, profile } = data ?? {};

  /* completion badge */
  const completion = user?.profileComplete ?? 0;
  const completionColor =
    completion >= 75 ? 'emerald' : completion >= 40 ? 'amber' : 'rose';

  return (
    /* backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Student Profile"
    >
      {/* panel */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden"
        style={{ animation: 'modal-enter 0.22s ease-out' }}
      >
        {/* ── close button ── */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>

        {/* ── scrollable body ── */}
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <ModalSkeleton />
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
              <AlertCircle className="w-12 h-12 text-rose-400 mb-3" />
              <p className="text-gray-700 font-medium">{error}</p>
              <button
                onClick={fetchProfile}
                className="mt-4 text-sm text-indigo-600 hover:underline"
              >
                Try again
              </button>
            </div>
          ) : (
            <>
              {/* ─── HEADER BAND ────────────────────────────────── */}
              <div className="bg-gradient-to-br from-indigo-600 to-violet-600 px-6 py-8 text-white">
                <div className="flex items-center gap-5">
                  {/* avatar */}
                  <div className="w-20 h-20 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center text-3xl font-bold text-white flex-shrink-0">
                    {user?.fullName?.charAt(0)?.toUpperCase() ?? '?'}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl font-bold tracking-tight truncate">
                      {user?.fullName}
                    </h2>
                    <p className="text-indigo-200 text-sm mt-0.5 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" /> {user?.email}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="text-xs bg-white/20 border border-white/30 rounded-full px-2.5 py-0.5">
                        {user?.usnNumber}
                      </span>
                      <span className="text-xs bg-white/20 border border-white/30 rounded-full px-2.5 py-0.5">
                        {user?.yearOfStudy}
                      </span>
                      {user?.isVerified ? (
                        <span className="text-xs bg-emerald-500/30 border border-emerald-400/40 rounded-full px-2.5 py-0.5 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Verified
                        </span>
                      ) : (
                        <span className="text-xs bg-amber-500/30 border border-amber-400/40 rounded-full px-2.5 py-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Unverified
                        </span>
                      )}
                    </div>
                  </div>

                  {/* completion ring */}
                  <div className="hidden sm:flex flex-col items-center flex-shrink-0">
                    <div className="relative w-16 h-16">
                      <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                        <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="6" />
                        <circle
                          cx="32" cy="32" r="26"
                          fill="none"
                          stroke="white"
                          strokeWidth="6"
                          strokeDasharray={`${(completion / 100) * 163.4} 163.4`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                        {completion}%
                      </span>
                    </div>
                    <p className="text-xs text-indigo-200 mt-1">Profile</p>
                  </div>
                </div>

                {/* dept */}
                <p className="mt-3 text-sm text-indigo-100 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{user?.department}</span>
                </p>
              </div>

              {/* ─── BODY SECTIONS ──────────────────────────────── */}
              <div className="px-6 py-6 space-y-8">

                {/* ── Personal Info ─────────────────────────────── */}
                <section>
                  <SectionHeading icon={User} title="Personal Information" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InfoRow icon={Phone} label="Phone" value={profile?.phone} />
                    <InfoRow icon={Calendar} label="Date of Birth" value={fmtDate(profile?.dateOfBirth)} />
                    <InfoRow icon={User} label="Gender" value={profile?.gender} />
                    <InfoRow icon={MapPin} label="Address" value={profile?.address} />
                  </div>
                </section>

                <hr className="border-gray-100" />

                {/* ── Academics ─────────────────────────────────── */}
                <section>
                  <SectionHeading icon={BookOpen} title="Academic Details" />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    <div className="bg-indigo-50 rounded-xl p-4 text-center">
                      <p className="text-xs text-indigo-400 font-medium uppercase tracking-wide">CGPA</p>
                      <p className="text-2xl font-bold text-indigo-700 mt-1">
                        {profile?.cgpa ?? '—'}
                      </p>
                    </div>
                    <div className="bg-violet-50 rounded-xl p-4 text-center">
                      <p className="text-xs text-violet-400 font-medium uppercase tracking-wide">10th %</p>
                      <p className="text-2xl font-bold text-violet-700 mt-1">
                        {profile?.tenthPercentage != null ? `${profile.tenthPercentage}%` : '—'}
                      </p>
                    </div>
                    <div className="bg-fuchsia-50 rounded-xl p-4 text-center">
                      <p className="text-xs text-fuchsia-400 font-medium uppercase tracking-wide">12th %</p>
                      <p className="text-2xl font-bold text-fuchsia-700 mt-1">
                        {profile?.twelfthPercentage != null ? `${profile.twelfthPercentage}%` : '—'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InfoRow icon={Award} label="10th Board" value={profile?.tenthBoard} />
                    <InfoRow icon={Calendar} label="10th Passing Year" value={profile?.tenthPassingYear} />
                    <InfoRow icon={Award} label="12th Board" value={profile?.twelfthBoard} />
                    <InfoRow icon={Calendar} label="12th Passing Year" value={profile?.twelfthPassingYear} />
                    <InfoRow icon={BookOpen} label="Active Backlogs" value={profile?.backlogs ?? 0} />
                  </div>
                </section>

                <hr className="border-gray-100" />

                {/* ── Skills ────────────────────────────────────── */}
                <section>
                  <SectionHeading icon={Code2} title="Skills" />
                  {profile?.skills?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.map((skill) => (
                        <Pill key={skill} text={skill} color="indigo" />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">No skills listed.</p>
                  )}
                </section>

                {/* ── Certifications ────────────────────────────── */}
                {profile?.certifications?.length > 0 && (
                  <>
                    <hr className="border-gray-100" />
                    <section>
                      <SectionHeading icon={Award} title="Certifications" />
                      <div className="flex flex-wrap gap-2">
                        {profile.certifications.map((cert) => (
                          <Pill key={cert} text={cert} color="emerald" />
                        ))}
                      </div>
                    </section>
                  </>
                )}

                <hr className="border-gray-100" />

                {/* ── Projects ──────────────────────────────────── */}
                <section>
                  <SectionHeading icon={Briefcase} title="Projects" />
                  {profile?.projects?.length > 0 ? (
                    <div className="space-y-3">
                      {profile.projects.map((proj) => (
                        <div
                          key={proj._id}
                          className="border border-gray-100 rounded-xl p-4 hover:border-indigo-200 hover:bg-indigo-50/30 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-semibold text-gray-800">{proj.title}</h4>
                            {proj.link && (
                              <a
                                href={proj.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-shrink-0 flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                              >
                                <ExternalLink className="w-3.5 h-3.5" /> View
                              </a>
                            )}
                          </div>
                          {proj.description && (
                            <p className="text-xs text-gray-500 mt-1">{proj.description}</p>
                          )}
                          {proj.techStack?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {proj.techStack.map((t) => (
                                <span
                                  key={t}
                                  className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 rounded-md px-2 py-0.5"
                                >
                                  <Tag className="w-2.5 h-2.5" /> {t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">No projects listed.</p>
                  )}
                </section>

                <hr className="border-gray-100" />

                {/* ── Social Links ──────────────────────────────── */}
                <section>
                  <SectionHeading icon={ExternalLink} title="Social & Links" />
                  <div className="flex flex-wrap gap-3">
                    {profile?.linkedIn ? (
                      <a
                        href={profile.linkedIn}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100 transition-colors"
                      >
                        <Globe className="w-4 h-4" /> LinkedIn
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-100 bg-gray-50 text-gray-400 text-sm">
                        <Globe className="w-4 h-4" /> Not linked
                      </span>
                    )}
                    {profile?.github ? (
                      <a
                        href={profile.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-800 bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors"
                      >
                        <Link className="w-4 h-4" /> GitHub
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-100 bg-gray-50 text-gray-400 text-sm">
                        <Link className="w-4 h-4" /> Not linked
                      </span>
                    )}
                  </div>
                </section>

              </div>{/* end body */}
            </>
          )}
        </div>

        {/* ── FOOTER: resume action ── */}
        {!loading && !error && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-500">
                {profile?.resumeUrl ? 'Resume uploaded' : 'No resume uploaded'}
              </span>
            </div>
            <div className="flex gap-2">
              {profile?.resumeUrl && (
                <>
                  <button
                    onClick={handleDownloadResume}
                    disabled={downloading}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-wait"
                    title={`Download as ${user?.usnNumber}-${(user?.fullName || '').split(' ')[0]}.pdf`}
                  >
                    <Download className="w-4 h-4" />
                    {downloading ? 'Downloading…' : 'Download'}
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-100 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>

      {/* animation keyframe via inline style tag */}
      <style>{`
        @keyframes modal-enter {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    }
        }
      `}</style>
    </div>
  );
};

export default StudentProfileModal;
