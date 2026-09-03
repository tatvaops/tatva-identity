"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";

export function FilterDrawer({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <div className="hidden lg:block">{children}</div>
      <div className="lg:hidden">
        <Button type="button" variant="outline" className="w-full" onClick={() => setOpen(true)}>
          <SlidersHorizontal />
          {title}
        </Button>
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent>
            <DrawerTitle className="text-base font-semibold">{title}</DrawerTitle>
            <div className="mt-4">{children}</div>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  );
}
