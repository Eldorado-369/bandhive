import { Navigate, useLocation } from 'react-router-dom';
import { getAuthToken } from './authService';

const ProtectedRoute = ({ children, allowedUserTypes = [] }) => {
  const location = useLocation();
  const token = getAuthToken();
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedUserTypes.length > 0 && !allowedUserTypes.includes(userData.user_type)) {
    return <Navigate to="/" replace />;
  }

  return children;
};