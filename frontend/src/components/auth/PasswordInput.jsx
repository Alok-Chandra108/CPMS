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
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
      )}
      <input
        id={id}
        type={showPassword ? 'text' : 'password'}
        placeholder={placeholder}
        className={`h-11 w-full rounded-lg border bg-white text-sm text-neutral-900 placeholder:text-neutral-400
          focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-brand-orange
          transition-all duration-200 pr-11
          ${Icon ? 'pl-10' : 'px-4'}
          ${error ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : 'border-neutral-300'}
          ${className}`}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
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