import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock, Eye, EyeOff, Loader2, AlertCircle, ShieldCheck,
  Check, X, ChevronRight, LogOut,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminChangePassword, logoutUser } from '../../api/authApi';
import { clearCredentials } from '../../features/auth/authSlice';

// ─── Password Requirement Checklist ──────────────────────────────────────────
const PasswordRequirement = ({ met, text }) => (
  <div className="flex items-center gap-2 text-xs">
    <div className={`h-4 w-4 rounded-full flex items-center justify-center border transition-all duration-300
      ${met 
        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 scale-105' 
        : 'border-white/10 text-white/30'
      }`}
    >
      {met ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5" />}
    </div>
    <span className={`transition-colors duration-300 ${met ? 'text-emerald-300/80 font-medium' : 'text-white/40'}`}>
      {text}
    </span>
  </div>
);

// ─── Particles background matching AdminLoginPage ────────────────────────────
const Particles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {Array.from({ length: 15 }).map((_, i) => (
      <motion.div
        key={i}
        className="absolute rounded-full bg-indigo-500/10"
        style={{
          width: Math.random() * 5 + 2,
          height: Math.random() * 5 + 2,
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
        }}
        animate={{
          y: [0, -35, 0],
          opacity: [0.15, 0.5, 0.15],
        }}
        transition={{
          duration: Math.random() * 5 + 4,
          repeat: Infinity,
          delay: Math.random() * 3,
          ease: 'easeInOut',
        }}
      />
    ))}
  </div>
);

const AdminChangePasswordPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Success screen transition state
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const newPasswordVal = watch('newPassword', '');
  const confirmPasswordVal = watch('confirmPassword', '');

  // Live validation checks
  const checks = {
    length: newPasswordVal.length >= 8,
    hasUpper: /[A-Z]/.test(newPasswordVal),
    hasLower: /[a-z]/.test(newPasswordVal),
    hasNumber: /[0-9]/.test(newPasswordVal),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(newPasswordVal),
    matchesConfirm: confirmPasswordVal && newPasswordVal === confirmPasswordVal,
  };

  const allMet = Object.values(checks).every(Boolean);

  const onSubmit = async (data) => {
    if (!allMet) {
      setServerError('Please ensure all password requirements are satisfied.');
      return;
    }

    setIsLoading(true);
    setServerError('');
    try {
      await adminChangePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      });

      // Successful change: trigger animation
      setIsSuccess(true);
      toast.success('Password updated successfully!', { icon: '🔑' });

      // Automatically logout and redirect after 3 seconds
      setTimeout(async () => {
        try {
          await logoutUser();
        } catch (e) {
          // ignore logout errors
        } finally {
          dispatch(clearCredentials());
          navigate('/admin/login', { replace: true });
        }
      }, 3000);
    } catch (error) {
      const msg = error.response?.data?.message;
      setServerError(msg || 'Failed to update password. Please check your current password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelLogout = async () => {
    try {
      setIsLoading(true);
      await logoutUser();
    } catch (e) {
      // ignore
    } finally {
      dispatch(clearCredentials());
      navigate('/admin/login', { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080818] px-4 relative overflow-hidden font-sans">
      {/* Glow effect backgrounds */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-56 h-56 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
      <Particles />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-[440px] relative z-10"
      >
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl shadow-black/50 p-8 overflow-hidden">
          
          <AnimatePresence mode="wait">
            {!isSuccess ? (
              <motion.div
                key="form-container"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                {/* Header */}
                <div className="flex flex-col items-center text-center mb-6">
                  <div className="relative mb-5">
                    <div className="absolute inset-0 bg-violet-500/30 rounded-2xl blur-xl" />
                    <div className="relative h-14 w-14 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                      <Lock className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <h1 className="text-2xl font-extrabold text-white tracking-tight">Security Update</h1>
                  <p className="text-sm text-white/40 mt-1.5 leading-relaxed">
                    As a Super Admin, you are required to change your temporary password to secure this portal.
                  </p>
                </div>

                {/* Error Banner */}
                {serverError && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-5 rounded-xl bg-red-500/10 border border-red-500/30 p-3.5 flex items-start gap-3"
                  >
                    <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-300 leading-relaxed">{serverError}</p>
                  </motion.div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {/* Current Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white/50 uppercase tracking-widest">Temporary / Current Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                      <input
                        type={showCurrent ? 'text' : 'password'}
                        placeholder="••••••••"
                        {...register('currentPassword', { required: 'Temporary password is required' })}
                        disabled={isLoading}
                        className={`h-12 w-full rounded-xl border bg-white/5 pl-11 pr-12 text-sm text-white placeholder:text-white/20
                          transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/60
                          ${errors.currentPassword ? 'border-red-500/50' : 'border-white/10'}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrent(!showCurrent)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                      >
                        {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.currentPassword && (
                      <p className="text-[11px] text-red-400 ml-1">{errors.currentPassword.message}</p>
                    )}
                  </div>

                  {/* New Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white/50 uppercase tracking-widest">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                      <input
                        type={showNew ? 'text' : 'password'}
                        placeholder="••••••••"
                        {...register('newPassword')}
                        disabled={isLoading}
                        className="h-12 w-full rounded-xl border border-white/10 bg-white/5 pl-11 pr-12 text-sm text-white placeholder:text-white/20
                          transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/60"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew(!showNew)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                      >
                        {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white/50 uppercase tracking-widest">Confirm New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        placeholder="••••••••"
                        {...register('confirmPassword')}
                        disabled={isLoading}
                        className="h-12 w-full rounded-xl border border-white/10 bg-white/5 pl-11 pr-12 text-sm text-white placeholder:text-white/20
                          transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/60"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                      >
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Requirements Checklist */}
                  <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 mt-2 space-y-2.5">
                    <p className="text-xs font-bold text-white/50 uppercase tracking-wider mb-1">Requirements</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                      <PasswordRequirement met={checks.length} text="At least 8 characters" />
                      <PasswordRequirement met={checks.hasUpper} text="One uppercase letter" />
                      <PasswordRequirement met={checks.hasLower} text="One lowercase letter" />
                      <PasswordRequirement met={checks.hasNumber} text="One digit (0-9)" />
                      <PasswordRequirement met={checks.hasSpecial} text="One special character" />
                      <PasswordRequirement met={checks.matchesConfirm} text="Passwords match" />
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex flex-col gap-3 pt-3">
                    <motion.button
                      type="submit"
                      disabled={isLoading || !allMet}
                      whileHover={{ scale: allMet ? 1.01 : 1 }}
                      whileTap={{ scale: allMet ? 0.98 : 1 }}
                      className="h-12 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-bold
                        shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/45 hover:from-indigo-500 hover:to-violet-500
                        transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /><span>Saving...</span></>
                      ) : (
                        <><span>Update & Secure Account</span><ChevronRight className="h-4 w-4" /></>
                      )}
                    </motion.button>

                    <button
                      type="button"
                      onClick={handleCancelLogout}
                      disabled={isLoading}
                      className="h-10 text-xs font-medium text-white/40 hover:text-white/70 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Sign Out
                    </button>
                  </div>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="success-container"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6 space-y-6 flex flex-col items-center"
              >
                <div className="relative">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="h-20 w-20 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20"
                  >
                    <ShieldCheck className="h-10 w-10 text-emerald-400 animate-pulse" />
                  </motion.div>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.8, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl -z-10"
                  />
                </div>

                <div className="space-y-2 max-w-[280px]">
                  <h2 className="text-xl font-bold text-white tracking-tight">Portal Secured!</h2>
                  <p className="text-sm text-white/50 leading-relaxed">
                    Your password has been successfully updated. Logging you out to establish a secure session...
                  </p>
                </div>

                <div className="flex items-center gap-2.5 text-xs text-indigo-300 font-semibold bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-4 py-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Redirecting to Admin Login</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-[11px] text-white/20 uppercase tracking-widest font-bold">
          &copy; {new Date().getFullYear()} MITE Placement Cell &mdash; Restricted Access
        </p>
      </motion.div>
    </div>
  );
};

export default AdminChangePasswordPage;
