import React, { useState } from 'react';
import { Building2 } from 'lucide-react';

const CompanyLogo = ({ 
  logo, 
  companyName = '', 
  className = "w-12 h-12 rounded-xl flex items-center justify-center border border-neutral-200 shadow-sm overflow-hidden bg-white shrink-0", 
  iconClassName = "w-6 h-6 text-neutral-400",
  imgClassName = "w-full h-full object-cover"
}) => {
  const [hasError, setHasError] = useState(false);

  // Generate a consistent color based on company name
  const getAvatarColor = (name) => {
    if (!name) return 'bg-neutral-100 text-neutral-600';
    const colors = [
      'bg-blue-50 text-blue-600 border-blue-100',
      'bg-indigo-50 text-indigo-600 border-indigo-100',
      'bg-purple-50 text-purple-600 border-purple-100',
      'bg-pink-50 text-pink-600 border-pink-100',
      'bg-rose-50 text-rose-600 border-rose-100',
      'bg-orange-50 text-orange-600 border-orange-100',
      'bg-amber-50 text-amber-600 border-amber-100',
      'bg-emerald-50 text-emerald-600 border-emerald-100',
      'bg-teal-50 text-teal-600 border-teal-100',
      'bg-cyan-50 text-cyan-600 border-cyan-100',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const firstLetter = companyName ? companyName.trim().charAt(0).toUpperCase() : '';

  if (logo && !hasError) {
    return (
      <div className={className}>
        <img 
          src={logo} 
          alt={companyName} 
          className={imgClassName} 
          onError={() => setHasError(true)}
        />
      </div>
    );
  }

  // Fallback to letter avatar if name is available, otherwise Building2 icon
  if (firstLetter) {
    const colorClasses = getAvatarColor(companyName);
    return (
      <div className={`${className} ${colorClasses} border font-bold text-lg flex items-center justify-center select-none`}>
        {firstLetter}
      </div>
    );
  }

  return (
    <div className={`${className} bg-neutral-50`}>
      <Building2 className={iconClassName} />
    </div>
  );
};

export default CompanyLogo;
