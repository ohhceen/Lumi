"use client";

import * as React from "react";
import Script from "next/script";
import { Loader2 } from "lucide-react";
import { loginWithGoogleIdToken } from "@/app/actions/auth";
import { GoogleButton } from "./google-button";

interface GoogleId {
  initialize(config: Record<string, unknown>): void;
  renderButton(el: HTMLElement, options: Record<string, unknown>): void;
}
declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } };
  }
}

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

async function makeNonce() {
  const raw = Array.from(crypto.getRandomValues(new Uint8Array(24)), (b) => b.toString(16).padStart(2, "0")).join("");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  const hashed = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
  return { raw, hashed };
}

/**
 * Google's own "Sign in with Google" button. Google shows our domain
 * ("Lanjutkan ke mymoney-buddy.vercel.app") instead of the Supabase host.
 * Falls back to the redirect flow when no client id is configured or
 * Google's script cannot load.
 */
export function GoogleSignIn() {
  const box = React.useRef<HTMLDivElement>(null);
  const [scriptReady, setScriptReady] = React.useState(false);
  const [rendered, setRendered] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!CLIENT_ID || !scriptReady || !box.current || !window.google) return;
    let cancelled = false;
    (async () => {
      const nonce = await makeNonce();
      if (cancelled || !box.current || !window.google) return;
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        nonce: nonce.hashed,
        ux_mode: "popup",
        context: "signin",
        use_fedcm_for_button: true,
        callback: async ({ credential }: { credential?: string }) => {
          if (!credential) return setError("Login dengan Google gagal. Coba lagi ya.");
          setBusy(true);
          setError(null);
          const res = await loginWithGoogleIdToken({ credential, nonce: nonce.raw });
          if (res.ok) {
            window.location.assign("/");
          } else {
            setBusy(false);
            setError(res.message);
          }
        },
      });
      window.google.accounts.id.renderButton(box.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        shape: "pill",
        text: "signin_with",
        logo_alignment: "center",
        locale: "id",
        width: Math.min(400, Math.max(200, Math.floor(box.current.getBoundingClientRect().width))),
      });
      setRendered(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [scriptReady]);

  if (!CLIENT_ID || failed) return <GoogleButton />;

  return (
    <div>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onReady={() => setScriptReady(true)} onError={() => setFailed(true)} />
      <div className="relative min-h-11">
        <div ref={box} className="flex justify-center [color-scheme:light]" aria-busy={busy} />
        {!rendered ? <div aria-hidden className="absolute inset-0 animate-pulse rounded-full bg-white/70" /> : null}
        {busy ? (
          <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-full bg-white text-sm font-bold text-ink">
            <Loader2 className="size-4 animate-spin" /> Masuk…
          </div>
        ) : null}
      </div>
      {error ? (
        <p role="alert" className="mt-3 rounded-2xl bg-expense-soft px-3 py-2 text-sm font-bold text-expense-strong">
          {error}
        </p>
      ) : null}
    </div>
  );
}
