
import React from "react";
import ReactDOM from "react-dom/client";
import "../index.css";
import { AdminNotificationsApp } from "./AdminNotificationsApp";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Ensure SW doesn't interfere with admin auth flow
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    for (const reg of regs) reg.unregister();
  });
}
const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AdminNotificationsApp />
    </QueryClientProvider>
  </React.StrictMode>
);
