import { Navigate, Outlet } from 'react-router-dom';

const AdminAppRoute = () => {
  const adminToken = localStorage.getItem('adminToken');
  const adminData = localStorage.getItem('adminData');

  if (!adminToken || !adminData) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
};

export default AdminAppRoute;
