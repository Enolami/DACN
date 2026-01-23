import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ff88]/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-[#00ff88] text-black hover:bg-[#00cc66] shadow-[0_0_10px_rgba(0,255,136,0.3)]",
        destructive:
          "bg-[#ff4444] text-white hover:bg-[#cc3333] shadow-[0_0_10px_rgba(255,68,68,0.3)]",
        success:
          "bg-[#00ff88] text-black hover:bg-[#00cc66] shadow-[0_0_10px_rgba(0,255,136,0.3)]",
        warning:
          "bg-[#ffaa00] text-black hover:bg-[#cc8800] shadow-[0_0_10px_rgba(255,170,0,0.3)]",
        outline:
          "border border-[#333333] bg-transparent text-white hover:bg-[#1a1a1a] hover:border-[#00ff88]/50",
        secondary:
          "bg-[#2a2a2a] text-white hover:bg-[#333333] border border-[#333333]",
        ghost:
          "hover:bg-[#1a1a1a] hover:text-[#00ff88] text-gray-400",
        link: "text-[#00ff88] underline-offset-4 hover:underline hover:text-[#00cc66]",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> &
    VariantProps<typeof buttonVariants> & {
      asChild?: boolean;
    }
>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  );
});

Button.displayName = "Button";

export { Button, buttonVariants };
