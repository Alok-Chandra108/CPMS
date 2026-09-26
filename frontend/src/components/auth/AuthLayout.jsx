import { motion } from 'framer-motion';
import BrandPanel from './BrandPanel';
import miteIcon from '../../assets/mite-icon.svg';

const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-stripe-bg relative overflow-hidden">
      {/* Stripe-style subtle background texture could go here if needed, but solid color is fine */}

      {/* Main Glass Container */}
      <div className="stripe-card w-full max-w-[1000px] min-h-[600px] flex relative z-10 overflow-hidden">
        
        {/* Left — Brand Panel */}
        <BrandPanel />

        {/* Right — Form Panel */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-14 bg-white">
          
          {/* Mobile Top Banner (Visible only on small screens) */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <img src={miteIcon} alt="MITE" className="h-10 w-10 drop-shadow-sm" />
            <div>
              <p className="text-lg font-bold text-stripe-text">PlaceMe</p>
              <p className="text-xs font-medium text-stripe-textSecondary">MITE Placement Portal</p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="w-full max-w-sm mx-auto"
          >
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
