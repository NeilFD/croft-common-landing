import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

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
}

const CBFloatingButton: React.FC<CBFloatingButtonProps> = ({ label, to, bottomClass }) => {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => navigate(to)}
      className={`fixed ${bottomClass} right-3 md:right-8 z-40 w-14 h-14 md:w-20 md:h-20 rounded-full transition-colors duration-300 flex items-center justify-center border-2 border-white/40 bg-black text-white hover:bg-accent-pink hover:text-white hover:border-accent-pink shadow-lg`}
    >
      <span className="relative font-brutalist tracking-wider uppercase select-none text-[8px] md:text-[9px] leading-none">
        {label}
      </span>
    </button>
  );
};

const CBFloatingActions: React.FC = () => {
  const { pathname } = useLocation();
  if (isHidden(pathname)) return null;

  return (
    <>
      <CBFloatingButton label="Curious?" to="/curious" bottomClass="bottom-[19rem] md:bottom-64" />
      <CBFloatingButton label="Book" to="/book" bottomClass="bottom-[15rem] md:bottom-40" />
    </>
  );
};

export default CBFloatingActions;
