import { LoginForm } from "./login-form";
import { Mascot } from "@/components/mascot";
import { Cloud, Planet, StarField } from "@/components/decorations";

export const metadata = { title: "Masuk" };

export default function LoginPage() {
  return (
    <main className="bg-space relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-10">
      <StarField />
      <Planet className="absolute top-10 right-8 size-20 animate-float sm:right-24" />
      <Cloud className="absolute bottom-16 left-6 w-28 animate-float opacity-90 sm:left-24" />
      <div className="relative w-full max-w-sm animate-pop-in rounded-3xl border border-line bg-card p-7 shadow-pop">
        <div className="mb-6 flex flex-col items-center text-center">
          <Mascot mood="excited" className="size-24 animate-float" />
          <h1 className="mt-3 text-2xl font-black">
            MyMoney <span className="text-primary-strong">Buddy</span>
          </h1>
          <p className="mt-1 text-sm font-semibold text-ink-soft">Halo lagi! Bibo sudah menunggumu 💙</p>
        </div>
        <LoginForm />
        <p className="mt-5 text-center text-xs font-semibold text-ink-faint">Aplikasi pribadi · pendaftaran publik dinonaktifkan</p>
      </div>
    </main>
  );
}
