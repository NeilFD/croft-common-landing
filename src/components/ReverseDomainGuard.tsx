import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const ReverseDomainGuard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    const currentDomain = window.location.hostname;
    
    // Check if on the restricted domain
    const isRestrictedDomain = currentDomain === 'stokescroftsecretkitchens.com' || 
                              currentDomain === 'www.stokescroftsecretkitchens.com';
    
    // Allow development domains to work normally
    const isDevelopment = currentDomain === 'localhost' || 
                         currentDomain === '127.0.0.1' || 
                         currentDomain.includes('.lovable.app') ||
                         currentDomain.includes('lovableproject.com') ||
                         currentDomain.includes('localhost');
    
    // If on restricted domain and not in development, redirect to /secretkitchens
    if (isRestrictedDomain && !isDevelopment) {
      const currentPath = location.pathname;
      
      // Only redirect if not already on /secretkitchens
      if (!currentPath.startsWith('/secretkitchens')) {
        navigate('/secretkitchens', { replace: true });
      }
    }
  }, [navigate, location.pathname]);

  return null; // This component doesn't render anything
};

export default ReverseDomainGuard;