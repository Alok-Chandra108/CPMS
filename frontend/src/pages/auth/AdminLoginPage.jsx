import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { Mail, Lock, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

import PasswordInput from '../../components/auth/PasswordInput';
import { loginSchema } from '../../schemas/authSchemas';
import { loginAdmin, logoutUser } from '../../api/authApi';
import { setCredentials, clearCredentials } from '../../features/auth/authSlice';
import { ROLES } from '../../constants/roles';
import miteLogo from '../../assets/mite-logo.png';

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: false },
  });

  useEffect(() => {
    const saved = localStorage.getItem('adminRememberedEmail');
    if (saved) { setValue('email', saved); setValue('rememberMe', true); }
  }, [setValue]);

  const onSubmitCredentials = async (data) => {
    setIsLoading(true);
    setServerError('');
    try {
      if (data.rememberMe) {
        localStorage.setItem('adminRememberedEmail', data.email);
      } else {
        localStorage.removeItem('adminRememberedEmail');
      }

      const res = await loginAdmin({ email: data.email, password: data.password });
      const user = res.data.data.user;

      if (user.role !== ROLES.ADMIN) {
        await logoutUser().catch(() => {});
        dispatch(clearCredentials());
        setServerError('Access denied. Admin credentials required.');
        return;
      }

      dispatch(setCredentials({
        user: res.data.data.user,
        accessToken: res.data.data.accessToken,
      }));

      if (user.mustChangePassword) {
        toast.success('Login successful. Please update your temporary password.', { icon: '🔑' });
        navigate('/admin/change-password', { replace: true });
      } else {
        toast.success('Welcome back, Admin!', { icon: '🛡️' });
        navigate('/dashboard/admin', { replace: true });
      }
    } catch (error) {
      const status = error.response?.status;
      const msg = error.response?.data?.message;
      if (status === 429) {
        setServerError('Too many attempts. Please wait 15 minutes.');
      } else {
        setServerError(msg || 'Login failed. Please verify your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] relative overflow-hidden px-4 font-sans">
      
      {/* --- Premium Background --- */}
      {/* 1. Subtle Dot Pattern Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }}
      />
      
      {/* 2. Animated Glowing Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center">
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.3, 0.5, 0.3] 
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-br from-blue-400/20 to-indigo-500/20 blur-[100px] -top-32 -left-32"
        />
        <motion.div
          animate={{ 
            scale: [1, 1.5, 1],
            rotate: [0, -90, 0],
            opacity: [0.2, 0.4, 0.2] 
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-bl from-orange-400/20 to-pink-500/10 blur-[120px] bottom-[-10%] right-[-10%]"
        />
      </div>

      {/* --- Main Card --- */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut', type: 'spring', bounce: 0.4 }}
        className="bg-white/70 backdrop-blur-2xl rounded-[2rem] shadow-[0_8px_40px_rgb(0,0,0,0.08)] border border-white p-8 sm:p-10 w-full max-w-[440px] relative z-10"
      >
        {/* Header */}
        <div className="mb-8 flex flex-col items-center text-center">
          <motion.img 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            src={miteLogo} alt="MITE Logo" className="h-12 mb-6" 
          />
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 shadow-sm mb-5 text-blue-600">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">
            Admin Portal
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-500">
            MITE Placement Cell &mdash; Secure Access
          </p>
        </div>

        {/* Server Error */}
        {serverError && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-6 rounded-xl bg-red-50 border border-red-100 p-4 flex items-start gap-3"
          >
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700 font-medium leading-relaxed">{serverError}</p>
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmitCredentials)} className="space-y-5">
          {/* Email */}
          <div className="space-y-2">
            <label htmlFor="admin-email" className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              Email Address
            </label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                id="admin-email"
                type="email"
                placeholder="admin@mite.ac.in"
                {...register('email')}
                className={`h-12 w-full rounded-xl border bg-white/50 pl-11 pr-4 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all duration-300 ${errors.email ? 'border-red-300 bg-red-50/50' : 'border-slate-200 hover:border-slate-300'}`}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-500 mt-1.5 ml-1 font-medium flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label htmlFor="admin-password" className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              Password
            </label>
            <div className="group">
              <PasswordInput
                id="admin-password"
                placeholder="••••••••"
                icon={Lock}
                error={errors.password}
                className="!h-12 !rounded-xl !bg-white/50 focus-within:!bg-white focus-within:!ring-4 focus-within:!ring-blue-500/10 focus-within:!border-blue-500 hover:!border-slate-300 transition-all duration-300 border-slate-200"
                {...register('password')}
              />
            </div>
            {errors.password && (
              <p className="text-xs text-red-500 mt-1.5 ml-1 font-medium flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Remember Me + Forgot Password */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2.5 cursor-pointer group">
              <div className="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  {...register('rememberMe')}
                  className="peer h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/30 transition-all cursor-pointer"
                />
              </div>
              <span className="text-sm font-medium text-slate-500 group-hover:text-slate-700 transition-colors">Keep me signed in</span>
            </label>
            <Link
              to="/forgot-password?role=admin"
              className="text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline underline-offset-4 transition-all"
            >
              Forgot access?
            </Link>
          </div>

          {/* Submit */}
          <div className="pt-4">
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.01, translateY: -1 }}
              whileTap={{ scale: 0.98 }}
              className="h-12 w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[15px] font-bold tracking-wide shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Authenticating...
                </>
              ) : (
                'Sign In securely'
              )}
            </motion.button>
          </div>
        </form>

      </motion.div>
      
      {/* Footer */}
      <p className="absolute bottom-6 text-center text-[11px] text-slate-400 uppercase tracking-[0.2em] font-bold z-10">
        &copy; {new Date().getFullYear()} MITE Placement Cell &mdash; Restricted Access
      </p>
    </div>
  );
};

export default AdminLoginPage;
