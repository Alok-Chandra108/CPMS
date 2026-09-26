import { GraduationCap, Briefcase, BarChart3 } from 'lucide-react';
import miteIcon from '../../assets/mite-icon.svg';
import miteLogo from '../../assets/mite-logo.png';

const BrandPanel = () => {
  return (
    <div className="hidden lg:flex lg:w-1/2 bg-brand-blue relative overflow-hidden flex-col justify-between p-10 xl:p-14">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.04]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      {/* Top: Logo */}
      <div className="relative z-10">
        <div className="flex items-center gap-3">
          <img src={miteIcon} alt="MITE" className="h-10 w-10" />
          <div className="h-6 w-px bg-white/30" />
          <img src={miteLogo} alt="MITE Mangalore" className="h-6 brightness-0 invert opacity-90" />
        </div>
      </div>

      {/* Center: Headline */}
      <div className="relative z-10 space-y-6">
        <h1 className="text-3xl xl:text-4xl font-bold text-white leading-tight tracking-tight">
          Connecting Students{' '}
          <br />
          to Opportunities
        </h1>
        <p className="text-blue-200 text-base leading-relaxed max-w-sm">
          The official placement portal of Mangalore Institute of Technology & Engineering
        </p>

        {/* Feature Bullets */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
              <GraduationCap className="h-5 w-5 text-brand-orange" />
            </div>
            <span className="text-sm text-blue-100">Student profile & resume management</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
              <Briefcase className="h-5 w-5 text-brand-orange" />
            </div>
            <span className="text-sm text-blue-100">Campus recruitment drives & scheduling</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
              <BarChart3 className="h-5 w-5 text-brand-orange" />
            </div>
            <span className="text-sm text-blue-100">Real-time placement analytics & reports</span>
          </div>
        </div>
      </div>

      {/* Bottom: Trust strip */}
      <div className="relative z-10">
        <div className="border-t border-white/10 pt-6">
          <p className="text-xs text-blue-300 tracking-wide">
            Trusted by <span className="text-white font-semibold">500+</span> companies &{' '}
            <span className="text-white font-semibold">3000+</span> students
          </p>
          <div className="mt-3 flex items-center gap-4">
            {['TCS', 'Infosys', 'Wipro', 'IBM', 'Accenture'].map((name) => (
              <div
                key={name}
                className="rounded bg-white/10 px-3 py-1.5 text-[10px] font-semibold text-blue-200 tracking-wider uppercase"
              >
                {name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandPanel;
