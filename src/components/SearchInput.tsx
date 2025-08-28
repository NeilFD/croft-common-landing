import React, { useCallback, useState, useRef } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const SearchInput: React.FC<SearchInputProps> = ({ 
  value, 
  onChange, 
  placeholder = "Search...",
  className 
}) => {
  const [searchState, setSearchState] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Defensive onChange handler with multiple fallbacks
  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const inputValue = event?.target?.value ?? '';
      setSearchState(inputValue);
      onChange(inputValue);
    } catch (err) {
      console.warn('SearchInput: Error in onChange handler:', err);
      // Fallback to direct value if event fails
      const directValue = event?.target?.value || '';
      setSearchState(directValue);
      onChange(directValue);
    }
  }, [onChange]);

  // Additional safety for controlled input
  const safeValue = searchState !== undefined ? searchState : '';

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={safeValue}
        onChange={handleInputChange}
        className={`pl-10 ${className || ''}`}
        autoComplete="off"
        spellCheck={false}
      />
    </div>
  );
};

export default SearchInput;