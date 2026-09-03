"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { vertexQuoteAvailable } from "@/lib/integrations/vertex";
import { cn } from "@/lib/utils";

export function QuoteBoundary({
  label = "Request quote",
  variant = "default",
  fullWidth,
}: {
  label?: string;
  variant?: "default" | "outline" | "secondary";
  fullWidth?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button className={cn(fullWidth && "w-full")} variant={variant} onClick={() => setOpen(true)}>
        {label}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>{label}</DialogTitle>
          <DialogDescription>
            A quote should become an opportunity, project and work package in Vertex, then a verified portfolio entry.
            That path is not connected in this application.
          </DialogDescription>
          <Button className="mt-4" disabled={!vertexQuoteAvailable}>
            {vertexQuoteAvailable ? "Send enquiry" : "Vertex opportunities are not connected"}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
