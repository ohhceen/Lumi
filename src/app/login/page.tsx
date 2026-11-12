import { LoginForm } from "./login-form";
import { GoogleButton } from "./google-button";
import { LogoMark } from "@/components/brand";
import { loginErrorMessage } from "@/lib/auth-errors";

export const metadata = { title: "Masuk" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const oauthError = loginErrorMessage(error);
  return (
    <main className="bg-space relative flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="relative w-full max-w-sm animate-pop-in rounded-3xl glass p-7 shadow-pop">
        <div className="mb-6 flex flex-col items-center text-center">
          <LogoMark className="size-14" />
          <h1 className="mt-3 text-3xl font-black text-ink">Lumi</h1>
          <p className="mt-1 text-sm font-semibold text-ink-soft">Halo lagi! Siap mencatat hari ini?</p>
        </div>
        {oauthError ? (
          <p role="alert" className="mb-4 rounded-2xl bg-expense-soft px-3 py-2 text-sm font-bold text-expense-strong">
            {oauthError}
          </p>
        ) : null}
        <GoogleButton />
        <div className="my-5 flex items-center gap-3 text-xs font-bold text-ink-faint" aria-hidden="true">
          <span className="h-px flex-1 bg-line" /> atau dengan email <span className="h-px flex-1 bg-line" />
        </div>
        <LoginForm />
        <p className="mt-5 text-center text-xs font-semibold text-ink-faint">Aplikasi pribadi · pendaftaran publik dinonaktifkan</p>
      </div>
    </main>
  );
}
