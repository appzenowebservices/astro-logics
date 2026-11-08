"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

type TokenResponse = {
  access_token?: string;
  error?: string;
};

type GoogleGlobal = {
  accounts?: {
    oauth2?: {
      initTokenClient: (config: {
        client_id: string;
        scope: string;
        callback: (response: TokenResponse) => void;
      }) => { requestAccessToken: () => void };
    };
  };
};

declare global {
  interface Window {
    google?: GoogleGlobal;
  }
}

function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.1-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.6l6.2 5.2C41.9 34.6 44 29.7 44 24c0-1.3-.1-2.3-.4-3.5z"
      />
    </svg>
  );
}

/**
 * Google entry point using Google Identity Services.
 *
 * The OAuth code flow needs a client secret; this flow does not. The browser
 * receives a short-lived access token, the server verifies it with Google and
 * establishes a normal NextAuth session via the `google-token` provider.
 */
export default function GoogleButton({
  callbackUrl = "/dashboard",
  label = "Continue with Google",
  tone = "light",
}: {
  callbackUrl?: string;
  label?: string;
  tone?: "light" | "dark";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId) return;

    if (window.google?.accounts?.oauth2) {
      setReady(true);
      return;
    }

    const existing = document.getElementById("google-gsi");
    if (existing) {
      existing.addEventListener("load", () => setReady(true), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = "google-gsi";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => setReady(true);
    script.onerror = () => setError("Google could not be loaded.");
    document.head.appendChild(script);
  }, [clientId]);

  if (!process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED || !clientId) {
    return null;
  }

  const styles =
    tone === "light"
      ? "border-[var(--color-primary-dark)] bg-white text-[var(--color-primary-dark)] hover:bg-[var(--color-primary-light)]"
      : "border-[var(--color-primary-light)]/25 bg-[var(--color-primary-light)]/5 text-[var(--color-primary-light)] hover:bg-[var(--color-primary-light)]/10";

  const handleClick = () => {
    const oauth2 = window.google?.accounts?.oauth2;
    if (!ready || !oauth2) {
      setError("Google is still loading — try again in a second.");
      return;
    }

    setError(null);
    setBusy(true);

    try {
      const client = oauth2.initTokenClient({
        client_id: clientId,
        scope: "openid email profile",
        callback: async (response) => {
          if (!response.access_token) {
            setBusy(false);
            setError(
              response.error === "access_denied"
                ? "Google sign-in was cancelled."
                : "Google did not return an access token.",
            );
            return;
          }

          const result = await signIn("google-token", {
            accessToken: response.access_token,
            callbackUrl,
            redirect: false,
          });

          setBusy(false);

          if (!result?.ok) {
            setError("Google sign-in failed. Please try again.");
            return;
          }

          router.push(result.url ?? callbackUrl);
          router.refresh();
        },
      });

      client.requestAccessToken();
    } catch {
      setBusy(false);
      setError("Could not start Google sign-in.");
    }
  };

  return (
    <div className="w-full">
      <button
        type="button"
        disabled={busy}
        onClick={handleClick}
        className={`flex w-full items-center justify-center gap-3 rounded-xl border-[3px] py-3.5 font-mono text-[12px] font-black tracking-[0.16em] uppercase transition-all disabled:cursor-wait disabled:opacity-70 ${styles}`}
      >
        <GoogleMark />
        {busy ? "Connecting…" : label}
      </button>

      {error && (
        <p className="mt-2 text-center font-mono text-[10px] font-bold tracking-[0.08em] text-red-500 uppercase">
          {error}
        </p>
      )}
    </div>
  );
}
