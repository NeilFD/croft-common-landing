import React, { ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface CMSErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface CMSErrorBoundaryProps {
  children: ReactNode;
}

export class CMSErrorBoundary extends React.Component<CMSErrorBoundaryProps, CMSErrorBoundaryState> {
  constructor(props: CMSErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): CMSErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 CMS Error Boundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <h1 className="font-brutalist text-2xl mb-4 text-destructive">CMS Error</h1>
            <p className="text-muted-foreground mb-4">
              Something went wrong in the content management system.
            </p>
            {this.state.error && (
              <div className="bg-muted p-4 rounded-md text-sm text-left mb-4">
                <strong>Error:</strong> {this.state.error.message}
              </div>
            )}
            <div className="flex gap-2 justify-center">
              <Button onClick={this.handleReset} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/cms'}>
                Back to CMS
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}