import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const OTPInput = ({ length = 6, onComplete, error, disabled = false }) => {
  const [otp, setOtp] = useState(new Array(length).fill(''));
  const [shake, setShake] = useState(false);
  const inputRefs = useRef([]);

  // Focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Trigger shake on error
  useEffect(() => {
    if (error) {
      setShake(true);
      // Clear OTP and refocus first
      setOtp(new Array(length).fill(''));
      setTimeout(() => {
        setShake(false);
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
      }, 400);
    }
  }, [error, length]);

  const handleChange = (e, index) => {
    const value = e.target.value;

    // Only allow single digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-advance to next box
    if (value && index < length - 1) {
      inputRefs.current[index + 1].focus();
    }

    // Check if all filled — auto-submit after debounce
    const filled = newOtp.join('');
    if (filled.length === length) {
      setTimeout(() => {
        onComplete?.(filled);
      }, 300);
    }
  };

  const handleKeyDown = (e, index) => {
    // Backspace: clear current and move to previous
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1].focus();
      }
    }

    // Arrow keys
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1].focus();
    }
    if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();

    // Only process if it's digits and correct length
    if (/^\d+$/.test(pasteData)) {
      const digits = pasteData.slice(0, length).split('');
      const newOtp = new Array(length).fill('');

      digits.forEach((digit, i) => {
        newOtp[i] = digit;
      });

      setOtp(newOtp);

      // Focus last filled or last input
      const focusIndex = Math.min(digits.length, length) - 1;
      inputRefs.current[focusIndex]?.focus();

      // Auto-submit if full
      if (digits.length >= length) {
        setTimeout(() => {
          onComplete?.(newOtp.join(''));
        }, 300);
      }
    }
  };

  const handleFocus = (e) => {
    e.target.select();
  };

  return (
    <motion.div
      className="flex items-center justify-center gap-2.5 sm:gap-3"
      animate={shake ? { x: [0, -8, 8, -8, 8, 0] } : {}}
      transition={{ duration: 0.4 }}
    >
      {otp.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          onFocus={handleFocus}
          disabled={disabled}
          className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-2xl font-mono font-semibold
            rounded-lg border-2 bg-white
            focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange
            transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-red-400' : 'border-neutral-300'}
          `}
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        />
      ))}
    </motion.div>
  );
};

export default OTPInput;
