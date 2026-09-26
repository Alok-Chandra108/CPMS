import { Sparkles } from 'lucide-react';
import miteIcon from '../../assets/mite-icon.svg';
import miteLogo from '../../assets/mite-logo.png';

const BrandPanel = () => {
  return (
    <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 xl:p-14 border-r border-stripe-whiteBorder bg-gradient-to-br from-white/70 to-brand-primary/5">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, black 1px, transparent 0)`, backgroundSize: '32px 32px' }} />

      {/* Top: Logo */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={miteIcon} alt="MITE" className="h-9 w-9 drop-shadow-sm" />
          <div className="h-5 w-px bg-stripe-border" />
          <img src={miteLogo} alt="MITE Mangalore" className="h-5 brightness-0 opacity-70" />
        </div>
      </div>

      {/* Center: Minimalist Headline */}
      <div className="relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/60 border border-stripe-whiteBorder shadow-sm mb-6">
          <Sparkles className="h-3.5 w-3.5 text-brand-primary" />
          <span className="text-xs font-bold text-stripe-text/70 uppercase tracking-widest">Placement Portal</span>
        </div>
        
        <h1 className="text-5xl xl:text-6xl font-extrabold text-stripe-text leading-[1.1] tracking-tight">
          Empowering <br />
          <span className="text-brand-primary">Careers.</span>
        </h1>
        <p className="mt-6 text-stripe-textSecondary text-lg leading-relaxed max-w-sm font-medium">
          The seamless, intelligent way to manage your campus placements.
        </p>
      </div>

      {/* Bottom: Ultra-sleek Trust indicator */}
      <div className="relative z-10 flex items-center gap-6">
        <div>
          <p className="text-2xl font-extrabold text-stripe-text">500+</p>
          <p className="text-xs font-bold text-stripe-textSecondary uppercase tracking-wider mt-1">Partners</p>
        </div>
        <div className="h-10 w-px bg-stripe-border" />
        <div>
          <p className="text-2xl font-extrabold text-stripe-text">3k+</p>
          <p className="text-xs font-bold text-stripe-textSecondary uppercase tracking-wider mt-1">Students</p>
        </div>
      </div>
    </div>
  );
};

export default BrandPanel;
