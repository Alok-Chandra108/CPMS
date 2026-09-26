import { useState } from 'react';
import { Menu, Bell } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import Sidebar from './Sidebar';
import useAuth from '../../hooks/useAuth';

const DashboardLayout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  
  const { notices, readNotices } = useSelector((state) => state.notices);
  const hasUnread = notices?.some(notice => !readNotices?.includes(notice._id));

  // Get user initials for the small header avatar
  const initials = user?.fullName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '??';

  return (
    <div className="flex min-h-screen bg-neutral-50 font-sans text-neutral-900">
      {/* Sidebar */}
      <Sidebar
        isMobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar — visible on all sizes */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-neutral-200/60">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            {/* Left: Hamburger (mobile) + Greeting */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-neutral-100 text-neutral-600 transition-colors"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-neutral-800">
                  {getGreeting()}, {user?.fullName?.split(' ')[0]} 👋
                </p>
                <p className="text-xs text-neutral-500">
                  {new Date().toLocaleDateString('en-IN', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>

            {/* Right: Search + Notifications + Avatar */}
            <div className="flex items-center gap-2">

              {/* Notification Bell temporarily removed as per request */}
              {/* Mini Avatar */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="h-9 w-9 rounded-full bg-gradient-to-br from-brand-blue to-brand-blue-dark flex items-center justify-center cursor-pointer shadow-sm"
              >
                <span className="text-xs font-bold text-white leading-none">{initials}</span>
              </motion.div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
};

// Helper: returns time-based greeting
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default DashboardLayout;
