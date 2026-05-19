import { Outlet } from "react-router-dom";
import CBTopNav from "@/components/crazybear/CBTopNav";
import CBFooter from "@/components/crazybear/CBFooter";
import "@/styles/karaoke.css";

/**
 * Layout for the /town/karaoke enclave. Wraps everything in the scoped
 * .karaoke-theme class so the disco tokens stay contained.
 */
const KaraokeLayout = () => (
  <div className="karaoke-theme min-h-screen flex flex-col">
    <CBTopNav tone="dark" />
    <main className="flex-1">
      <Outlet />
    </main>
    <CBFooter />
  </div>
);

export default KaraokeLayout;
