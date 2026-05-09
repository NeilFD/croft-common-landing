import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const HIDDEN_PREFIXES = [
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
      className={`fixed ${bottomClass} right-6 md:right-8 z-40 w-20 h-20 rounded-full transition-colors duration-300 flex items-center justify-center border-2 border-white/40 bg-black text-white hover:bg-accent-pink hover:text-white hover:border-accent-pink`}
    >
      <span className="relative font-brutalist tracking-wider uppercase select-none text-[9px]">
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
      <CBFloatingButton label="Curious?" to="/curious" bottomClass="bottom-64" />
      <CBFloatingButton label="Book" to="/book" bottomClass="bottom-40" />
    </>
  );
};

export default CBFloatingActions;
