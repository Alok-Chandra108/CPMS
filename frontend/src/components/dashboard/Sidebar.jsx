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
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { logoutUser } from '../../features/auth/authThunks';
import miteLogo from '../../assets/mite-logo.png';
import miteIcon from '../../assets/mite-icon.svg';

const studentNavItems = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard/student' },
  { label: 'My Profile', icon: User, to: '/dashboard/student/profile' },
  { label: 'Placement Drives', icon: Briefcase, to: '/dashboard/student/drives' },
  { label: 'Applications', icon: FileText, to: '/dashboard/student/applications' },
  { label: 'Notices', icon: Bell, to: '/dashboard/student/notices' },
];

const sidebarVariants = {
  expanded: { width: 260 },
  collapsed: { width: 76 },
};

const mobileOverlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const mobilePanelVariants = {
  hidden: { x: '-100%' },
  visible: { x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
};

const Sidebar = ({ isMobileOpen, onMobileClose }) => {
  const [collapsed, setCollapsed] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { notices, readNotices } = useSelector((state) => state.notices || { notices: [], readNotices: [] });
  const unreadCount = notices.filter(n => !readNotices.includes(n._id)).length;

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login', { replace: true });
  };

  // Shared nav content renderer
  const renderNav = (isMobile = false) => (
    <div className="flex flex-col h-full">
      {/* Logo Area */}
      <div className={`flex items-center px-5 pt-6 pb-5 border-b border-neutral-200/60 ${(!isMobile && collapsed) ? 'justify-center px-3' : ''}`}>
        {(!isMobile && collapsed) ? (
          <img src={miteIcon} alt="MITE Icon" className="h-8 w-8 flex-shrink-0" />
        ) : (
          <div className="flex items-center">
            <img src={miteIcon} alt="MITE Icon" className="h-7 w-7 flex-shrink-0" />
            <div className="w-[1.5px] h-6 bg-neutral-300 mx-3 rounded-full flex-shrink-0" />
            <img src={miteLogo} alt="MITE Logo" className="h-8 w-auto flex-shrink-0" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
        {studentNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/dashboard/student'}
            onClick={isMobile ? onMobileClose : undefined}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative
              ${isActive
                ? 'bg-brand-orange/10 text-brand-orange'
                : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              }
              ${(!isMobile && collapsed) ? 'justify-center px-2' : ''}`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={`h-[18px] w-[18px] flex-shrink-0 transition-colors ${isActive ? 'text-brand-orange' : 'text-neutral-400 group-hover:text-neutral-600'}`} />
                {(isMobile || !collapsed) && (
                  <span className="whitespace-nowrap flex-1">{item.label}</span>
                )}
                {item.to === '/dashboard/student/notices' && unreadCount > 0 && (
                  <span className={`flex-shrink-0 ml-auto inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-brand-orange text-white' : 'bg-rose-100 text-rose-600'
                  }`}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className={`px-3 pb-5 space-y-1 border-t border-neutral-200/60 pt-3 ${(!isMobile && collapsed) ? 'px-2' : ''}`}>
        <button
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 transition-all duration-200 ${(!isMobile && collapsed) ? 'justify-center px-2' : ''}`}
        >
          <HelpCircle className="h-[18px] w-[18px] flex-shrink-0" />
          {(isMobile || !collapsed) && <span>Support</span>}
        </button>
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200 ${(!isMobile && collapsed) ? 'justify-center px-2' : ''}`}
        >
          <LogOut className="h-[18px] w-[18px] flex-shrink-0" />
          {(isMobile || !collapsed) && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        variants={sidebarVariants}
        initial={false}
        animate={collapsed ? 'collapsed' : 'expanded'}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="hidden lg:flex flex-col fixed left-0 top-0 h-screen bg-white border-r border-neutral-200 z-30 select-none"
      >
        {renderNav(false)}

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 h-6 w-6 bg-white border border-neutral-200 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow text-neutral-400 hover:text-neutral-700"
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      </motion.aside>

      {/* Desktop spacer — pushes main content */}
      <motion.div
        className="hidden lg:block flex-shrink-0"
        initial={false}
        animate={{ width: collapsed ? 76 : 260 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      />

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              variants={mobileOverlayVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
              onClick={onMobileClose}
            />
            <motion.aside
              variants={mobilePanelVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="fixed left-0 top-0 h-screen w-72 bg-white z-50 shadow-2xl lg:hidden"
            >
              {/* Close button */}
              <button
                onClick={onMobileClose}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              {renderNav(true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
