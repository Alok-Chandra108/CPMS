import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { DASHBOARD_ROUTES } from '../constants/roles';

/**
 * RoleRoute — allows access only to specific roles.
 * If wrong role, redirects to the user's own dashboard.
 * @param {{ allowedRoles: string[], children: React.ReactNode }} props
 */
const RoleRoute = ({ allowedRoles, children }) => {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(role)) {
    // Redirect to user's own dashboard
    const ownDashboard = DASHBOARD_ROUTES[role] || '/login';
    return <Navigate to={ownDashboard} replace />;
  }

  return children;
};

export default RoleRoute;
