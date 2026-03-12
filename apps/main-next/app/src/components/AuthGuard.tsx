"use client";

import { useAccount } from "wagmi";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export const AuthGuard = () => {
  const { status } = useAccount();
  const pathname = usePathname();

  useEffect(() => {
    const isProtectedRoute = ["/dashboard", "/monitor", "/audit"].some(
      (route) => pathname.startsWith(route),
    );

    if (!isProtectedRoute) return;

    if (status === "disconnected") {
      console.warn("wallet disconnected");
    }
  }, [status, pathname]);

  return null;
};
