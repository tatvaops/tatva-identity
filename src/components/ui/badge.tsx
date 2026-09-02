import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium",
  {
    variants: {
      variant: {
        default: "bg-secondary text-secondary-foreground",
        verify: "bg-cyan-50 text-cyan-800",
        success: "bg-emerald-50 text-emerald-800",
        warning: "bg-amber-50 text-amber-800",
        outline: "border border-border text-foreground",
        primary: "bg-indigo-50 text-indigo-800",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
