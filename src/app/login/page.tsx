import { LoginForm } from "./login-form";
import { LogoMark } from "@/components/brand";
import { Character, hasCharacter } from "@/components/character";
import { Planet, StarField, ToyBlock } from "@/components/decorations";

export const metadata = { title: "Masuk" };

export default function LoginPage() {
  return (
    <main className="bg-space relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-10">
      <StarField />
      <Planet className="absolute top-10 right-8 size-16 sm:right-28" />
      <ToyBlock letter="A" color="#ef6b5f" className="absolute bottom-10 left-10 hidden size-12 -rotate-12 sm:block" />
      <ToyBlock letter="B" color="#5ab0ea" className="absolute bottom-24 left-24 hidden size-10 rotate-6 sm:block" />
      <div className="relative w-full max-w-sm animate-pop-in rounded-3xl border-2 border-white bg-card p-7 shadow-pop">
        <div className="mb-6 flex flex-col items-center text-center">
          {hasCharacter("lotso") ? <Character name="lotso" priority className="size-28" /> : <LogoMark className="size-16" />}
          <h1 className="mt-3 text-3xl font-black text-primary-strong">Lumi</h1>
          <p className="mt-1 text-sm font-semibold text-ink-soft">Halo lagi! Siap mencatat hari ini? ⭐</p>
        </div>
        <LoginForm />
        <p className="mt-5 text-center text-xs font-semibold text-ink-faint">Aplikasi pribadi · pendaftaran publik dinonaktifkan</p>
      </div>
    </main>
  );
}
