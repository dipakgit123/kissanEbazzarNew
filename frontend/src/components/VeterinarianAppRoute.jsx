import { Navigate, Outlet } from 'react-router-dom';

const VeterinarianAppRoute = () => {
  const vetToken = localStorage.getItem('vetToken');
  const veterinarian = localStorage.getItem('veterinarian');

  if (!vetToken || !veterinarian) {
    return <Navigate to="/veterinarian/login" replace />;
  }

  return <Outlet />;
};

export default VeterinarianAppRoute;
