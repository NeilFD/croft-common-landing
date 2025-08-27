import React from 'react';
import { useCMSContentBatch } from '@/hooks/useCMSContentBatch';
import Navigation from './Navigation';

const OptimizedNavigation = () => {
  // Batch all navigation CMS queries
  const queries = [
    { page: 'global', section: 'navigation', contentKey: 'brand_name' },
    { page: 'global', section: 'buttons', contentKey: 'book' },
    { page: 'global', section: 'buttons', contentKey: 'open' }
  ];

  const { loading } = useCMSContentBatch(queries);

  // Show navigation immediately, let CMS content populate async
  return <Navigation />;
};

export default OptimizedNavigation;