import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MailCheck, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import AuthLayout from '../../components/auth/AuthLayout';
import OTPInput from '../../components/auth/OTPInput';
import { verifyEmail, resendOTP, updateVerifyEmail } from '../../api/authApi';
import useCountdown from '../../hooks/useCountdown';

const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpError, setOtpError] = useState(false);
  const [email, setEmail] = useState('');
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const { seconds, isActive, start, formattedTime } = useCountdown(60);

  useEffect(() => {
    const storedEmail = sessionStorage.getItem('verifyEmail');
    if (storedEmail) {
      setEmail(storedEmail);
    } else {
      navigate('/register');
    }
  }, [navigate]);

  // Mask email for display
  const maskedEmail = email
    ? email.replace(/(.{2})(.*)(@)/, (_, a, b, c) => a + '*'.repeat(b.length) + c)
    : '';

  const handleOTPComplete = async (otp) => {
    setIsLoading(true);
    setError('');
    setOtpError(false);

    try {
      await verifyEmail({ email, otp });
      sessionStorage.removeItem('verifyEmail');
      toast.success('Email verified! You can now log in.');
      navigate('/login');
    } catch (err) {
      const msg = err.response?.data?.message || 'Verification failed. Please try again.';
      setError(msg);
      setOtpError(true);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await resendOTP({ email });
      start(); // Start cooldown timer
      toast.success('OTP resent to your email.');
      setError('');
      setOtpError(false);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to resend OTP.';
      toast.error(msg);
    }
  };

  const handleUpdateEmail = async () => {
    if (!newEmail || !/^\S+@\S+\.\S+$/.test(newEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (newEmail === email) {
      setIsEditingEmail(false);
      return;
    }

    setIsUpdatingEmail(true);
    try {
      await updateVerifyEmail({ oldEmail: email, newEmail });
      setEmail(newEmail);
      sessionStorage.setItem('verifyEmail', newEmail);
      setIsEditingEmail(false);
      start(); // Restart countdown for the new OTP
      toast.success('Email updated and new OTP sent!');
      setError('');
      setOtpError(false);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update email.';
      toast.error(msg);
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  return (
    <AuthLayout>
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-8 w-full max-w-md">
        {/* Icon */}
        <div className="flex justify-center mb-5">
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 18 }}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-blue-light"
          >
            <MailCheck className="h-8 w-8 text-brand-blue" />
          </motion.div>
        </div>

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Verify your email
          </h1>
          <div className="mt-1.5 flex flex-col items-center justify-center gap-1">
            <p className="text-sm text-neutral-600">
              We've sent a 6-digit OTP to
            </p>
            {isEditingEmail ? (
              <div className="flex items-center gap-2 w-full mt-1">
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="h-9 flex-1 rounded-md border border-neutral-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-brand-orange"
                  placeholder="Enter correct email"
                  autoFocus
                />
                <button
                  onClick={handleUpdateEmail}
                  disabled={isUpdatingEmail}
                  className="h-9 px-3 rounded-md bg-brand-orange text-white text-xs font-semibold hover:bg-orange-600 disabled:opacity-50"
                  id="update-email-btn"
                >
                  {isUpdatingEmail ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}
                </button>
                <button
                  onClick={() => setIsEditingEmail(false)}
                  className="text-xs text-neutral-500 hover:text-neutral-700"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-medium text-neutral-900">{maskedEmail}</span>
                <button
                  onClick={() => {
                    setNewEmail(email);
                    setIsEditingEmail(true);
                  }}
                  className="text-xs text-brand-blue hover:underline font-medium"
                  id="edit-email-btn"
                >
                  Edit
                </button>
              </div>
            )}
          </div>
        </div>

        {/* OTP Input */}
        <div className="mb-6">
          <OTPInput
            length={6}
            onComplete={handleOTPComplete}
            error={otpError}
            disabled={isLoading}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 flex items-center justify-center gap-1.5 text-sm text-red-600">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Verify button */}
        <motion.button
          type="button"
          disabled={isLoading}
          whileTap={{ scale: 0.98 }}
          onClick={() => {}}
          className="h-11 w-full rounded-lg bg-brand-orange text-white text-sm font-semibold tracking-wide hover:bg-orange-600 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-6"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            'Verify OTP'
          )}
        </motion.button>

        {/* Resend */}
        <div className="text-center space-y-1.5">
          <p className="text-sm text-neutral-500">Didn't receive the code?</p>
          {isActive ? (
            <p className="text-sm text-neutral-400">
              Resend in <span className="font-mono font-medium text-neutral-600">{formattedTime}</span>
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              className="text-sm font-medium text-brand-blue hover:text-brand-blue-dark underline-offset-4 hover:underline transition-colors"
            >
              Resend OTP
            </button>
          )}
        </div>

        {/* Back to login */}
        <div className="mt-6 pt-4 border-t border-neutral-100 text-center">
          <Link
            to="/login"
            className="text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
          >
            ← Back to login
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};

export default VerifyEmailPage;
