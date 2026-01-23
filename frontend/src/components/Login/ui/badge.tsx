import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ff88]/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#00ff88] text-black shadow-[0_0_5px_rgba(0,255,136,0.3)]",
        secondary:
          "border border-[#333333] bg-[#2a2a2a] text-white",
        destructive:
          "border-transparent bg-[#ff4444] text-white shadow-[0_0_5px_rgba(255,68,68,0.3)]",
        success:
          "border-transparent bg-[#00ff88] text-black shadow-[0_0_5px_rgba(0,255,136,0.3)]",
        warning:
          "border-transparent bg-[#ffaa00] text-black shadow-[0_0_5px_rgba(255,170,0,0.3)]",
        outline:
          "text-gray-400 border-[#333333] hover:text-white hover:border-[#00ff88]/50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
