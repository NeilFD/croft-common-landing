import { Link } from "react-router-dom";
import { useCBMember } from "@/hooks/useCBMember";

interface CBMemberNavItemsProps {
  linkCls: string;
  onLoginOpen: () => void;
}

const CBMemberNavItems = ({ linkCls, onLoginOpen }: CBMemberNavItemsProps) => {
  const { isMember, signOut } = useCBMember();

  if (isMember) {
    return (
      <>
        <Link to="/members" className={linkCls}>Members</Link>
        <button onClick={() => signOut()} className={linkCls} type="button">
          Sign out
        </button>
      </>
    );
  }

  return (
    <button onClick={onLoginOpen} className={linkCls} type="button">
      Member Login
    </button>
  );
};

export default CBMemberNavItems;