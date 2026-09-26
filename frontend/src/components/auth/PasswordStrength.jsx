import { calculatePasswordStrength } from '../../utils/passwordStrength';

const PasswordStrength = ({ password }) => {
  const { score, label, color } = calculatePasswordStrength(password);

  if (!password) return null;

  // Max score is 6
  const percentage = Math.min((score / 6) * 100, 100);

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-neutral-500">Password strength</span>
        <span
          className={`text-xs font-medium ${
            label === 'Weak'
              ? 'text-red-600'
              : label === 'Fair'
              ? 'text-amber-600'
              : 'text-green-600'
          }`}
        >
          {label}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-neutral-200 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default PasswordStrength;
