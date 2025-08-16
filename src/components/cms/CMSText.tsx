import React from 'react';
import { useCMSContent } from '@/hooks/useCMSContent';

interface CMSTextProps {
  page: string;
  section: string;
  content_key: string;
  fallback: string;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
}

const CMSText: React.FC<CMSTextProps> = ({ 
  page, 
  section, 
  content_key, 
  fallback, 
  className = '',
  as: Component = 'span'
}) => {
  const { content, loading } = useCMSContent({ page, section, content_key, fallback });

  if (loading) {
    return (
      <Component className={`${className} animate-pulse`}>
        {fallback}
      </Component>
    );
  }

  return (
    <Component className={className}>
      {content}
    </Component>
  );
};

export default CMSText;