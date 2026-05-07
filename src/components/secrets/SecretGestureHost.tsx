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
            }
            body.gesture-no-select ::selection { background: transparent !important; }
          `}</style>
          <GestureSelectionGuard />
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
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
