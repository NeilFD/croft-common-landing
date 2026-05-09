import { useState, useEffect, type ReactNode } from "react";
import GestureOverlay from "@/components/GestureOverlay";
import { useAuth } from "@/hooks/useAuth";
import RecipeOfTheMonthModal from "./RecipeOfTheMonthModal";
import RollTheDiceModal from "./RollTheDiceModal";
import RoomsOfferModal from "./RoomsOfferModal";
import PoolDayBedModal from "./PoolDayBedModal";
import SecretCinemaModal from "@/components/SecretCinemaModal";

export type SecretVariant =
  | "recipe-blackbear"
  | "recipe-bnb"
  | "recipe-homthai"
  | "recipe-townpub"
  | "recipe-countrypub"
  | "dice-town"
  | "dice-country"
  | "rooms-town"
  | "rooms-country"
  | "pool"
  | "cinema";

interface Props {
  variant: SecretVariant;
  children: ReactNode;
}

const GestureSelectionGuard = () => {
  useEffect(() => {
    document.body.classList.add("gesture-no-select");
    const clear = () => {
      const active = document.activeElement;
      if (
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        active instanceof HTMLSelectElement ||
        active?.getAttribute("contenteditable") === "true"
      ) {
        return;
      }
      try {
        window.getSelection()?.removeAllRanges();
      } catch {
        return;
      }
    };
    document.addEventListener("selectionchange", clear);
    document.addEventListener("touchstart", clear, { passive: true });
    document.addEventListener("touchmove", clear, { passive: true });
    document.addEventListener("touchend", clear, { passive: true });
    return () => {
      document.body.classList.remove("gesture-no-select");
      document.removeEventListener("selectionchange", clear);
      document.removeEventListener("touchstart", clear);
      document.removeEventListener("touchmove", clear);
      document.removeEventListener("touchend", clear);
    };
  }, []);
  return null;
};

const SecretGestureHost = ({ variant, children }: Props) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const onGesture = () => setOpen(true);

  return (
    <>
      {children}

      {user && (
        <>
          <GestureOverlay onGestureComplete={onGesture} />
          <style>{`
            body.gesture-no-select, body.gesture-no-select * {
              user-select: none !important;
              -webkit-user-select: none !important;
              -webkit-touch-callout: none !important;
              -webkit-tap-highlight-color: transparent !important;
            }
            body.gesture-no-select input,
            body.gesture-no-select textarea,
            body.gesture-no-select select,
            body.gesture-no-select [contenteditable="true"],
            body.gesture-no-select [role="dialog"] * {
              user-select: text !important;
              -webkit-user-select: text !important;
              -webkit-touch-callout: default !important;
            }
            body.gesture-no-select ::selection { background: transparent !important; color: inherit !important; }
            body.gesture-no-select ::-moz-selection { background: transparent !important; color: inherit !important; }
          `}</style>
          {!open && <GestureSelectionGuard />}
          <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none ${open ? "hidden" : ""}`}>
            <span className="font-cb-mono text-[9px] tracking-[0.4em] uppercase text-white/70 bg-black/60 px-3 py-1.5 backdrop-blur">
              Members: draw 7
            </span>
          </div>
        </>
      )}

      {variant.startsWith("recipe-") && (
        <RecipeOfTheMonthModal open={open} onClose={() => setOpen(false)} variant={variant} />
      )}
      {(variant === "dice-town" || variant === "dice-country") && (
        <RollTheDiceModal open={open} onClose={() => setOpen(false)} variant={variant} />
      )}
      {(variant === "rooms-town" || variant === "rooms-country") && (
        <RoomsOfferModal open={open} onClose={() => setOpen(false)} variant={variant} />
      )}
      {variant === "pool" && (
        <PoolDayBedModal open={open} onClose={() => setOpen(false)} />
      )}
      {variant === "cinema" && (
        <SecretCinemaModal open={open} onClose={() => setOpen(false)} />
      )}
    </>
  );
};

export default SecretGestureHost;
