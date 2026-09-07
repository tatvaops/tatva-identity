"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function HideOnRoutes({ prefixes, children }: { prefixes: string[]; children: ReactNode }) {
  const pathname = usePathname();
  if (prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return null;
  }
  return children;
}
