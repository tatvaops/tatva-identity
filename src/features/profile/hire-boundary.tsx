"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { vertexHireAvailable } from "@/lib/integrations/vertex";
import { cn } from "@/lib/utils";

export function HireBoundary({ label, fullWidth }: { label: string; fullWidth?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button className={cn(fullWidth && "w-full")} variant="success" onClick={() => setOpen(true)}>
        {label}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>{label}</DialogTitle>
          <DialogDescription>
            Hiring should create a Vertex engagement, then site assignment, task allocation, attendance, DPR and
            payroll — writing back verified work history. That operational system is not connected in this application.
          </DialogDescription>
          <Button className="mt-4" disabled={!vertexHireAvailable}>
            {vertexHireAvailable ? "Create engagement" : "Vertex engagement is not connected"}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
