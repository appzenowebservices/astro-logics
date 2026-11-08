"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import GoogleButton from "../components/GoogleButton";

const EASE = [0.22, 1, 0.36, 1] as const;

// Literal strings so Tailwind's scanner can see the classes.
const shadow = "shadow-[5px_5px_0_0_var(--color-primary-dark)]";

const CAPTIONS = [
  "Pick up where you left off.",
  "Same signal. Sharper eyes.",
  "The sky kept moving.",
];

/** Comic caption / form field: mono label, oversized ink box. */
function TicketField({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  trailing,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label
          htmlFor={id}
          className="font-mono text-xs font-black tracking-[0.18em] uppercase"
        >
          {label}
        </label>
        {trailing}
      </div>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full rounded-none border-[3px] border-[var(--color-primary-dark)] bg-white px-3.5 py-3.5 text-xl font-black tracking-tight outline-none placeholder:font-medium placeholder:text-[var(--color-primary-dark)]/25 focus:bg-[var(--color-accent-glow)]/15"
      />
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({ identifier: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [granted, setGranted] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    const res = await signIn("credentials", {
      redirect: false,
      mobile: formData.identifier,
      password: formData.password,
    });

    if (res?.error) {
      setError(res.error);
      setIsSubmitting(false);
      return;
    }

    setGranted(true);
    setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 900);
    setIsSubmitting(false);
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[var(--color-primary-light)] text-[var(--color-primary-dark)]">
      {/* Ben-Day dots */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.10] [background-image:radial-gradient(var(--color-primary-dark)_2px,transparent_2px)] [background-size:18px_18px]"
        aria-hidden
      />

      {/* ─────────── cover masthead ─────────── */}
      <div className="relative flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b-[4px] border-[var(--color-primary-dark)] px-5 py-3 font-mono text-[12px] font-black tracking-[0.24em] uppercase sm:px-8">
        <span>Kaalvanta Comics</span>
        <span className="hidden opacity-45 sm:inline">
          Issue #00 · Return of the Observer
        </span>
        <span className="opacity-45">Approved by the void</span>
      </div>

      <div className="relative mx-auto grid max-w-[1320px] grid-cols-1 gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:py-14">
        {/* ─────────── the cover art ─────────── */}
        <section className="relative">
          <div className="relative">
            <h1 className="font-poster text-[4.7rem] leading-[0.8] tracking-[0.005em] uppercase [-webkit-text-stroke:1.5px_var(--color-primary-dark)] sm:text-[6.4rem] lg:text-[8rem]">
              Welcome
              <br />
              <span className="text-[var(--color-accent-orange)] [-webkit-text-stroke:4px_var(--color-primary-dark)] [text-shadow:6px_6px_0_var(--color-primary-dark)]">
                back!
              </span>
            </h1>

            <span
              className={`absolute top-2 right-0 rotate-12 rounded-full border-[3px] border-[var(--color-primary-dark)] bg-[var(--color-primary-light)] px-3 py-1.5 font-mono text-[12px] font-black tracking-[0.16em] uppercase sm:top-4 ${shadow}`}
            >
              Members only
            </span>
          </div>

          {/* mascot + speech */}
          <div className="mt-6 flex items-end gap-3 sm:gap-5">
            <div className="relative shrink-0">
              <Image
                src="/saturn.png"
                alt="Kaalvanta mascot"
                width={408}
                height={612}
                className="h-36 w-auto -rotate-3 object-contain drop-shadow-[0_12px_0_rgba(42,65,112,0.15)] sm:h-48"
              />
            </div>

            <div className="relative mb-6 max-w-[15rem]">
              <div
                className={`relative rounded-none border-[3px] border-[var(--color-primary-dark)] bg-white px-3.5 py-2.5 font-mono text-xs leading-relaxed font-black tracking-wide uppercase shadow-[4px_4px_0_0_var(--color-primary-dark)] after:absolute after:-bottom-2.5 after:left-6 after:h-4 after:w-4 after:rotate-45 after:border-r-[3px] after:border-b-[3px] after:border-[var(--color-primary-dark)] after:bg-white`}
              >
                Your seat&apos;s still warm.
              </div>
            </div>
          </div>

          {/* captions */}
          <ul className="mt-6 space-y-2">
            {CAPTIONS.map((caption, i) => (
              <li
                key={caption}
                className={`flex items-center gap-2.5 font-mono text-xs font-black tracking-[0.14em] uppercase ${
                  i === 1 ? "-rotate-[0.6deg]" : "rotate-[0.4deg]"
                }`}
              >
                <span className="grid h-5 w-5 shrink-0 place-items-center border-2 border-[var(--color-primary-dark)] bg-[var(--color-accent-orange)] font-mono text-[11px] text-white">
                  {i + 1}
                </span>
                {caption}
              </li>
            ))}
          </ul>

          {/* mini panel strip */}
          <div className="mt-7 grid grid-cols-3 gap-2.5">
            {[
              ["Re-entry", "no reset"],
              ["Intact", "your chart"],
              ["Live", "one signal"],
            ].map(([value, label]) => (
              <div
                key={label}
                className={`border-[3px] border-[var(--color-primary-dark)] bg-white/60 px-2.5 py-2 text-center ${shadow}`}
              >
                <p className="text-lg leading-none font-black uppercase">{value}</p>
                <p className="mt-1 font-mono text-[12px] font-black tracking-[0.16em] uppercase opacity-45">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ─────────── the return ticket ─────────── */}
        <section className="relative">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: EASE }}
            className="relative mt-6 border-[4px] border-dashed border-[var(--color-primary-dark)] bg-[var(--color-primary-light)] p-5 shadow-[8px_8px_0_0_var(--color-primary-dark)] sm:p-7"
          >
            <div className="absolute -top-3.5 left-6 flex -translate-y-1/2 items-center gap-1.5 bg-[var(--color-primary-light)] px-2 font-mono text-[12px] font-black tracking-[0.24em] uppercase">
              ✂ Keep this stub
            </div>

            <div className="flex items-start justify-between gap-3 border-b-[3px] border-[var(--color-primary-dark)] pb-4">
              <div>
                <p className="font-mono text-[12px] font-black tracking-[0.26em] uppercase opacity-45">
                  Return ticket
                </p>
                <h2 className="font-poster mt-1.5 text-[2.6rem] leading-[0.9] tracking-[0.01em] uppercase sm:text-[3.2rem]">
                  Back to the{" "}
                  <span className="font-serif font-normal normal-case italic">
                    sky
                  </span>
                </h2>
              </div>
              <span className="shrink-0 -rotate-6 border-[3px] border-[var(--color-primary-dark)] bg-[var(--color-accent-glow)]/50 px-2 py-1 font-mono text-[11px] font-black tracking-[0.14em] uppercase">
                Admit one
              </span>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              {granted ? (
                <motion.div
                  key="granted"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35, ease: EASE }}
                  className="py-10 text-center"
                  role="status"
                  aria-live="polite"
                >
                  <span className="mx-auto grid h-14 w-14 place-items-center border-[3px] border-[var(--color-primary-dark)] bg-emerald-500/20">
                    <ArrowRight className="h-6 w-6" />
                  </span>
                  <h3 className="font-poster mt-4 text-3xl uppercase">
                    Welcome back!
                  </h3>
                  <p className="mt-1.5 font-mono text-[12px] font-black tracking-[0.2em] uppercase opacity-45">
                    Taking you in…
                  </p>
                  <Loader2 className="mx-auto mt-5 h-5 w-5 animate-spin" />
                </motion.div>
              ) : (
                <motion.div key="form" initial={false} exit={{ opacity: 0, y: -8 }}>
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        role="alert"
                        className="mt-4 overflow-hidden border-[3px] border-red-700 bg-red-500/10 px-3 py-2 text-[12px] font-black text-red-800 uppercase"
                      >
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                    <GoogleButton tone="light" />

                    <div className="flex items-center gap-3 py-1">
                      <span className="h-px flex-1 bg-[var(--color-primary-light)]/10" />
                      <span className="font-mono text-[10px] font-bold tracking-[0.2em] uppercase opacity-35">
                        or use credentials
                      </span>
                      <span className="h-px flex-1 bg-[var(--color-primary-light)]/10" />
                    </div>

                    <TicketField
                      id="login-identifier"
                      label="Identification"
                      value={formData.identifier}
                      onChange={(v) => handleInputChange("identifier", v)}
                      placeholder="Email or Mobile"
                      autoComplete="username"
                    />

                    <TicketField
                      id="login-password"
                      label="Access key"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(v) => handleInputChange("password", v)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      trailing={
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                          className="opacity-40 transition-opacity hover:opacity-100"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      }
                    />

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`group mt-1 flex w-full items-center justify-center gap-2 border-[3px] border-[var(--color-primary-dark)] bg-[var(--color-accent-orange)] py-4 font-mono text-base font-black tracking-[0.2em] text-white uppercase ${shadow} transition-all hover:-translate-y-0.5 hover:shadow-[7px_7px_0_0_var(--color-primary-dark)] active:translate-x-[5px] active:translate-y-[5px] active:shadow-none disabled:cursor-wait disabled:opacity-70`}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Checking the list…
                        </>
                      ) : (
                        <>
                          Let me in!
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </>
                      )}
                    </button>
                  </form>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t-[3px] border-[var(--color-primary-dark)] pt-3.5 font-mono text-[11px] font-black tracking-[0.18em] uppercase opacity-45">
                    <span>
                      New here?{" "}
                      <Link
                        href="/register"
                        className="underline underline-offset-2 opacity-100 hover:text-[var(--color-accent-orange)]"
                      >
                        Claim a seat
                      </Link>
                    </span>
                    <Link
                      href="/admin/login"
                      className="underline underline-offset-2 opacity-100 hover:text-[var(--color-accent-orange)]"
                    >
                      Admin
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <Link
            href="/"
            className="mt-5 inline-block font-mono text-[12px] font-black tracking-[0.2em] uppercase opacity-40 underline underline-offset-4 hover:opacity-100"
          >
            ← Back to the cover
          </Link>
        </section>
      </div>

      {/* footer strip */}
      <div className="relative border-t-[4px] border-[var(--color-primary-dark)] px-5 py-3.5 font-mono text-[12px] font-black tracking-[0.24em] uppercase opacity-45 sm:px-8">
        Kaalvanta · Collective State Engine · MMXXVI
      </div>
    </div>
  );
}
