"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { LocaleProvider } from "@/components/providers/locale-provider";
import type { AppLocale } from "@/lib/i18n";

export function AppProviders({ children, locale }: { children: ReactNode; locale: AppLocale }) {
  const [client] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <LocaleProvider locale={locale}>
        <TooltipProvider>
          {children}
          <Toaster />
        </TooltipProvider>
      </LocaleProvider>
    </QueryClientProvider>
  );
}
