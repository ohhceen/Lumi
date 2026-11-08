import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-extrabold [&_svg]:size-3", {
  variants: {
    tone: {
      income: "bg-income-soft text-income-strong",
      expense: "bg-expense-soft text-expense-strong",
      primary: "bg-primary-soft text-primary-strong",
      secondary: "bg-secondary-soft text-secondary-strong",
      accent: "bg-accent-soft text-accent-strong",
      neutral: "bg-cream text-ink-soft border border-line",
    },
  },
  defaultVariants: { tone: "neutral" },
});

export function Badge({ className, tone, ...props }: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
