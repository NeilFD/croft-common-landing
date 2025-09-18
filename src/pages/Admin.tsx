import React, { useEffect, useState } from "react";
import { AdminApp } from "../admin/AdminApp";

const Admin: React.FC = () => {
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    // Ensure SW doesn't interfere with admin auth flow
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        for (const reg of regs) reg.unregister();
      }).catch(() => void 0);
    }

    setBooted(true);
  }, []);

  if (!booted) return null;
  return <AdminApp />;
};

export default Admin;
