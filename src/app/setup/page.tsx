import { redirect } from "next/navigation";
import { LogoMark } from "@/components/brand";
import { getSupabaseConfig } from "@/lib/supabase/config";

export const metadata = { title: "Setup" };
export const dynamic = "force-dynamic";

export default function SetupPage() {
  if (getSupabaseConfig()) redirect("/");
  return (
    <main className="bg-space flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg rounded-3xl glass p-7 shadow-pop">
        <LogoMark className="mx-auto size-16" />
        <h1 className="mt-3 text-center text-2xl font-black">Supabase belum terhubung</h1>
        <p className="mt-2 text-center text-sm font-semibold text-ink-soft">Aplikasi ini butuh database untuk menyimpan catatanmu. Ikuti langkah berikut:</p>
        <ol className="mt-5 list-decimal space-y-2 pl-5 text-sm font-semibold text-ink">
          <li>Buat project di supabase.com lalu jalankan file SQL di <code className="rounded bg-cream px-1">supabase/migrations</code>.</li>
          <li>Salin <code className="rounded bg-cream px-1">.env.example</code> menjadi <code className="rounded bg-cream px-1">.env.local</code>.</li>
          <li>Isi <code className="rounded bg-cream px-1">NEXT_PUBLIC_SUPABASE_URL</code> dan <code className="rounded bg-cream px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.</li>
          <li>Restart server (<code className="rounded bg-cream px-1">npm run dev</code>).</li>
        </ol>
        <p className="mt-4 text-xs font-semibold text-ink-faint">Panduan lengkap ada di README.md.</p>
      </div>
    </main>
  );
}
