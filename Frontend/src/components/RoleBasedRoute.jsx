import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';
import { getHomeRoute } from '../utils/routes';

export default function RoleBasedRoute({ roles, children }) {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      {roles.includes(user?.role) ? children : <Navigate to={getHomeRoute(user?.role)} replace />}
    </ProtectedRoute>
  );
}
