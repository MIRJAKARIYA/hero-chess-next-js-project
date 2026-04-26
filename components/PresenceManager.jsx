"use client";
import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { usePathname } from "next/navigation";

export default function PresenceManager() {
  const { data: session } = authClient.useSession();
  const pathname = usePathname();

  useEffect(() => {
    if (!session) return;

    const updateStatus = async () => {
      // Determine status based on current URL
      let status = "Online";
      if (pathname.startsWith("/play/online/")) {
        const parts = pathname.split("/");
        if (parts.length > 3 && parts[3] !== "") {
          status = "Playing";
        }
      }

      try {
        await fetch("/api/user/heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
      } catch (e) {
        console.error("Heartbeat failed", e);
      }
    };

    // Immediate update
    updateStatus();

    // Periodic update every 30 seconds
    const interval = setInterval(updateStatus, 30000);

    return () => clearInterval(interval);
  }, [session, pathname]);

  return null;
}
