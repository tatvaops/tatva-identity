import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[11px] font-medium tracking-[0.02em]",
  {
    variants: {
      variant: {
        default: "bg-secondary text-secondary-foreground",
        verify: "bg-[#ecf8f3] text-verify",
        success: "bg-[#ecf8f3] text-success",
        warning: "bg-[#fbf3e8] text-warning",
        danger: "bg-[#fdecef] text-destructive",
        outline: "border border-border text-text-secondary",
        primary: "bg-secondary text-brand",
        muted: "bg-surface-muted text-muted-foreground",
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

export { badgeVariants };
