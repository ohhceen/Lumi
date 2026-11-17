"use client";

import * as React from "react";
import { Eye, EyeOff, Wallet } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { formatIDR } from "@/lib/format";
import { HIDDEN_AMOUNT, HIDE_BALANCE_COOKIE } from "@/lib/privacy";

/** "Total Saldo" with an eye toggle; the choice is kept per device in a cookie. */
export function BalanceCard({ balance, initialBalance, initiallyHidden }: { balance: number; initialBalance: number; initiallyHidden: boolean }) {
  const [hidden, setHidden] = React.useState(initiallyHidden);
  const toggle = () => {
    const next = !hidden;
    setHidden(next);
    document.cookie = `${HIDE_BALANCE_COOKIE}=${next ? "1" : "0"}; path=/; max-age=31536000; samesite=lax`;
  };
  return (
    <StatCard
      highlight
      label="Total Saldo"
      icon={Wallet}
      action={
        <button
          type="button"
          onClick={toggle}
          aria-pressed={hidden}
          aria-label={hidden ? "Tampilkan saldo" : "Sembunyikan saldo"}
          title={hidden ? "Tampilkan saldo" : "Sembunyikan saldo"}
          className="-my-1 inline-flex size-9 cursor-pointer items-center justify-center rounded-full text-ink hover:bg-white/70"
        >
          {hidden ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
        </button>
      }
      value={
        hidden ? (
          <span aria-label="Saldo disembunyikan">{HIDDEN_AMOUNT}</span>
        ) : (
          <span className={balance < 0 ? "text-expense-strong" : undefined}>{formatIDR(balance)}</span>
        )
      }
      sub={<>Saldo awal {hidden ? HIDDEN_AMOUNT : formatIDR(initialBalance)}</>}
    />
  );
}
