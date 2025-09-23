import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const RESEARCH_ALLOWED_EMAILS = [
  'neil@cityandsanctuary.com',
  'andrew.brown@portlandbrown.com'
];

// Check if we're in preview/development mode
const isPreviewMode = () => {
  return window.location.hostname.includes('lovable.app') ||
         window.location.hostname === 'localhost' ||
         window.location.hostname.includes('preview');
};

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Allow access in preview mode regardless of user authentication
  if (isPreviewMode()) {
    return <>{children}</>;
  }

  // In production, enforce email restrictions
  if (!user || !RESEARCH_ALLOWED_EMAILS.includes(user.email || '')) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};