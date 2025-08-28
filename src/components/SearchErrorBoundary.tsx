import React, { Component, ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface SearchErrorBoundaryState {
  hasError: boolean;
  searchValue: string;
}

interface SearchErrorBoundaryProps {
  children: ReactNode;
  fallbackValue: string;
  onFallbackChange: (value: string) => void;
  placeholder?: string;
}

export class SearchErrorBoundary extends Component<SearchErrorBoundaryProps, SearchErrorBoundaryState> {
  constructor(props: SearchErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false,
      searchValue: props.fallbackValue 
    };
  }

  static getDerivedStateFromError(): SearchErrorBoundaryState {
    return { hasError: true, searchValue: '' };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 SearchErrorBoundary caught error:', error, errorInfo);
  }

  handleFallbackChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value || '';
    this.setState({ searchValue: newValue });
    this.props.onFallbackChange(newValue);
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={this.props.placeholder || "Search..."}
            value={this.state.searchValue}
            onChange={this.handleFallbackChange}
            className="pl-10"
            autoComplete="off"
          />
        </div>
      );
    }

    return this.props.children;
  }
}