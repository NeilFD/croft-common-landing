import { Link } from "react-router-dom";
import { useCBMember } from "@/hooks/useCBMember";

interface CBMemberNavItemsProps {
  linkCls: string;
  onLoginOpen: () => void;
}

/**
 * Auth-aware nav slot:
 * - Signed OUT → "Member Login" button only (Members link hidden)
 * - Signed IN  → "Members" link + "Sign out" button
 */
const CBMemberNavItems = ({ linkCls, onLoginOpen }: CBMemberNavItemsProps) => {
  const { isMember, signOut } = useCBMember();

  if (!isMember) {
    return (
      <button onClick={onLoginOpen} className={linkCls} type="button">
        Member Login
      </button>
    );
  }

  return (
    <>
      <Link to="/members" className={linkCls}>Members</Link>
      <button onClick={() => signOut()} className={linkCls} type="button">
        Sign out
      </button>
    </>
  );
};

export default CBMemberNavItems;
