import { ReactNode } from 'react';
import { useCMSContent } from '@/hooks/useCMSContent';

interface CMSTextProps {
  page: string;
  section: string;
  contentKey: string;
  fallback: string;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'div';
  children?: ReactNode;
}

export const CMSText = ({
  page,
  section,
  contentKey,
  fallback,
  className = '',
  as: Component = 'div'
}: CMSTextProps) => {
  const { content, loading, error } = useCMSContent(page, section, contentKey);

  // While loading or if there's an error, show the fallback
  const displayText = content || fallback;

  return (
    <Component className={className}>
      {displayText}
    </Component>
  );
};