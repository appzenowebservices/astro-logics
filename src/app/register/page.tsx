"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Copy, Loader2 } from "lucide-react";
import { api } from "~/trpc/react";
import GoogleButton from "../components/GoogleButton";

const EASE = [0.22, 1, 0.36, 1] as const;

// Literal strings so Tailwind's scanner can see the classes.
const shadow = "shadow-[5px_5px_0_0_var(--color-primary-dark)]";

const CAPTIONS = [
  "Cast your chart in a minute.",
  "No jargon. No spreadsheets.",
  "Cancel the void anytime.",
];

/** Comic caption / form field: mono label, oversized ink box. */
function PanelField({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  required,
  hint,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  hint?: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block font-mono text-xs font-black tracking-[0.18em] uppercase"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        className="w-full rounded-none border-[3px] border-[var(--color-primary-dark)] bg-white px-3.5 py-3.5 text-xl font-black tracking-tight outline-none placeholder:font-medium placeholder:text-[var(--color-primary-dark)]/25 focus:bg-[var(--color-accent-glow)]/15"
      />
      {hint && <div className="mt-2 min-h-[16px] text-xs font-bold">{hint}</div>}
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    inviteCode: "",
  });
  const [error, setError] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [copied, setCopied] = useState(false);
  const [debouncedInvite, setDebouncedInvite] = useState("");

  const registerUser = api.user.registerUser.useMutation({
    onSuccess: (data) => {
      if (data.temporaryPassword) {
        setTempPassword(data.temporaryPassword);
      } else {
        router.push("/login");
      }
    },
    onError: (opts) =>
      setError(opts.message?.length ? opts.message : "Something went wrong."),
  });

  const invite = formData.inviteCode.trim().toUpperCase();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedInvite(invite), 350);
    return () => clearTimeout(timer);
  }, [invite]);

  const inviteCheck = api.invite.validate.useQuery(
    { code: debouncedInvite },
    { enabled: debouncedInvite.length >= 6, retry: false },
  );

  const set = (field: keyof typeof formData, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    registerUser.mutate({
      name: formData.name,
      email: formData.email,
      mobile: formData.mobile || undefined,
      inviteCode: invite || undefined,
    });
  };

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
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
          Issue #01 · Curated access
        </span>
        <span className="opacity-45">Approved by the void</span>
      </div>

      <div className="relative mx-auto grid max-w-[1320px] grid-cols-1 gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:py-14">
        {/* ─────────── the cover art ─────────── */}
        <section className="relative">
          <div className="relative">
            <h1 className="font-poster text-[4.7rem] leading-[0.8] tracking-[0.005em] uppercase [-webkit-text-stroke:1.5px_var(--color-primary-dark)] sm:text-[6.4rem] lg:text-[8rem]">
              Join
              <br />
              the
              <br />
              <span className="text-[var(--color-accent-orange)] [-webkit-text-stroke:4px_var(--color-primary-dark)] [text-shadow:6px_6px_0_var(--color-primary-dark)]">
                Crew!
              </span>
            </h1>

            <span
              className={`absolute top-2 right-0 rotate-12 rounded-full border-[3px] border-[var(--color-primary-dark)] bg-[var(--color-primary-light)] px-3 py-1.5 font-mono text-[12px] font-black tracking-[0.16em] uppercase sm:top-4 ${shadow}`}
            >
              Free entry
            </span>
          </div>

          {/* mascot + jagged speech */}
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
                You in? I saved you a seat.
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
          <div className="mt-7 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {[
              ["12", "bodies"],
              ["6", "layers"],
              ["1", "signal"],
              ["0", "jargon"],
            ].map(([value, label]) => (
              <div
                key={label}
                className={`border-[3px] border-[var(--color-primary-dark)] bg-white/60 px-2.5 py-2 text-center ${shadow}`}
              >
                <p className="text-3xl leading-none font-black">{value}</p>
                <p className="mt-1 font-mono text-[12px] font-black tracking-[0.16em] uppercase opacity-45">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ─────────── the coupon ─────────── */}
        <section className="relative">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: EASE }}
            className="relative mt-6 border-[4px] border-dashed border-[var(--color-primary-dark)] bg-[var(--color-primary-light)] p-5 shadow-[8px_8px_0_0_var(--color-primary-dark)] sm:p-7"
          >
            {/* cut line */}
            <div className="absolute -top-3.5 left-6 flex -translate-y-1/2 items-center gap-1.5 bg-[var(--color-primary-light)] px-2 font-mono text-[12px] font-black tracking-[0.24em] uppercase">
              ✂ Cut here
            </div>

            <div className="flex items-start justify-between gap-3 border-b-[3px] border-[var(--color-primary-dark)] pb-4">
              <div>
                <p className="font-mono text-[12px] font-black tracking-[0.26em] uppercase opacity-45">
                  Subscription coupon
                </p>
                <h2 className="font-poster mt-1.5 text-[2.6rem] leading-[0.9] tracking-[0.01em] uppercase sm:text-[3.2rem]">
                  Claim your{" "}
                  <span className="font-serif font-normal normal-case italic">
                    seat
                  </span>
                </h2>
              </div>
              <span className="shrink-0 -rotate-6 border-[3px] border-[var(--color-primary-dark)] bg-[var(--color-accent-glow)]/50 px-2 py-1 font-mono text-[11px] font-black tracking-[0.14em] uppercase">
                Admit one
              </span>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              {tempPassword ? (
                <motion.div
                  key="issued"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35, ease: EASE }}
                  className="py-6 text-center"
                  role="status"
                  aria-live="polite"
                >
                  <span className="mx-auto grid h-14 w-14 place-items-center border-[3px] border-[var(--color-primary-dark)] bg-emerald-500/20">
                    <Check className="h-6 w-6" />
                  </span>

                  <h3 className="font-poster mt-4 text-3xl uppercase">
                    You&apos;re in!
                  </h3>
                  <p className="mx-auto mt-1.5 max-w-xs text-sm leading-relaxed font-bold">
                    Save this temporary password — it is shown once and you will
                    need it to sign in.
                  </p>

                  <div className="mt-4 flex items-stretch gap-2 border-[3px] border-[var(--color-primary-dark)] bg-white">
                    <code className="flex-1 px-3.5 py-3 text-left font-mono text-xl font-black tracking-[0.08em]">
                      {tempPassword}
                    </code>
                    <button
                      type="button"
                      onClick={copyPassword}
                      className="flex items-center gap-1.5 border-l-[3px] border-[var(--color-primary-dark)] bg-[var(--color-accent-glow)]/40 px-3 font-mono text-[12px] font-black tracking-[0.14em] uppercase transition-colors hover:bg-[var(--color-accent-orange)] hover:text-white"
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>

                  <Link
                    href="/login"
                    className={`group mt-5 inline-flex items-center justify-center gap-2 border-[3px] border-[var(--color-primary-dark)] bg-[var(--color-primary-dark)] px-6 py-3 font-mono text-sm font-black tracking-[0.18em] text-[var(--color-primary-light)] uppercase ${shadow} transition-all hover:bg-[var(--color-accent-orange)] active:translate-x-[5px] active:translate-y-[5px] active:shadow-none`}
                  >
                    Continue to sign in
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
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
                      <span className="h-px flex-1 bg-[var(--color-primary-dark)]/15" />
                      <span className="font-mono text-[10px] font-bold tracking-[0.2em] uppercase opacity-40">
                        or fill the form
                      </span>
                      <span className="h-px flex-1 bg-[var(--color-primary-dark)]/15" />
                    </div>

                    <PanelField
                      id="reg-name"
                      label="Full name"
                      value={formData.name}
                      onChange={(v) => set("name", v)}
                      placeholder="Nischal Gupta"
                      autoComplete="name"
                      required
                    />

                    <PanelField
                      id="reg-email"
                      label="Email"
                      type="email"
                      value={formData.email}
                      onChange={(v) => set("email", v)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      required
                    />

                    <PanelField
                      id="reg-mobile"
                      label="Mobile"
                      type="tel"
                      value={formData.mobile}
                      onChange={(v) => set("mobile", v)}
                      placeholder="+91"
                      autoComplete="tel"
                    />

                    <div>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <label
                          htmlFor="reg-invite"
                          className="font-mono text-xs font-black tracking-[0.18em] uppercase"
                        >
                          Invite code
                        </label>
                        <span className="font-mono text-[11px] font-black tracking-[0.18em] uppercase opacity-30">
                          {invite ? "Tear along the dotted line" : "Optional"}
                        </span>
                      </div>

                      <div className="relative">
                        {/* tear notches */}
                        <span className="absolute top-1/2 -left-[11px] z-10 h-[22px] w-[22px] -translate-y-1/2 rounded-full border-[3px] border-[var(--color-primary-dark)] bg-[var(--color-primary-light)]" />
                        <span className="absolute top-1/2 -right-[11px] z-10 h-[22px] w-[22px] -translate-y-1/2 rounded-full border-[3px] border-[var(--color-primary-dark)] bg-[var(--color-primary-light)]" />

                        <div className="border-[3px] border-dashed border-[var(--color-primary-dark)] bg-white">
                          <div className="flex items-center justify-between border-b-2 border-dashed border-[var(--color-primary-dark)]/40 px-4 py-2 font-mono text-[11px] font-black tracking-[0.22em] uppercase">
                            <span>✂ Invite voucher</span>
                            <span className="opacity-35">
                              No.{" "}
                              {invite
                                ? invite.replace(/[^A-Z0-9]/g, "").slice(-4)
                                : "----"}
                            </span>
                          </div>

                          <input
                            id="reg-invite"
                            type="text"
                            value={formData.inviteCode}
                            onChange={(e) =>
                              set("inviteCode", e.target.value.toUpperCase())
                            }
                            placeholder="KAAL-XXXX-XXXX"
                            className="w-full bg-transparent px-4 py-5 text-center font-mono text-2xl font-black tracking-[0.26em] uppercase outline-none placeholder:tracking-[0.2em] placeholder:text-[var(--color-primary-dark)]/15 focus:bg-[var(--color-accent-glow)]/20"
                          />

                          <div className="flex items-center justify-between gap-4 px-4 pb-3">
                            <div className="h-6 flex-1 opacity-[0.16] [background-image:repeating-linear-gradient(90deg,var(--color-primary-dark)_0,var(--color-primary-dark)_2px,transparent_2px,transparent_5px)]" />

                            {inviteCheck.data ? (
                              <span className="-rotate-6 border-[3px] border-emerald-700 px-2 py-0.5 font-mono text-[11px] font-black tracking-[0.18em] text-emerald-700 uppercase">
                                Approved
                              </span>
                            ) : inviteCheck.error ? (
                              <span className="-rotate-6 border-[3px] border-red-700 px-2 py-0.5 font-mono text-[11px] font-black tracking-[0.18em] text-red-700 uppercase">
                                Void
                              </span>
                            ) : (
                              <span className="font-mono text-[11px] font-black tracking-[0.18em] uppercase opacity-25">
                                Scratch to verify
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-2 min-h-[16px] text-xs font-bold">
                        {invite.length >= 6 && inviteCheck.isFetching && (
                          <span className="font-mono text-[12px] tracking-[0.12em] uppercase opacity-40">
                            Checking…
                          </span>
                        )}
                        {inviteCheck.data && !inviteCheck.isFetching && (
                          <span className="inline-flex items-center gap-1 font-mono text-[12px] tracking-[0.12em] text-emerald-700 uppercase">
                            <Check className="h-3 w-3" />
                            Valid · {inviteCheck.data.role} ·{" "}
                            {inviteCheck.data.plan}
                          </span>
                        )}
                        {inviteCheck.error && !inviteCheck.isFetching && (
                          <span className="font-mono text-[12px] tracking-[0.12em] text-red-700 uppercase">
                            {inviteCheck.error.message}
                          </span>
                        )}
                        {invite.length < 6 && (
                          <span className="font-medium opacity-40">
                            Optional if registration is open.
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={registerUser.isLoading}
                      className={`group mt-1 flex w-full items-center justify-center gap-2 border-[3px] border-[var(--color-primary-dark)] bg-[var(--color-accent-orange)] py-4 font-mono text-base font-black tracking-[0.2em] text-white uppercase ${shadow} transition-all hover:-translate-y-0.5 hover:shadow-[7px_7px_0_0_var(--color-primary-dark)] active:translate-x-[5px] active:translate-y-[5px] active:shadow-none disabled:cursor-wait disabled:opacity-70`}
                    >
                      {registerUser.isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Signing you up…
                        </>
                      ) : (
                        <>Sign me up!</>
                      )}
                    </button>
                  </form>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t-[3px] border-[var(--color-primary-dark)] pt-3.5 font-mono text-[11px] font-black tracking-[0.18em] uppercase opacity-45">
                    <span>
                      Already in?{" "}
                      <Link
                        href="/login"
                        className="underline underline-offset-2 opacity-100 hover:text-[var(--color-accent-orange)]"
                      >
                        Sign in
                      </Link>
                    </span>
                    <span>No card · no spam</span>
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
