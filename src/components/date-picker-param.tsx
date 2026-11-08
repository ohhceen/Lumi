"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Input } from "./ui/input";

/** Date input bound to a URL search param (e.g. ?date=2026-11-08). */
export function DateParamPicker({ value, param = "date", label }: { value: string; param?: string; label: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  return (
    <Input
      type="date"
      aria-label={label}
      value={value}
      className={pending ? "w-auto opacity-70" : "w-auto"}
      onChange={(e) => {
        if (!e.target.value) return;
        const next = new URLSearchParams(params.toString());
        next.set(param, e.target.value);
        next.set("month", e.target.value.slice(0, 7));
        startTransition(() => router.push(`${pathname}?${next.toString()}`, { scroll: false }));
      }}
    />
  );
}
