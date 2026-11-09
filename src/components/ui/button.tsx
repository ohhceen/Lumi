import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl font-extrabold transition-all duration-150 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer",
  {
    variants: {
      variant: {
        primary: "bg-primary-strong text-white shadow-glow hover:-translate-y-0.5 hover:bg-[#2479c2] active:shadow-none",
        secondary: "bg-accent-soft text-accent-strong ring-1 ring-accent/60 hover:bg-accent/40",
        income: "bg-btn-income text-white shadow-[0_4px_0_0_#155f38] hover:-translate-y-0.5 hover:brightness-105 active:shadow-none",
        expense: "bg-btn-expense text-white shadow-[0_4px_0_0_#962c23] hover:-translate-y-0.5 hover:brightness-105 active:shadow-none",
        outline: "border-2 border-line bg-white text-ink hover:border-primary hover:bg-primary-soft",
        ghost: "text-ink-soft hover:bg-primary-soft hover:text-primary-strong",
        danger: "bg-btn-expense text-white shadow-[0_4px_0_0_#962c23] hover:brightness-105 active:shadow-none",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-11 px-5 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "size-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
  },
);
Button.displayName = "Button";

export { buttonVariants };
