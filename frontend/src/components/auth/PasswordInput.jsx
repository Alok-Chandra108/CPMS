import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const PasswordInput = ({
  id,
  placeholder = 'Enter password',
  icon: Icon,
  error,
  className = '',
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      {Icon && (
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stripe-textSecondary pointer-events-none" />
      )}
      <input
        id={id}
        type={showPassword ? 'text' : 'password'}
        placeholder={placeholder}
        className={`h-12 w-full rounded-xl border bg-white/80  text-sm font-medium text-stripe-text placeholder:text-stripe-textSecondary
          focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary shadow-sm
          transition-all duration-200 pr-11
          ${Icon ? 'pl-10' : 'px-4'}
          ${error ? 'border-error focus:ring-error/20 focus:border-error' : 'border-stripe-border'}
          ${className}`}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stripe-textSecondary hover:text-stripe-text transition-colors"
        tabIndex={-1}
      >
        {showPassword ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </button>
    </div>
  );
};

export default PasswordInput;
