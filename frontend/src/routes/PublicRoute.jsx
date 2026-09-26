import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { DASHBOARD_ROUTES } from '../constants/roles';

/**
 * PublicRoute — for routes that should only be accessible when NOT authenticated
 * (like Login, Register, Forgot Password).
 * If authenticated, redirects to the user's dashboard.
 */
const PublicRoute = ({ children }) => {
  const { isAuthenticated, role } = useAuth();

  if (isAuthenticated) {
    const dashboardRoute = DASHBOARD_ROUTES[role] || '/dashboard/student';
    return <Navigate to={dashboardRoute} replace />;
  }

  return children;
};

export default PublicRoute;
