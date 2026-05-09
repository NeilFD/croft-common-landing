import React from 'react';

interface DenSectionProps {
  eyebrow?: string;
  title: string;
  description?: string;
  isAutopopulated?: boolean;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
}

/**
 * Flat Bears Den section block. Replaces shadcn Card chrome on the Profile page.
 * Hairline top border, mono '///' eyebrow, Archivo Black title.
 */
export const DenSection: React.FC<DenSectionProps> = ({
  eyebrow,
  title,
  description,
  isAutopopulated = false,
  children,
  collapsible = false,
  defaultOpen = true,
}) => {
  const Header = (
    <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
      <div>
        <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-black/60">
          {eyebrow ?? '///'}
        </p>
        <h3 className="font-display uppercase text-xl md:text-2xl tracking-tight text-black mt-1">
          {title}
        </h3>
        {description && (
          <p className="font-sans text-sm text-black/60 mt-1">{description}</p>
        )}
      </div>
      {isAutopopulated && (
        <span className="font-mono text-[9px] tracking-[0.3em] uppercase text-black border border-black px-2 py-1">
          Pre-filled
        </span>
      )}
    </div>
  );

  if (collapsible) {
    return (
      <details
        open={defaultOpen}
        className="border-2 border-black bg-white p-6 group"
      >
        <summary className="cursor-pointer list-none flex items-baseline justify-between gap-2">
          <div>
            <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-black/60">
              {eyebrow ?? '///'}
            </p>
            <h3 className="font-display uppercase text-xl md:text-2xl tracking-tight text-black mt-1">
              {title}
            </h3>
            {description && (
              <p className="font-sans text-sm text-black/60 mt-1">{description}</p>
            )}
          </div>
          <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-black/60 group-open:hidden">
            Show
          </span>
          <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-black/60 hidden group-open:inline">
            Hide
          </span>
        </summary>
        <div className="mt-4 space-y-4">{children}</div>
      </details>
    );
  }

  return (
    <section className="border-2 border-black bg-white p-6">
      {Header}
      <div className="space-y-4">{children}</div>
    </section>
  );
};
