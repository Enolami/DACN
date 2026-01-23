import * as React from "react";

import { cn } from "./utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-white placeholder:text-gray-500 selection:bg-[#00ff88] selection:text-black dark:bg-[#1a1a1a] border-[#333333] flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base bg-[#1a1a1a] text-white transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-[#00ff88]/50 focus-visible:ring-[#00ff88]/30 focus-visible:ring-2",
        "aria-invalid:ring-[#ff4444]/20 aria-invalid:border-[#ff4444]",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
