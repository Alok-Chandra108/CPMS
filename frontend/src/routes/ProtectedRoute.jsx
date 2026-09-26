import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // If trying to access admin dashboard, redirect to admin login
    const isAdminRoute = location.pathname.startsWith('/dashboard/admin') || location.pathname === '/admin/change-password';
    return <Navigate to={isAdminRoute ? '/admin/login' : '/login'} replace />;
  }

  // Forced password change check for admins
  if (user?.role === 'admin' && user?.mustChangePassword) {
    if (location.pathname !== '/admin/change-password') {
      return <Navigate to="/admin/change-password" replace />;
    }
  }

  // Prevent accessing change-password if not required
  if (user?.role === 'admin' && !user?.mustChangePassword && location.pathname === '/admin/change-password') {
    return <Navigate to="/dashboard/admin" replace />;
  }

  return children;
};

export default ProtectedRoute;
