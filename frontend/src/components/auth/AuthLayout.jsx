import { motion } from 'framer-motion';
import BrandPanel from './BrandPanel';
import miteIcon from '../../assets/mite-icon.svg';

const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex bg-neutral-50">
      {/* Left — Brand Panel (desktop only) */}
      <BrandPanel />

      {/* Right — Form Panel */}
      <div className="flex w-full lg:w-1/2 flex-col">
        {/* Mobile Top Banner */}
        <div className="lg:hidden flex items-center gap-3 bg-brand-blue px-6 py-4">
          <img src={miteIcon} alt="MITE" className="h-8 w-8" />
          <div>
            <p className="text-sm font-semibold text-white">PlaceMe</p>
            <p className="text-[11px] text-blue-200">MITE Placement Portal</p>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex flex-1 items-center justify-center px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="w-full max-w-md"
          >
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
