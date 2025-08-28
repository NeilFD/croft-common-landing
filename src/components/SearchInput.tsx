import React, { useCallback, useEffect, useRef } from 'react';
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
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Simple controlled input - no internal state
  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event?.target?.value ?? '';
    console.log('🔍 SearchInput: User typed:', inputValue); // Debug log
    onChange(inputValue);
  }, [onChange]);

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={handleInputChange}
        className={`pl-10 ${className || ''}`}
        autoComplete="off"
        spellCheck={false}
      />
    </div>
  );
};

export default SearchInput;