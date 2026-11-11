import { LoginForm } from "./login-form";
import { LogoMark } from "@/components/brand";

export const metadata = { title: "Masuk" };

export default function LoginPage() {
  return (
    <main className="bg-space relative flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="relative w-full max-w-sm animate-pop-in rounded-3xl bg-card p-7 shadow-pop">
        <div className="mb-6 flex flex-col items-center text-center">
          <LogoMark className="size-14" />
          <h1 className="mt-3 text-3xl font-black text-ink">Lumi</h1>
          <p className="mt-1 text-sm font-semibold text-ink-soft">Halo lagi! Siap mencatat hari ini?</p>
        </div>
        <LoginForm />
        <p className="mt-5 text-center text-xs font-semibold text-ink-faint">Aplikasi pribadi · pendaftaran publik dinonaktifkan</p>
      </div>
    </main>
  );
}
