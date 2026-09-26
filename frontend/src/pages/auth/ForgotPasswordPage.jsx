import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Mail, Loader2, AlertCircle, MailCheck, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthLayout from '../../components/auth/AuthLayout';
import { forgotPasswordSchema } from '../../schemas/authSchemas';
import { forgotPassword } from '../../api/authApi';

const ForgotPasswordPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);

    try {
      await forgotPassword({ email: data.email });
      setSubmittedEmail(data.email);
      setIsSuccess(true);
    } catch (err) {
      // Always show success for security (server does same)
      setSubmittedEmail(data.email);
      setIsSuccess(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-8 w-full max-w-md">
        {!isSuccess ? (
          <>
            {/* Back link */}
            <Link
              to={role === 'admin' ? '/admin/login' : '/login'}
              className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 transition-colors mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </Link>

            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
                Reset your password
              </h1>
              <p className="mt-1.5 text-sm text-neutral-600">
                Enter your registered email and we'll send you a reset link.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label htmlFor="forgot-email" className="block text-xs font-medium text-neutral-500 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  <input
                    id="forgot-email"
                    type="email"
                    placeholder="yourname@mite.ac.in"
                    {...register('email')}
                    className={`h-11 w-full rounded-lg border bg-white pl-10 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-brand-orange transition-all duration-200 ${
                      errors.email ? 'border-red-400' : 'border-neutral-300'
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
                      Sending...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </motion.button>
              </div>
            </form>
          </>
        ) : (
          /* Success State */
          <div className="text-center py-4">
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 18 }}
              className="flex justify-center mb-5"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-orange-light">
                <MailCheck className="h-8 w-8 text-brand-orange" />
              </div>
            </motion.div>

            <h2 className="text-xl font-bold tracking-tight text-neutral-900 mb-2">
              Reset link sent!
            </h2>
            <p className="text-sm text-neutral-600 leading-relaxed mb-6">
              Check your inbox at{' '}
              <span className="font-medium text-neutral-900">{submittedEmail}</span>{' '}
              for a password reset link. The link expires in 15 minutes.
            </p>

            <Link
              to={role === 'admin' ? '/admin/login' : '/login'}
              className="inline-flex h-11 items-center justify-center rounded-lg border border-neutral-300 bg-white px-8 text-sm font-medium text-neutral-700 hover:bg-neutral-100 transition-all duration-150"
            >
              Back to Login
            </Link>
          </div>
        )}
      </div>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
