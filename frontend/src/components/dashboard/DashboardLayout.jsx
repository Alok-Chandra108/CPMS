import { useState } from 'react';
import { Menu, Search, Bell } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import useAuth from '../../hooks/useAuth';

const DashboardLayout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const { notices, readNotices } = useSelector((state) => state.notices);
  const unreadCount = notices?.filter(n => !readNotices?.includes(n._id))?.length || 0;

  const initials = user?.fullName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '??';

  return (
    <div className="flex min-h-screen bg-stripe-bg font-sans text-stripe-text">
      {/* Sidebar */}
      <Sidebar
        isMobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* ── Top Bar ── */}
        <header className="sticky top-0 z-20 bg-white border-b border-stripe-border">
          <div className="flex items-center justify-between h-14 px-4 sm:px-6 lg:px-8">
            {/* Left */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-1.5 -ml-1.5 rounded-lg hover:bg-stripe-bg text-stripe-textSecondary transition-colors"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div>
                <p className="text-sm font-bold text-stripe-text leading-tight">
                  {getGreeting()}, {user?.fullName?.split(' ')[0]}
                </p>
                <p className="text-[11px] font-medium text-stripe-textSecondary leading-tight">
                  {new Date().toLocaleDateString('en-IN', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-1.5">
              {/* Notification Bell */}
              <button
                onClick={() => navigate('/dashboard/student/notices')}
                className="relative p-2 rounded-lg hover:bg-stripe-bg text-stripe-textSecondary hover:text-stripe-text transition-colors"
              >
                <Bell className="h-[18px] w-[18px]" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 bg-error rounded-full ring-2 ring-white" />
                )}
              </button>

              {/* Avatar */}
              <div className="h-8 w-8 rounded-full bg-brand-primary/10 flex items-center justify-center cursor-pointer border border-stripe-border">
                <span className="text-[11px] font-bold text-brand-primary leading-none">{initials}</span>
              </div>
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

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default DashboardLayout;
