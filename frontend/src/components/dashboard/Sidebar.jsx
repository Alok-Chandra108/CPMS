import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  User,
  Briefcase,
  FileText,
  Bell,
  HelpCircle,
  LogOut,
  X,
  Hexagon,
  ChevronLeft,
  ChevronRight,
  ScanLine,
  BarChart2,
} from 'lucide-react';
import { logoutUser } from '../../features/auth/authThunks';
import useAuth from '../../hooks/useAuth';

const studentNavItems = [
  { label: 'Dashboard',    icon: LayoutDashboard, to: '/dashboard/student' },
  { label: 'My Profile',   icon: User,            to: '/dashboard/student/profile' },
  { label: 'Drives',       icon: Briefcase,       to: '/dashboard/student/drives' },
  { label: 'Applications', icon: FileText,        to: '/dashboard/student/applications' },
  { label: 'Notices',      icon: Bell,            to: '/dashboard/student/notices' },
  { label: 'AI Scanner',   icon: ScanLine,        to: '/dashboard/student/resume-scanner' },
  { label: 'AI Dashboard', icon: BarChart2,       to: '/dashboard/student/ai-dashboard' },
];

const mobilePanelVariants = {
  hidden: { x: '-100%' },
  visible: { x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
};

const Sidebar = ({ isMobileOpen, onMobileClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Button-controlled collapse state
  const [collapsed, setCollapsed] = useState(false);

  const { notices, readNotices } = useSelector((state) => state.notices || { notices: [], readNotices: [] });
  const unreadCount = notices.filter(n => !readNotices.includes(n._id)).length;

  const initials = user?.fullName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '??';

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login', { replace: true });
  };

  const navContent = (isMobile = false) => {
    const showText = isMobile || !collapsed;

    return (
      <div className="flex flex-col h-full overflow-hidden">
        {/* ── Logo Area ── */}
        <div className={`flex items-center pt-6 pb-6 h-[72px] ${showText ? 'px-5' : 'px-0 justify-center'}`}>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-brand-primary flex items-center justify-center flex-shrink-0 shadow-sm shadow-brand-primary/30">
              <Hexagon className="h-5 w-5 text-white" />
            </div>
            {/* Animate text appearing/disappearing */}
            <AnimatePresence mode="popLayout">
              {showText && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="overflow-hidden whitespace-nowrap"
                >
                  <p className="text-[16px] font-extrabold text-stripe-text tracking-tight leading-none">Workspace</p>
                  <p className="text-[10px] font-semibold text-stripe-textSecondary uppercase tracking-widest mt-1">Portal</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto custom-scrollbar mt-4">
          {studentNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard/student'}
              onClick={isMobile ? onMobileClose : undefined}
              className={({ isActive }) =>
                `group flex items-center rounded-lg text-[13px] transition-all duration-150 relative h-10
                ${isActive
                  ? 'bg-brand-primary/10 text-brand-primary font-bold'
                  : 'text-stripe-textSecondary hover:bg-stripe-bg hover:text-stripe-text font-medium'
                }
                ${showText ? 'px-3' : 'justify-center w-10 mx-auto'}
                `
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && showText && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-brand-primary rounded-r-full"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  {isActive && !showText && (
                    <motion.div
                      layoutId="activeTabCollapsed"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-brand-primary rounded-r-full"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <item.icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-brand-primary' : 'text-stripe-textSecondary group-hover:text-stripe-text'}`} />
                  
                  <AnimatePresence>
                    {showText && (
                      <motion.div
                        initial={{ opacity: 0, width: 0, marginLeft: 0 }}
                        animate={{ opacity: 1, width: 'auto', marginLeft: 12 }}
                        exit={{ opacity: 0, width: 0, marginLeft: 0 }}
                        className="overflow-hidden whitespace-nowrap flex-1 flex items-center"
                      >
                        <span className="flex-1">{item.label}</span>
                        {item.to === '/dashboard/student/notices' && unreadCount > 0 && (
                          <span className={`flex-shrink-0 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold ${
                            isActive ? 'bg-brand-primary text-white' : 'bg-error text-white'
                          }`}>
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* If collapsed, show a simple red dot for unread notices */}
                  {!showText && item.to === '/dashboard/student/notices' && unreadCount > 0 && (
                    <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-error ring-2 ring-white" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* ── Bottom Section ── */}
        <div className="px-3 pb-3 space-y-1.5 border-t border-stripe-border pt-4">
          <button
            className={`w-full flex items-center rounded-lg text-[13px] font-medium text-stripe-textSecondary hover:bg-stripe-bg hover:text-stripe-text transition-all h-10 ${showText ? 'px-3' : 'justify-center w-10 mx-auto'}`}
          >
            <HelpCircle className="h-4 w-4 flex-shrink-0" />
            <AnimatePresence>
              {showText && (
                <motion.span
                  initial={{ opacity: 0, width: 0, marginLeft: 0 }}
                  animate={{ opacity: 1, width: 'auto', marginLeft: 12 }}
                  exit={{ opacity: 0, width: 0, marginLeft: 0 }}
                  className="overflow-hidden whitespace-nowrap text-left"
                >
                  Support
                </motion.span>
              )}
            </AnimatePresence>
          </button>
          
          <button
            onClick={handleLogout}
            className={`w-full flex items-center rounded-lg text-[13px] font-medium text-error/80 hover:bg-error/5 hover:text-error transition-all h-10 ${showText ? 'px-3' : 'justify-center w-10 mx-auto'}`}
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            <AnimatePresence>
              {showText && (
                <motion.span
                  initial={{ opacity: 0, width: 0, marginLeft: 0 }}
                  animate={{ opacity: 1, width: 'auto', marginLeft: 12 }}
                  exit={{ opacity: 0, width: 0, marginLeft: 0 }}
                  className="overflow-hidden whitespace-nowrap text-left"
                >
                  Logout
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* ── User Card ── */}
        <div className="px-3 pb-4">
          <div className={`flex items-center justify-center p-2 rounded-lg transition-all duration-300 ${showText ? 'bg-stripe-bg border border-stripe-border/50' : 'bg-transparent'}`}>
            <div className="h-8 w-8 rounded-full bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-[11px] font-bold text-brand-primary">{initials}</span>
            </div>
            
            <AnimatePresence>
              {showText && (
                <motion.div
                  initial={{ opacity: 0, width: 0, marginLeft: 0 }}
                  animate={{ opacity: 1, width: 'auto', marginLeft: 12 }}
                  exit={{ opacity: 0, width: 0, marginLeft: 0 }}
                  className="overflow-hidden whitespace-nowrap flex-1 min-w-0"
                >
                  <p className="text-[12px] font-bold text-stripe-text truncate">{user?.fullName}</p>
                  <p className="text-[10px] text-stripe-textSecondary truncate">{user?.email}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* ── Desktop Sidebar (Pushing Layout) ── */}
      <motion.aside
        animate={{ width: collapsed ? 76 : 240 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="hidden lg:flex flex-col fixed left-0 top-0 h-screen bg-white border-r border-stripe-border z-30 select-none shadow-[4px_0_24px_rgba(0,0,0,0.02)]"
      >
        {navContent(false)}

        {/* Collapse Toggle Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-8 h-6 w-6 bg-white border border-stripe-border rounded-full flex items-center justify-center shadow-sm hover:shadow hover:scale-105 transition-all text-stripe-textSecondary hover:text-stripe-text z-40 cursor-pointer"
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>
      </motion.aside>

      {/* Desktop spacer - animates width to actually push the content */}
      <motion.div
        className="hidden lg:block flex-shrink-0"
        animate={{ width: collapsed ? 76 : 240 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      />

      {/* ── Mobile Overlay ── */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-40 lg:hidden"
              onClick={onMobileClose}
            />
            <motion.aside
              variants={mobilePanelVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="fixed left-0 top-0 h-screen w-[280px] bg-white border-r border-stripe-border z-50 shadow-2xl lg:hidden"
            >
              <button
                onClick={onMobileClose}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-stripe-bg text-stripe-textSecondary hover:text-stripe-text transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              {navContent(true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
