import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  " leading-[1.25rem] uppercase font-[700] inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm  transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "border border-[#992100] rounded-none  bg-[#FF5324]",
        secondary: "border border-[#161626] rounded-none  bg-[#32324D] ",
        destructive: "",
        outline: "",
        ghost: "",
        link: "",
      },
      size: {
        default: "h-[3rem] text-[1.0625rem] px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-full gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-full px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const textShadow = (variant: "default" | "secondary") =>
  ({
    secondary: "1px 1px 2px #1A1A1AB2, 0px 1px 1px #1A1A1AB2",
    default: "1px 1px 2px #661600, 0px 1px 1px #661600",
  })[variant];

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
      style={{
        textShadow: textShadow(
          variant ? (variant as "default" | "secondary") : "default",
        ),
        boxShadow:
          "0px 3.82px 2.55px 0px #00000040, 0px -8px 0px 0px #0000003D inset, 0px 8px 0px 0px #FFFFFF3D inset",
      }}
    />
  );
}

export { Button, buttonVariants };
