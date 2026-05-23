import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useHideOnScrollDown } from '@/hooks/useHideOnScrollDown';
import CBFlickerButton from './CBFlickerButton';

// Routes where the floating Curious?/Book buttons should be HIDDEN.
// Rule of thumb: hide on any page that is itself a form / interactive flow,
// or on app/admin areas. Show only on top-level navigational/marketing pages.
const HIDDEN_PREFIXES = [
  // Admin / internal
  '/management',
  '/admin',
  '/cms',
  '/den',
  '/check-in',
  '/manage-event',
  '/set-password',
  '/unsubscribe',
  '/notifications',
  '/calendar',
  '/push-setup',
  '/image-picker',
  '/branding',
  '/research',
  '/profile',
  // Form / interactive flows — the buttons would point back to these very pages
  '/curious',
  '/book',
  '/event-enquiry',
  '/bears-den',
];

const isHidden = (pathname: string) =>
  HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));

interface CBFloatingButtonProps {
  label: string;
  to: string;
  bottomClass: string;
  hidden: boolean;
}

const CBFloatingButton: React.FC<CBFloatingButtonProps & { property: 'town' | 'country' | null }> = ({ label, to, bottomClass, hidden, property }) => {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      aria-label={label}
      aria-hidden={hidden}
      tabIndex={hidden ? -1 : 0}
      onClick={() => navigate(to)}
      data-property={property ?? undefined}
      className={`cb-floating-cta fixed ${bottomClass} right-3 md:right-8 z-40 w-14 h-14 md:w-20 md:h-20 rounded-full flex items-center justify-center border-2 shadow-lg ${
        hidden ? 'translate-x-[140%] motion-reduce:translate-x-0' : 'translate-x-0'
      }`}
    >
      <span className="relative font-brutalist tracking-wider uppercase select-none text-[8px] md:text-[9px] leading-none">
        {label}
      </span>
    </button>
  );
};


const CBFloatingActions: React.FC = () => {
  const { pathname } = useLocation();
  const hidden = useHideOnScrollDown();
  if (isHidden(pathname)) return null;

  const property: 'town' | 'country' | null = pathname.startsWith('/town')
    ? 'town'
    : pathname.startsWith('/country') || pathname.startsWith('/pub') || pathname.startsWith('/karaoke')
    ? 'country'
    : null;

  return (
    <>
      {/* Flickering button — hidden for now, revisit later */}
      {false && <CBFlickerButton hidden={hidden} bottomClass="bottom-[23rem] md:bottom-[22rem]" />}
      <CBFloatingButton label="Curious?" to="/curious" bottomClass="bottom-[19rem] md:bottom-64" hidden={hidden} property={property} />
      <CBFloatingButton label="Book" to="/book" bottomClass="bottom-[15rem] md:bottom-40" hidden={hidden} property={property} />
    </>
  );
};


export default CBFloatingActions;
