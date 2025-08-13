import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function RouterBridge() {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Expose a global navigate hook for the SW message handler
    (window as any).__APP_ROUTER_NAVIGATE__ = (url: string) => navigate(url);
    
    return () => {
      delete (window as any).__APP_ROUTER_NAVIGATE__;
    };
  }, [navigate]);
  
  return null;
}