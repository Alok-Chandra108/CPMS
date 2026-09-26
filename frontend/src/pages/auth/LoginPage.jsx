import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { Mail, Lock, Loader2, AlertCircle, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthLayout from '../../components/auth/AuthLayout';
import PasswordInput from '../../components/auth/PasswordInput';
import { loginSchema } from '../../schemas/authSchemas';
import { loginUser as loginApi } from '../../api/authApi';
import { resendOTP } from '../../api/authApi';
import { setCredentials } from '../../features/auth/authSlice';
import { DASHBOARD_ROUTES } from '../../constants/roles';
import miteLogo from '../../assets/mite-logo.png';

const LoginPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  // Load remembered email
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setValue('email', savedEmail);
      setValue('rememberMe', true);
    }
  }, [setValue]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    setServerError('');
    setNeedsVerification(false);

    try {
      // Remember email if checkbox is checked
      if (data.rememberMe) {
        localStorage.setItem('rememberedEmail', data.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      const res = await loginApi({
        email: data.email,
        password: data.password,
      });

      // Dispatch credentials to Redux
      dispatch(
        setCredentials({
          user: res.data.data.user,
          accessToken: res.data.data.accessToken,
        })
      );

      toast.success('Welcome back!');

      // Role-based redirect
      const role = res.data.data.user.role;
      const dashboardRoute = DASHBOARD_ROUTES[role] || '/dashboard/student';
      navigate(dashboardRoute, { replace: true });
    } catch (error) {
      const status = error.response?.status;
      const data = error.response?.data;

      if (status === 403 && data?.errors?.needsVerification) {
        setNeedsVerification(true);
        setUnverifiedEmail(data.errors.email || '');
      } else if (status === 429) {
        setServerError('Too many login attempts. Try again in 15 minutes.');
      } else {
        setServerError(data?.message || 'Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!unverifiedEmail) return;
    try {
      sessionStorage.setItem('verifyEmail', unverifiedEmail);
      await resendOTP({ email: unverifiedEmail });
      toast.success('Verification email sent!');
      navigate('/verify-email');
    } catch (err) {
      toast.error('Failed to resend verification email.');
    }
  };

  return (
    <AuthLayout>
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-8 w-full max-w-md">
        {/* Header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <img src={miteLogo} alt="MITE Logo" className="h-10 mb-4" />
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Welcome back
          </h1>
          <p className="mt-1.5 text-sm text-neutral-600">
            Sign in to your placement portal
          </p>
        </div>

        {/* Verification Banner */}
        {needsVerification && (
          <div className="mb-4 rounded-lg bg-blue-50 border border-blue-200 p-3">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-blue-800">
                  Please verify your email before logging in.
                </p>
                <button
                  type="button"
                  onClick={handleResendVerification}
                  className="mt-1 text-sm font-medium text-blue-700 hover:text-blue-900 underline underline-offset-2"
                >
                  Resend verification email
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Server Error */}
        {serverError && !needsVerification && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700">{serverError}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email */}
          <div>
            <label htmlFor="login-email" className="block text-xs font-medium text-neutral-500 mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                id="login-email"
                type="email"
                placeholder="yourname@mite.ac.in"
                {...register('email')}
                className={`h-11 w-full rounded-lg border bg-white pl-10 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-brand-orange transition-all duration-200 ${errors.email ? 'border-red-400' : 'border-neutral-300'
                  }`}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="login-password" className="block text-xs font-medium text-neutral-500 mb-1.5">
              Password
            </label>
            <PasswordInput
              id="login-password"
              placeholder="Enter your password"
              icon={Lock}
              error={errors.password}
              {...register('password')}
            />
            {errors.password && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Remember Me + Forgot Password */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('rememberMe')}
                className="h-4 w-4 rounded border-neutral-300 text-brand-orange focus:ring-brand-orange"
              />
              <span className="text-xs text-neutral-600">Remember me</span>
            </label>
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-brand-blue hover:text-brand-blue-dark underline-offset-4 hover:underline transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <motion.button
              type="submit"
              disabled={isLoading}
              whileTap={{ scale: 0.98 }}
              className="h-11 w-full rounded-lg bg-brand-orange text-white text-sm font-semibold tracking-wide hover:bg-orange-600 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </motion.button>
          </div>
        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-neutral-600">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="text-brand-blue font-medium hover:text-brand-blue-dark underline-offset-4 hover:underline"
          >
            Register
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default LoginPage;
