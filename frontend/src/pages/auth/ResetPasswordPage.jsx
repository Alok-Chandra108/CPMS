import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, XCircle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthLayout from '../../components/auth/AuthLayout';
import PasswordInput from '../../components/auth/PasswordInput';
import PasswordStrength from '../../components/auth/PasswordStrength';
import { resetPasswordSchema } from '../../schemas/authSchemas';
import { validateResetToken, resetPassword } from '../../api/authApi';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [pageState, setPageState] = useState('loading'); // loading | valid | invalid | success
  const [userRole, setUserRole] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  const watchPassword = watch('newPassword');

  // Validate token on mount
  useEffect(() => {
    const validate = async () => {
      try {
        const res = await validateResetToken({ token });
        const data = res.data?.data;
        if (data?.valid) {
          setUserRole(data.role);
          setPageState('valid');
        } else {
          setPageState('invalid');
        }
      } catch {
        setPageState('invalid');
      }
    };

    if (token) {
      validate();
    } else {
      setPageState('invalid');
    }
  }, [token]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    setServerError('');

    try {
      await resetPassword({
        token,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      });

      setPageState('success');
      toast.success('Password updated successfully!');
    } catch (err) {
      const msg = err.response?.data?.message || 'Password reset failed. Please try again.';
      setServerError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (pageState === 'loading') {
    return (
      <AuthLayout>
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-8 w-full max-w-md">
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 text-brand-orange animate-spin mb-4" />
            <p className="text-sm text-neutral-600">Validating reset link...</p>
          </div>
        </div>
      </AuthLayout>
    );
  }

  // Invalid / expired token
  if (pageState === 'invalid') {
    return (
      <AuthLayout>
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-8 w-full max-w-md">
          <div className="text-center py-4">
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 18 }}
              className="flex justify-center mb-5"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                <XCircle className="h-8 w-8 text-error" />
              </div>
            </motion.div>

            <h2 className="text-xl font-bold tracking-tight text-neutral-900 mb-2">
              Link expired or invalid
            </h2>
            <p className="text-sm text-neutral-600 leading-relaxed mb-6">
              This reset link has expired or has already been used. Please request a new one.
            </p>

            <Link
              to="/forgot-password"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-orange px-8 text-sm font-semibold text-white hover:bg-orange-600 transition-all duration-200"
            >
              Request a new link
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  // Success state
  if (pageState === 'success') {
    return (
      <AuthLayout>
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-8 w-full max-w-md">
          <div className="text-center py-4">
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 18 }}
              className="flex justify-center mb-5"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
            </motion.div>

            <h2 className="text-xl font-bold tracking-tight text-neutral-900 mb-2">
              Password updated!
            </h2>
            <p className="text-sm text-neutral-600 leading-relaxed mb-6">
              You can now log in with your new password.
            </p>

            <Link
              to={userRole === 'admin' ? '/admin/login' : '/login'}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-orange px-8 text-sm font-semibold text-white hover:bg-orange-600 transition-all duration-200"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  // Valid token — show reset form
  return (
    <AuthLayout>
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-8 w-full max-w-md">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Set new password
          </h1>
          <p className="mt-1.5 text-sm text-neutral-600">
            Choose a strong password for your account
          </p>
        </div>

        {/* Server Error */}
        {serverError && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700">{serverError}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* New Password */}
          <div>
            <label htmlFor="newPassword" className="block text-xs font-medium text-neutral-500 mb-1.5">
              New Password
            </label>
            <PasswordInput
              id="newPassword"
              placeholder="Create a strong password"
              error={errors.newPassword}
              {...register('newPassword')}
            />
            <PasswordStrength password={watchPassword} />
            {errors.newPassword && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.newPassword.message}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmNewPassword" className="block text-xs font-medium text-neutral-500 mb-1.5">
              Confirm New Password
            </label>
            <PasswordInput
              id="confirmNewPassword"
              placeholder="Re-enter your new password"
              error={errors.confirmPassword}
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Submit */}
          <div className="pt-2">
            <motion.button
              type="submit"
              disabled={isLoading}
              whileTap={{ scale: 0.98 }}
              className="h-11 w-full rounded-lg bg-brand-orange text-white text-sm font-semibold tracking-wide hover:bg-orange-600 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Password'
              )}
            </motion.button>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
};

export default ResetPasswordPage;
