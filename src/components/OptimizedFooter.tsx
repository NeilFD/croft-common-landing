import React from 'react';
import { useCMSContentBatch } from '@/hooks/useCMSContentBatch';
import Footer from './Footer';

const OptimizedFooter = () => {
  // Batch all footer CMS queries
  const queries = [
    { page: 'global', section: 'footer', contentKey: 'title' },
    { page: 'global', section: 'footer', contentKey: 'description' },
    { page: 'global', section: 'footer', contentKey: 'contact_title' },
    { page: 'global', section: 'footer', contentKey: 'email' },
    { page: 'global', section: 'footer', contentKey: 'phone' },
    { page: 'global', section: 'footer', contentKey: 'hours_title' },
    { page: 'global', section: 'footer', contentKey: 'hours_weekday' },
    { page: 'global', section: 'footer', contentKey: 'hours_weekend' },
    { page: 'global', section: 'footer', contentKey: 'copyright' },
    { page: 'global', section: 'footer', contentKey: 'membership_link_text' },
    { page: 'global', section: 'footer', contentKey: 'common_good_title' }
  ];

  const { loading } = useCMSContentBatch(queries);

  // Show footer immediately, let CMS content populate async
  return <Footer />;
};

export default OptimizedFooter;