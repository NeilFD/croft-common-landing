import { Outlet } from "react-router-dom";
import CBTopNav from "@/components/crazybear/CBTopNav";
import CBFooter from "@/components/crazybear/CBFooter";
import "@/styles/pub.css";

/**
 * Layout for the /pub enclave. Wraps everything in the scoped .pub-theme
 * class so the trad-pub tokens don't leak into the rest of the site.
 *
 * Sits inside the wider Crazy Bear shell: same CBTopNav + CBFooter, just a
 * different room.
 */
const PubLayout = () => {
  return (
    <div className="pub-theme min-h-screen flex flex-col">
      <CBTopNav tone="light" />
      <main className="flex-1">
        <Outlet />
      </main>
      <CBFooter />
    </div>
  );
};

export default PubLayout;
