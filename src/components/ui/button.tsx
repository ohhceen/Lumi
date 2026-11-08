import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl font-extrabold transition-all duration-150 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer",
  {
    variants: {
      variant: {
        primary: "bg-primary-strong text-white shadow-[0_3px_0_0_#2f7cc7] hover:bg-[#3f91e0] hover:-translate-y-0.5",
        secondary: "bg-secondary-soft text-secondary-strong hover:bg-secondary/40",
        income: "bg-income-strong text-white shadow-[0_3px_0_0_#226b41] hover:-translate-y-0.5",
        expense: "bg-expense-strong text-white shadow-[0_3px_0_0_#9b3236] hover:-translate-y-0.5",
        outline: "border-2 border-line bg-card text-ink hover:border-primary hover:bg-primary-soft/50",
        ghost: "text-ink-soft hover:bg-primary-soft/60 hover:text-ink",
        danger: "bg-expense-strong text-white hover:bg-[#b33c3f]",
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
