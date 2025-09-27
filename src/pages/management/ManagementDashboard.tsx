import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';

const ManagementDashboard = () => {
  useEffect(() => {
    // Redirect to spaces page as it's our main module
  }, []);

  return <Navigate to="/management/spaces" replace />;
};

export default ManagementDashboard;