"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { AuthContext } from "@/lib/types/identity";

const SessionContext = createContext<AuthContext>({
  userId: null,
  profile: null,
  configured: false,
  isPlatformAdmin: false,
});

export function SessionProvider({ value, children }: { value: AuthContext; children: ReactNode }) {
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  return useContext(SessionContext);
}
