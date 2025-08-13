import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminNotificationsApp } from "../admin/AdminNotificationsApp";

const Admin: React.FC = () => {
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    // 1) Ensure SW doesn't interfere with admin auth flow
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        for (const reg of regs) reg.unregister();
      }).catch(() => void 0);
    }

    // No auth processing here - AdminNotificationsApp handles it
    setBooted(true);
  }, []);

  if (!booted) return null;
  return <AdminNotificationsApp />;
};

export default Admin;
