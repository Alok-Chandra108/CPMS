/**
 * Calculate password strength
 * @param {string} password
 * @returns {{ score: number, label: string, color: string }}
 */
export const calculatePasswordStrength = (password) => {
  if (!password) return { score: 0, label: '', color: '' };

  let score = 0;

  // Length checks
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;

  // Character variety
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;

  // Determine label and color
  if (score <= 2) {
    return { score, label: 'Weak', color: 'bg-red-500' };
  } else if (score <= 4) {
    return { score, label: 'Fair', color: 'bg-amber-500' };
  } else {
    return { score, label: 'Strong', color: 'bg-green-500' };
  }
};
