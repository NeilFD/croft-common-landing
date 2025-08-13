import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

declare global {
  interface Window { __APP_ROUTER_NAVIGATE__?: (url: string) => void }
}

export function RouterBridge() {
  const navigate = useNavigate();
  
  useEffect(() => {
    window.__APP_ROUTER_NAVIGATE__ = (url) => navigate(url);
    return () => { delete window.__APP_ROUTER_NAVIGATE__; };
  }, [navigate]);
  
  return null;
}