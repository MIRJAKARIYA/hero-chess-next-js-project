"use client";
import dynamic from "next/dynamic";

const PresenceManager = dynamic(() => import("@/components/PresenceManager"), { ssr: false });
const NotificationSystem = dynamic(() => import("@/components/NotificationSystem"), { ssr: false });

export default function ClientProviders({ children }) {
  return (
    <>
      <PresenceManager />
      <NotificationSystem />
      {children}
    </>
  );
}
