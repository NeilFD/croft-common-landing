import React, { ReactNode } from 'react';

interface DomainGuardProps {
  children: ReactNode;
  allowedDomains?: string[];
}

const DomainGuard: React.FC<DomainGuardProps> = ({ 
  children, 
  allowedDomains = ['stokescroftsecretkitchens.com', 'www.stokescroftsecretkitchens.com'] 
}) => {
  const currentDomain = window.location.hostname;
  
  // Allow localhost and development domains
  const isDevelopment = currentDomain === 'localhost' || 
                       currentDomain === '127.0.0.1' || 
                       currentDomain.includes('.lovable.app') ||
                       currentDomain.includes('lovableproject.com') ||
                       currentDomain.includes('localhost');
  
  const isAllowedDomain = allowedDomains.includes(currentDomain) || isDevelopment;
  
  if (!isAllowedDomain) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md mx-auto p-8 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">Access Restricted</h1>
          <p className="text-muted-foreground mb-6">
            This content can only be accessed from the authorized domain.
          </p>
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Please visit: <br />
              <a 
                href={`https://stokescroftsecretkitchens.com${window.location.pathname}${window.location.search}`}
                className="text-primary hover:underline font-medium"
              >
                stokescroftsecretkitchens.com{window.location.pathname}
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
};

export default DomainGuard;