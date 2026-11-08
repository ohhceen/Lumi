import * as React from "react";
import { cn } from "@/lib/utils";

const base =
  "w-full rounded-2xl border-2 border-line bg-white px-4 text-sm font-semibold text-ink placeholder:text-ink-faint transition-colors hover:border-primary/70 focus:border-primary-strong focus:outline-none aria-invalid:border-expense-strong disabled:opacity-60";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => <input ref={ref} className={cn(base, "h-11", className)} {...props} />,
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => <textarea ref={ref} className={cn(base, "min-h-20 py-3", className)} {...props} />,
);
Textarea.displayName = "Textarea";

export const NativeSelect = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        base,
        "select-chevron h-11 cursor-pointer appearance-none pr-10",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  ),
);
NativeSelect.displayName = "NativeSelect";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("mb-1.5 block text-sm font-extrabold text-ink", className)} {...props} />;
}

export function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return (
    <p role="alert" className="mt-1.5 text-xs font-bold text-expense-strong">
      {messages[0]}
    </p>
  );
}

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  error?: string[];
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && !error?.length ? <p className="mt-1.5 text-xs font-semibold text-ink-faint">{hint}</p> : null}
      <FieldError messages={error} />
    </div>
  );
}
