"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Loader2, Lock, ShieldCheck } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Dedicated administrator sign-in.
 *
 * Authenticates against ADMIN_EMAIL / ADMIN_PASSWORD from the server
 * environment (provider id `admin-credentials`). On success the matching user
 * is promoted to ADMIN server-side, then we hand over to a short "access
 * granted" transition instead of jumping straight to the console.
 */
export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [granted, setGranted] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");

    const res = await signIn("admin-credentials", {
      redirect: false,
      email: email.trim(),
      password,
    });

    if (res?.error) {
      setError("Invalid administrator credentials.");
      setBusy(false);
      return;
    }

    // Let the success state land before navigating — no abrupt swap.
    setBusy(false);
    setGranted(true);
    setTimeout(() => {
      router.replace("/admin");
      router.refresh();
    }, 900);
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--color-primary-dark)] px-4 py-16 text-[var(--color-primary-light)]">
      {/* Atmosphere */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_70%_-10%,rgba(164,196,217,0.16),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_10%_110%,rgba(209,122,56,0.12),transparent_60%)]" />
        <div className="absolute inset-0 opacity-[0.035] [background-image:linear-gradient(to_right,var(--color-primary-light)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-primary-light)_1px,transparent_1px)] [background-size:64px_64px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="relative z-10 w-full max-w-md"
      >
        <Link
          href="/login"
          className="group mb-8 inline-flex items-center gap-2 font-mono text-[10px] font-bold tracking-[0.2em] text-[var(--color-primary-light)]/50 uppercase transition-colors hover:text-[var(--color-accent-orange)]"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
          Member sign in
        </Link>

        <div className="relative overflow-hidden rounded-[2rem] border border-[var(--color-primary-light)]/12 bg-[var(--color-primary-light)]/[0.03] p-8 shadow-2xl backdrop-blur-sm sm:p-10">
          {/* Soft progress line while the form is submitting */}
          <AnimatePresence>
            {busy && (
              <motion.span
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.9, ease: "easeInOut" }}
                className="absolute inset-x-0 top-0 h-0.5 origin-left bg-[var(--color-accent-orange)]"
              />
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait" initial={false}>
            {granted ? (
              <motion.div
                key="granted"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: EASE }}
                className="py-10 text-center"
                role="status"
                aria-live="polite"
              >
                <motion.div
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.05, duration: 0.35, ease: EASE }}
                  className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full border border-[var(--color-accent-orange)]/40 bg-[var(--color-accent-orange)]/10"
                >
                  <ShieldCheck className="h-7 w-7 text-[var(--color-accent-orange)]" />
                </motion.div>

                <p className="font-mono text-[9px] font-black tracking-[0.3em] text-[var(--color-accent-orange)] uppercase">
                  Access granted
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight">
                  Opening the console…
                </h2>

                <div className="mx-auto mt-7 flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-[var(--color-accent-glow)]" />
                  <span className="font-mono text-[9px] font-bold tracking-[0.2em] text-[var(--color-primary-light)]/40 uppercase">
                    Verifying session
                  </span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={false}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-8 flex items-center gap-3">
                  <Image
                    src="/logo.png"
                    alt="Kaalvanta logo"
                    width={76}
                    height={40}
                    className="h-10 w-auto object-contain drop-shadow-[0_0_12px_rgba(234,221,189,0.3)]"
                  />
                  <div>
                    <p className="font-mono text-[9px] font-black tracking-[0.3em] text-[var(--color-accent-orange)] uppercase">
                      Restricted
                    </p>
                    <h1 className="text-xl font-black tracking-tight">
                      Administrator access
                    </h1>
                  </div>
                </div>

                <form onSubmit={onSubmit} className="space-y-5">
                  <div>
                    <label
                      htmlFor="admin-email"
                      className="mb-1.5 block font-mono text-[9px] font-black tracking-[0.25em] text-[var(--color-ring-bronze)] uppercase"
                    >
                      Admin email
                    </label>
                    <input
                      id="admin-email"
                      type="email"
                      required
                      autoFocus
                      autoComplete="username"
                      disabled={busy}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@kaalvanta.local"
                      className="w-full rounded-xl border border-[var(--color-ring-bronze)]/25 bg-[var(--color-primary-light)]/5 px-4 py-3 font-medium text-[var(--color-primary-light)] transition-colors outline-none placeholder:text-[var(--color-ring-bronze)]/30 focus:border-[var(--color-accent-glow)] disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="admin-password"
                      className="mb-1.5 block font-mono text-[9px] font-black tracking-[0.25em] text-[var(--color-ring-bronze)] uppercase"
                    >
                      Admin password
                    </label>
                    <div className="relative">
                      <input
                        id="admin-password"
                        type="password"
                        required
                        autoComplete="current-password"
                        disabled={busy}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-[var(--color-ring-bronze)]/25 bg-[var(--color-primary-light)]/5 px-4 py-3 pr-11 font-medium text-[var(--color-primary-light)] transition-colors outline-none placeholder:text-[var(--color-ring-bronze)]/30 focus:border-[var(--color-accent-glow)] disabled:opacity-60"
                      />
                      <Lock className="absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2 text-[var(--color-ring-bronze)]/40" />
                    </div>
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        role="alert"
                        className="overflow-hidden rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-xs font-bold text-red-200"
                      >
                        {error}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <button
                    type="submit"
                    disabled={busy}
                    className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-[var(--color-primary-light)] py-3.5 text-[11px] font-black tracking-[0.18em] text-[var(--color-primary-dark)] uppercase shadow-[0_0_40px_rgba(234,221,189,0.15)] transition-all hover:bg-[var(--color-accent-orange)] hover:text-white active:scale-[0.99] disabled:cursor-wait disabled:opacity-70"
                  >
                    {busy ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Verifying…
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4" />
                        Enter console
                      </>
                    )}
                  </button>
                </form>

                <p className="mt-7 border-t border-[var(--color-primary-light)]/10 pt-5 font-mono text-[9px] leading-relaxed tracking-[0.12em] text-[var(--color-primary-light)]/35 uppercase">
                  Credentials are read from{" "}
                  <span className="text-[var(--color-ring-bronze)]">ADMIN_EMAIL</span> /{" "}
                  <span className="text-[var(--color-ring-bronze)]">ADMIN_PASSWORD</span> in the
                  server environment.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
