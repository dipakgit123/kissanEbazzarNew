import { Navigate, Outlet } from 'react-router-dom';

const AuthenticatedRoute = () => {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default AuthenticatedRoute;
