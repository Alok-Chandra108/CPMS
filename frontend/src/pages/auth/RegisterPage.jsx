import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { User, Mail, Hash, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthLayout from '../../components/auth/AuthLayout';
import PasswordInput from '../../components/auth/PasswordInput';
import PasswordStrength from '../../components/auth/PasswordStrength';
import { registerSchema } from '../../schemas/authSchemas';
import { registerUser } from '../../api/authApi';
import { DEPARTMENTS, YEARS_OF_STUDY } from '../../constants/roles';
import miteLogo from '../../assets/mite-logo.png';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

const RegisterPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      usnNumber: '',
      department: '',
      yearOfStudy: '',
      password: '',
      confirmPassword: '',
      agreeToTerms: false,
    },
  });

  const watchPassword = watch('password');

  const onSubmit = async (data) => {
    setIsLoading(true);
    setServerError('');

    try {
      const res = await registerUser({
        fullName: data.fullName,
        email: data.email,
        usnNumber: data.usnNumber,
        department: data.department,
        yearOfStudy: data.yearOfStudy,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });

      // Store email in sessionStorage for verify page
      sessionStorage.setItem('verifyEmail', data.email);

      toast.success('Account created! Please verify your email.');
      navigate('/verify-email');
    } catch (error) {
      const msg = error.response?.data?.message || 'Registration failed. Please try again.';
      setServerError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const FormError = ({ message }) =>
    message ? (
      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
        <AlertCircle className="h-3 w-3 flex-shrink-0" />
        {message}
      </p>
    ) : null;

  return (
    <AuthLayout>
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-8 w-full max-w-md">
        {/* Header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <img src={miteLogo} alt="MITE Logo" className="h-10 mb-4" />
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Create your account
          </h1>
          <p className="mt-1.5 text-sm text-neutral-600">
            Join the placement portal and get started
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
        <form onSubmit={handleSubmit(onSubmit)}>
          <motion.div
            className="space-y-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Full Name */}
            <motion.div variants={itemVariants}>
              <label htmlFor="fullName" className="block text-xs font-medium text-neutral-500 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  id="fullName"
                  type="text"
                  placeholder="e.g. Arjun Sharma"
                  {...register('fullName')}
                  className={`h-11 w-full rounded-lg border bg-white pl-10 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-brand-orange transition-all duration-200 ${
                    errors.fullName ? 'border-red-400' : 'border-neutral-300'
                  }`}
                />
              </div>
              <FormError message={errors.fullName?.message} />
            </motion.div>

            {/* Email */}
            <motion.div variants={itemVariants}>
              <label htmlFor="email" className="block text-xs font-medium text-neutral-500 mb-1.5">
                College Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  id="email"
                  type="email"
                  placeholder="yourname@mite.ac.in"
                  {...register('email')}
                  className={`h-11 w-full rounded-lg border bg-white pl-10 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-brand-orange transition-all duration-200 ${
                    errors.email ? 'border-red-400' : 'border-neutral-300'
                  }`}
                />
              </div>
              <p className="text-[11px] text-neutral-400 mt-1">Use your official college email only</p>
              <FormError message={errors.email?.message} />
            </motion.div>

            {/* USN Number */}
            <motion.div variants={itemVariants}>
              <label htmlFor="usnNumber" className="block text-xs font-medium text-neutral-500 mb-1.5">
                USN Number
              </label>
              <div className="relative">
                <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  id="usnNumber"
                  type="text"
                  placeholder="e.g. 4MT25MC007"
                  {...register('usnNumber')}
                  className={`h-11 w-full rounded-lg border bg-white pl-10 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-brand-orange transition-all duration-200 ${
                    errors.usnNumber ? 'border-red-400' : 'border-neutral-300'
                  }`}
                />
              </div>
              <FormError message={errors.usnNumber?.message} />
            </motion.div>

            {/* Department & Year — side by side */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="department" className="block text-xs font-medium text-neutral-500 mb-1.5">
                  Department
                </label>
                <select
                  id="department"
                  {...register('department')}
                  className={`h-11 w-full rounded-lg border bg-white px-3 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-brand-orange transition-all duration-200 appearance-none ${
                    errors.department ? 'border-red-400' : 'border-neutral-300'
                  } ${!watch('department') ? 'text-neutral-400' : ''}`}
                >
                  <option value="">Select</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <FormError message={errors.department?.message} />
              </div>
              <div>
                <label htmlFor="yearOfStudy" className="block text-xs font-medium text-neutral-500 mb-1.5">
                  Year of Study
                </label>
                <select
                  id="yearOfStudy"
                  {...register('yearOfStudy')}
                  className={`h-11 w-full rounded-lg border bg-white px-3 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-brand-orange transition-all duration-200 appearance-none ${
                    errors.yearOfStudy ? 'border-red-400' : 'border-neutral-300'
                  } ${!watch('yearOfStudy') ? 'text-neutral-400' : ''}`}
                >
                  <option value="">Select</option>
                  {YEARS_OF_STUDY.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <FormError message={errors.yearOfStudy?.message} />
              </div>
            </motion.div>

            {/* Password */}
            <motion.div variants={itemVariants}>
              <label htmlFor="password" className="block text-xs font-medium text-neutral-500 mb-1.5">
                Password
              </label>
              <PasswordInput
                id="password"
                placeholder="Create a strong password"
                error={errors.password}
                {...register('password')}
              />
              <PasswordStrength password={watchPassword} />
              <FormError message={errors.password?.message} />
            </motion.div>

            {/* Confirm Password */}
            <motion.div variants={itemVariants}>
              <label htmlFor="confirmPassword" className="block text-xs font-medium text-neutral-500 mb-1.5">
                Confirm Password
              </label>
              <PasswordInput
                id="confirmPassword"
                placeholder="Re-enter your password"
                error={errors.confirmPassword}
                {...register('confirmPassword')}
              />
              <FormError message={errors.confirmPassword?.message} />
            </motion.div>

            {/* Terms */}
            <motion.div variants={itemVariants} className="flex items-start gap-2.5 pt-1">
              <input
                id="agreeToTerms"
                type="checkbox"
                {...register('agreeToTerms')}
                className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-brand-orange focus:ring-brand-orange"
              />
              <label htmlFor="agreeToTerms" className="text-xs text-neutral-600 leading-relaxed">
                I agree to the{' '}
                <button type="button" className="text-brand-blue font-medium hover:text-brand-blue-dark underline-offset-4 hover:underline">
                  Terms & Conditions
                </button>{' '}
                and{' '}
                <button type="button" className="text-brand-blue font-medium hover:text-brand-blue-dark underline-offset-4 hover:underline">
                  Privacy Policy
                </button>
              </label>
            </motion.div>
            <FormError message={errors.agreeToTerms?.message} />

            {/* Submit */}
            <motion.div variants={itemVariants} className="pt-2">
              <motion.button
                type="submit"
                disabled={isLoading}
                whileTap={{ scale: 0.98 }}
                className="h-11 w-full rounded-lg bg-brand-orange text-white text-sm font-semibold tracking-wide hover:bg-orange-600 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </motion.button>
            </motion.div>
          </motion.div>
        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-neutral-600">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-brand-blue font-medium hover:text-brand-blue-dark underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default RegisterPage;
