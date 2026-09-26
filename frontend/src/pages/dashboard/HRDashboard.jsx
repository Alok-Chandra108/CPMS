import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { LogOut, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';
import useAuth from '../../hooks/useAuth';
import { logoutUser } from '../../features/auth/authThunks';

const HRDashboard = () => {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-brand-blue-dark flex items-center justify-center">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-900">{user?.fullName}</p>
              <p className="text-xs text-neutral-500">Company HR</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-neutral-600 hover:text-red-600 transition-colors">
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 mb-2">HR Dashboard</h1>
          <p className="text-neutral-600 mb-8">Company Recruiter Panel — Coming in Phase 2</p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {['Post Drives', 'View Applications', 'Student Profiles'].map((title) => (
              <div key={title} className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
                <h3 className="text-base font-semibold text-neutral-900 mb-2">{title}</h3>
                <p className="text-sm text-neutral-500">This feature will be available in Phase 2.</p>
              </div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default HRDashboard;
