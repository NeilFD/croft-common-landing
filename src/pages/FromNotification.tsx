import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Index from './Index';

const FromNotification: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    console.log('📱 From Notification page loaded with params:', Array.from(searchParams.entries()));
    
    // Get the redirect URL from query params
    const redirectTo = searchParams.get('redirectTo');
    const token = searchParams.get('ntk');
    
    if (token) {
      console.log('📱 Processing notification token:', token);
      // Token will be handled by the existing notification tracking logic
    }
    
    if (redirectTo) {
      console.log('📱 Redirecting to:', redirectTo);
      // Small delay to ensure tracking is processed
      setTimeout(() => {
        navigate(redirectTo, { replace: true });
      }, 100);
    } else {
      // If no redirect specified, go to home after a brief delay
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 1000);
    }
  }, [navigate, searchParams]);

  // Show the home page while processing
  return <Index />;
};

export default FromNotification;