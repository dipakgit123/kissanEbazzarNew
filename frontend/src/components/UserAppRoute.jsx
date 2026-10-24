import { getAnimalGroup, featureAllowed } from '../utils/animalExperience';
import { useLocation } from 'react-router-dom';
import { Navigate, Outlet } from 'react-router-dom';
import { safeJsonParse } from '../utils/stringUtils';

const UserAppRoute = () => {
  const { pathname } = useLocation();
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!getAnimalGroup()) return <Navigate to="/choose-experience" replace />;
  if (!featureAllowed(pathname)) return <Navigate to="/" replace />;
  const savedUser = localStorage.getItem('userData');
  const parsedUser = safeJsonParse(savedUser, null);

  if (parsedUser) {
    const hasProfile = Boolean(parsedUser.full_name && parsedUser.postal_code);

    if (!hasProfile) {
      return <Navigate to="/profile-completion" replace />;
    }
  }

  return <Outlet />;
};

export default UserAppRoute;
