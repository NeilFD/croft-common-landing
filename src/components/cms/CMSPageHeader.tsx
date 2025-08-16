import React from 'react';
import CMSText from './CMSText';

interface CMSPageHeaderProps {
  page: string;
  defaultTitle: string;
  defaultDescription: string;
  titleClassName?: string;
  descriptionClassName?: string;
}

const CMSPageHeader: React.FC<CMSPageHeaderProps> = ({
  page,
  defaultTitle,
  defaultDescription,
  titleClassName = "font-brutalist text-4xl md:text-6xl mb-8 text-foreground",
  descriptionClassName = "font-industrial text-lg text-foreground/70 max-w-2xl mx-auto leading-relaxed"
}) => {
  return (
    <>
      <CMSText
        page={page}
        section="header"
        content_key="title"
        fallback={defaultTitle}
        className={titleClassName}
        as="h2"
      />
      <CMSText
        page={page}
        section="header"
        content_key="description"
        fallback={defaultDescription}
        className={descriptionClassName}
        as="p"
      />
    </>
  );
};

export default CMSPageHeader;