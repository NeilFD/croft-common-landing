import React, { ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Smartphone } from 'lucide-react';

interface MobileErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface MobileErrorBoundaryProps {
  children: ReactNode;
}

export class MobileErrorBoundary extends React.Component<MobileErrorBoundaryProps, MobileErrorBoundaryState> {
  constructor(props: MobileErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): MobileErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 MOBILE: Error boundary caught an error:', error, errorInfo);
    console.error('🚨 MOBILE: Device info:', {
      userAgent: navigator.userAgent,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      standalone: window.matchMedia('(display-mode: standalone)').matches,
      url: window.location.href
    });
  }

  handleReset = () => {
    console.log('🔄 MOBILE: Resetting error boundary');
    this.setState({ hasError: false, error: undefined });
  };

  handleNavigateBack = () => {
    console.log('🔙 MOBILE: Navigating back to Common Room');
    try {
      window.history.back();
    } catch (e) {
      window.location.href = '/common-room/main';
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <Smartphone className="h-16 w-16 mx-auto mb-4 text-destructive" />
            <h1 className="font-brutalist text-2xl mb-4 text-destructive">Mobile Error</h1>
            <p className="text-muted-foreground mb-4">
              Something went wrong on mobile. This usually resolves with a refresh.
            </p>
            {this.state.error && (
              <div className="bg-muted p-4 rounded-md text-sm text-left mb-4">
                <strong>Error:</strong> {this.state.error.message}
              </div>
            )}
            <div className="flex gap-2 justify-center flex-wrap">
              <Button onClick={this.handleReset} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
              <Button variant="outline" onClick={this.handleNavigateBack}>
                Back to Common Room
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
                className="w-full mt-2"
              >
                Reload App
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}