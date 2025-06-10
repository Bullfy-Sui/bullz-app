import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  " leading-[1.25rem] font-[400] inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none text-sm  transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
    variant: {
        default:
          "bg-button-bg text-button-foreground shadow-xs hover:bg-button-bg/90",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
        pixel:
          "bg-[#FF5324] text-white font-[pixel] shadow-[4px_4px_0_0_#b33c00] hover:bg-[#ff5c16] hover:shadow-[6px_6px_0_0_#b33c00] focus-visible:ring-0 rounded-none px-6 py-2",
        pri:
          "flex flex-row justify-center items-center px-6 py-4 gap-2 w-[232px] h-[51px] bg-[#FF5324] border border-[#992100] text-white font-bold shadow-[0px_3.81818px_2.54545px_rgba(0,0,0,0.25),inset_0px_8px_0px_rgba(255,255,255,0.24),inset_0px_-8px_0px_rgba(0,0,0,0.24)] hover:bg-[#ff5c16] focus-visible:ring-0 rounded-none",
        sec:
          "flex flex-row justify-center items-center px-6 py-4 gap-2 w-[232px] h-[51px] bg-[#32324D] border border-[#161626] text-white font-bold shadow-[0px_3.81818px_2.54545px_rgba(0,0,0,0.25),inset_0px_8px_0px_rgba(255,255,255,0.24),inset_0px_-8px_0px_rgba(0,0,0,0.24)] hover:bg-[#3a3a57] focus-visible:ring-0 rounded-none",
        pri_disabled:
          "bg-[#FF5324] text-white font-bold shadow-md opacity-50 cursor-not-allowed rounded-none px-6 py-2",
        pri_disabled_custom:
          "bg-[#1F1F33] text-white font-bold shadow-md cursor-not-allowed rounded-none px-6 py-2",
      },
      size: {
        default: "h-[4rem] px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-none gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-none px-6 has-[>svg]:px-4",
        icon: "size-9",
        wallet: "h-12 px-8 py-3 min-w-[120px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  disabled,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    disabled?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  // Exclude 'size' from being passed to the DOM element
  const { size: _size, ...restProps } = props as any;

  // Override variant if disabled and variant is pri
  const appliedVariant =
    disabled && variant === "pri" ? "pri_disabled" : variant;

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant: appliedVariant, size, className }))}
      disabled={disabled}
      {...restProps}
    />
  );
}


export { Button, buttonVariants };
