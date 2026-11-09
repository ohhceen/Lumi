"use client";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <EmptyState title="Ups, ada yang tidak beres" description={error.message || "Data gagal dimuat. Periksa koneksi atau konfigurasi Supabase kamu."}>
      <Button onClick={reset}>Coba lagi</Button>
    </EmptyState>
  );
}
