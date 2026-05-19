import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import bearMark from '@/assets/crazy-bear-mark.png';
import CBSubscriptionForm from './CBSubscriptionForm';
import { SITE_MAP, LEGAL_LINKS, PRIMARY_CTAS, MEMBERS_ENTRY } from '@/data/cbSiteMap';
import { InstagramIcon, TikTokIcon } from '@/components/crazybear/icons/SocialIcons';
import { openExternal } from '@/utils/openExternal';

const IG_URL = 'https://instagram.com/crazybearhotels';
const TIKTOK_URL = 'https://tiktok.com/@crazybeargroup';

import GestureOverlay from '@/components/GestureOverlay';
import BiometricUnlockModal from '@/components/BiometricUnlockModal';
import MembershipLinkModal from '@/components/MembershipLinkModal';
import { AuthModal } from '@/components/AuthModal';
import { useMembershipGate } from '@/hooks/useMembershipGate';
import { useToast } from '@/hooks/use-toast';

const CBFooter = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLElement>(null);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const { toast } = useToast();
  const {
    bioOpen,
    linkOpen,
    authOpen,
    allowed,
    start,
    reset,
    handleBioSuccess,
    handleBioFallback,
    handleLinkSuccess,
    handleAuthSuccess,
  } = useMembershipGate();

  useEffect(() => {
    if (allowed) {
      reset();
      navigate('/bears-den');
    }
  }, [allowed, navigate, reset]);

  return (
    <footer
      ref={containerRef}
      className="relative bg-black text-white border-t border-white/15"
    >
      <div className="mx-auto max-w-6xl px-6 py-20">
        {/* Subscription */}
        <CBSubscriptionForm />

        {/* Site map — organised by site (Town / Country) + cross-site */}
        <nav
          aria-label="Site map"
          className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-12 border-t border-white/15 pt-12"
        >
          {(['town', 'country'] as const).map((site) => (
            <div key={site}>
              <p className="font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-60 mb-6">
                {site === 'town' ? 'Town — Beaconsfield' : 'Country — Stadhampton'}
              </p>
              <div className="space-y-6">
                {SITE_MAP.map((group) => {
                  const col = group[site];
                  const chips = col.chips ?? [];
                  if (col.links.length === 0 && chips.length === 0) return null;
                  return (
                    <div key={`${site}-${group.id}`}>
                      <p className="font-cb-mono text-[9px] tracking-[0.35em] uppercase opacity-50 mb-2">
                        {group.label}
                      </p>
                      <ul className="space-y-1.5">
                        {col.links.map((link) => {
                          // "Room Types" collapses Snug/Cosy/Boujee/Decadent
                          // into a disclosure so the footer doesn't list every
                          // room twice.
                          if (link.label === "Room Types" && chips.length > 0) {
                            return (
                              <li key={link.path}>
                                <details className="group [&_summary::-webkit-details-marker]:hidden">
                                  <summary className="list-none cursor-pointer flex items-center gap-2 select-none">
                                    <Link
                                      to={link.path}
                                      onClick={(e) => e.stopPropagation()}
                                      className="font-cb-sans text-sm opacity-80 hover:opacity-100 hover:underline underline-offset-4"
                                    >
                                      {link.label}
                                    </Link>
                                    <span
                                      aria-hidden
                                      className="font-cb-mono text-xs leading-none opacity-50 group-open:rotate-45 transition-transform"
                                    >
                                      +
                                    </span>
                                  </summary>
                                  <ul className="mt-1.5 ml-3 space-y-1.5 border-l border-white/15 pl-3">
                                    {chips.map((chip) => (
                                      <li key={chip.path}>
                                        <Link
                                          to={chip.path}
                                          className="font-cb-sans text-sm opacity-70 hover:opacity-100 hover:underline underline-offset-4"
                                        >
                                          {chip.label}
                                        </Link>
                                      </li>
                                    ))}
                                  </ul>
                                </details>
                              </li>
                            );
                          }
                          return (
                            <li key={link.path}>
                              <Link
                                to={link.path}
                                className="font-cb-sans text-sm opacity-80 hover:opacity-100 hover:underline underline-offset-4"
                              >
                                {link.label}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Across both */}
          <div>
            <p className="font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-60 mb-6">
              Across both
            </p>
            <ul className="space-y-1.5">
              {SITE_MAP.flatMap((g) => g.bothBelow ?? []).map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="font-cb-sans text-sm opacity-80 hover:opacity-100 hover:underline underline-offset-4"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/journal" className="font-cb-sans text-sm opacity-80 hover:opacity-100 hover:underline underline-offset-4">Journal</Link>
              </li>
              <li>
                <Link to="/gallery" className="font-cb-sans text-sm opacity-80 hover:opacity-100 hover:underline underline-offset-4">Gallery</Link>
              </li>
              <li>
                <Link to="/treatments" className="font-cb-sans text-sm opacity-80 hover:opacity-100 hover:underline underline-offset-4">Treatments</Link>
              </li>
              <li>
                <Link to="/merch" className="font-cb-sans text-sm opacity-80 hover:opacity-100 hover:underline underline-offset-4">Merch</Link>
              </li>
              <li>
                <Link to="/faq" className="font-cb-sans text-sm opacity-80 hover:opacity-100 hover:underline underline-offset-4">FAQ</Link>
              </li>
              <li>
                <Link to="/contact" className="font-cb-sans text-sm opacity-80 hover:opacity-100 hover:underline underline-offset-4">Contact</Link>
              </li>
              <li>
                <Link to="/press" className="font-cb-sans text-sm opacity-80 hover:opacity-100 hover:underline underline-offset-4">Press</Link>
              </li>
              <li>
                <Link to="/careers" className="font-cb-sans text-sm opacity-80 hover:opacity-100 hover:underline underline-offset-4">Careers</Link>
              </li>
              <li>
                <Link
                  to={PRIMARY_CTAS.book.path}
                  className="font-cb-sans text-sm opacity-80 hover:opacity-100 hover:underline underline-offset-4"
                >
                  Book
                </Link>
              </li>
              <li>
                <Link
                  to={PRIMARY_CTAS.enquire.path}
                  className="font-cb-sans text-sm opacity-80 hover:opacity-100 hover:underline underline-offset-4"
                >
                  Enquire
                </Link>
              </li>
            </ul>

            {/* Social */}
            <div className="mt-8">
              <p className="font-cb-mono text-[9px] tracking-[0.4em] uppercase opacity-50 mb-3">
                Follow
              </p>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => openExternal(IG_URL)}
                  aria-label="Crazy Bear on Instagram"
                  className="opacity-80 hover:opacity-100 interactive-element"
                >
                  <InstagramIcon className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={() => openExternal(TIKTOK_URL)}
                  aria-label="Crazy Bear on TikTok"
                  className="opacity-80 hover:opacity-100 interactive-element"
                >
                  <TikTokIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Info grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-12 border-t border-white/15 pt-12">
          <div>
            <p className="font-display uppercase text-3xl tracking-tight">Crazy Bear</p>
            <p className="mt-3 font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-60">
              Two hotels &nbsp;/&nbsp; one spirit
            </p>
          </div>

          <div>
            <p className="font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-60 mb-3">
              Town &mdash; Beaconsfield
            </p>
            <p className="font-cb-sans text-sm leading-relaxed opacity-90">
              75 Wycombe End<br />
              Beaconsfield HP9 1LX
            </p>
            <a
              href="tel:01494673086"
              className="mt-2 inline-block font-cb-sans text-sm underline-offset-4 hover:underline"
            >
              01494 673 086
            </a>
          </div>

          <div>
            <p className="font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-60 mb-3">
              Country &mdash; Stadhampton
            </p>
            <p className="font-cb-sans text-sm leading-relaxed opacity-90">
              Bear Lane<br />
              Stadhampton OX44 7UR
            </p>
            <a
              href="tel:01865890714"
              className="mt-2 inline-block font-cb-sans text-sm underline-offset-4 hover:underline"
            >
              01865 890 714
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-white/15 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-6 flex-wrap">
            <p className="font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-50">
              &copy; {new Date().getFullYear()} The Crazy Bear
            </p>
            <Link
              to="/management/login"
              className="font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-40 hover:opacity-100 transition-opacity"
            >
              Management
            </Link>
          </div>
          <div className="flex items-center gap-6 flex-wrap">
            <Link
              to="/about"
              className="font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-60 hover:opacity-100"
            >
              About
            </Link>
            <Link
              to={MEMBERS_ENTRY.path}
              className="font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-60 hover:opacity-100"
            >
              {MEMBERS_ENTRY.label}
            </Link>
            <Link
              to="/privacy"
              className="font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-60 hover:opacity-100"
            >
              Privacy
            </Link>
            <Link
              to="/cookies"
              className="font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-60 hover:opacity-100"
            >
              Cookies
            </Link>
            <Link
              to="/terms"
              className="font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-60 hover:opacity-100"
            >
              Terms
            </Link>
          </div>
        </div>

        {/* Quiet mark — secret gesture target */}
        <div className="mt-12 flex justify-center">
          <img
            src={bearMark}
            alt=""
            className="h-10 w-auto invert opacity-20 hover:opacity-40 transition-opacity"
          />
        </div>
      </div>

      {/* Secret gesture overlay scoped to footer */}
      <GestureOverlay
        onGestureComplete={() => start()}
        containerRef={containerRef}
      />

      <BiometricUnlockModal
        isOpen={bioOpen}
        onClose={() => reset()}
        onSuccess={handleBioSuccess}
        onFallback={handleBioFallback}
      />
      <MembershipLinkModal
        open={linkOpen || linkModalOpen}
        onClose={() => {
          if (linkOpen) reset();
          setLinkModalOpen(false);
        }}
        onSuccess={(email) => {
          if (linkOpen) {
            handleLinkSuccess(email);
          } else {
            setLinkModalOpen(false);
            toast({
              title: 'Membership linked',
              description: `Linked to ${email}.`,
            });
          }
        }}
      />
      <AuthModal
        isOpen={authOpen}
        onClose={() => reset()}
        onSuccess={handleAuthSuccess}
      />
    </footer>
  );
};

export default CBFooter;
