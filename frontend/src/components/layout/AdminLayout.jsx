import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  Bell, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Shield,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuth from '../../hooks/useAuth';
import { logoutUser } from '../../features/auth/authThunks';
import miteLogo from '../../assets/mite-logo.png';
import miteIcon from '../../assets/mite-icon.svg';

const adminNavItems = [
  { label: 'Overview', icon: LayoutDashboard, to: '/dashboard/admin' },
  { label: 'Student Management', icon: Users, to: '/dashboard/admin/students' },
  { label: 'Drive Management', icon: Briefcase, to: '/dashboard/admin/drives' },
  { label: 'Notice Board', icon: Bell, to: '/dashboard/admin/notices' },
  { label: 'Settings', icon: Settings, to: '/dashboard/admin/settings' },
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

const AdminLayout = ({ children }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login', { replace: true });
  };

  const initials = user?.fullName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'AD';

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
        {adminNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/dashboard/admin'}
            onClick={isMobile ? () => setIsMobileOpen(false) : undefined}
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
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className={`px-3 pb-5 space-y-1 border-t border-neutral-200/60 pt-3 ${(!isMobile && collapsed) ? 'px-2' : ''}`}>
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
    <div className="flex min-h-screen bg-neutral-50 font-sans text-neutral-900">
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
              onClick={() => setIsMobileOpen(false)}
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
                onClick={() => setIsMobileOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors z-50"
              >
                <X className="h-5 w-5" />
              </button>
              {renderNav(true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-neutral-200/60">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileOpen(true)}
                className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-neutral-100 text-neutral-600 transition-colors"
              >
                <Menu className="h-5 w-5" />
              </button>
              <h2 className="text-sm font-semibold text-neutral-800">
                Super Admin Console
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end mr-1">
                <p className="text-xs font-bold text-neutral-900">{user?.fullName || 'Super Admin'}</p>
                <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-medium">Placement Cell</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center">
                  <span className="text-xs font-bold text-neutral-700">{initials}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-neutral-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

