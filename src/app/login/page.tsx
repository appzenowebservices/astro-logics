"use client";

import React, { useState } from "react";
import {
  Mail,
  Lock,
  Sparkles,
  Loader2,
  ArrowLeft,
  Moon,
  Orbit,
  ChevronRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ identifier: "", password: "" });
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (field: string, value: string) => {
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
    } else {
      setSuccessMessage("Pranam! Welcome back.");
      setTimeout(() => router.push("/dashboard"), 1000);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="flex min-h-screen flex-col overflow-hidden bg-[var(--color-primary-light)] md:flex-row">
      {/* Left Column: Branding & Narrative (Moon Side) */}
      <div className="relative flex w-full flex-col justify-between bg-[var(--color-primary-light)] p-10 md:w-1/2 md:p-24">
        <Link
          href="/"
          className="group z-20 flex items-center text-sm font-black tracking-widest text-[var(--color-primary-dark)] uppercase"
        >
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />{" "}
          Back to Home
        </Link>

        <div className="relative z-10 my-12 md:my-0">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-8 inline-block"
          >
            <Image
              src="/astrologics_logo.png"
              alt="Logo"
              width={120}
              height={120}
              className="animate-float drop-shadow-2xl"
            />
          </motion.div>
          <h1 className="mb-6 font-serif text-5xl leading-tight text-[var(--color-primary-dark)] italic md:text-7xl">
            The stars <br />
            <span className="font-sans font-black tracking-tighter text-[var(--color-accent-orange)] not-italic">
              Are Aligned.
            </span>
          </h1>
          <p className="max-w-sm text-lg leading-relaxed font-medium text-[var(--color-primary-dark)]/70">
            Access your vendor sanctuary and master the mundane logs of your
            business empire.
          </p>
        </div>

        <div className="text-xs font-bold tracking-widest text-[var(--color-primary-dark)]/40 uppercase">
          © 2026 Astrologics Studio
        </div>

        {/* Decorative Moon Background element */}
        <div className="pointer-events-none absolute top-[10%] right-[-10%] opacity-5">
          <Moon size={500} strokeWidth={1} />
        </div>
      </div>

      {/* Right Column: Form (Saturn Side) */}
      <div className="relative flex w-full items-center justify-center bg-[var(--color-primary-dark)] p-8 md:w-1/2 md:p-20">
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-10">
          <Orbit
            size={900}
            strokeWidth={1}
            className="absolute top-0 -right-1/4 text-[var(--color-accent-glow)]"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 w-full max-w-md"
        >
          <div className="mb-10 flex items-center justify-between">
            <h2 className="text-2xl font-black tracking-tight text-[var(--color-primary-light)] uppercase">
              Login
            </h2>
            <Link
              href="/register"
              className="text-xs font-bold text-[var(--color-accent-glow)] underline underline-offset-4 transition-colors hover:text-[var(--color-primary-light)]"
            >
              Request Access
            </Link>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 rounded-xl border border-red-500/50 bg-red-500/10 p-4 text-sm font-medium text-red-200"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="group space-y-2">
              <label className="ml-1 text-[10px] font-black tracking-[0.3em] text-[var(--color-ring-bronze)] uppercase transition-colors group-focus-within:text-[var(--color-accent-glow)]">
                Identification
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={formData.identifier}
                  onChange={(e) =>
                    handleInputChange("identifier", e.target.value)
                  }
                  className="w-full rounded-2xl border border-[var(--color-ring-bronze)]/20 bg-[var(--color-primary-light)]/5 px-6 py-5 font-medium text-[var(--color-primary-light)] shadow-inner transition-all placeholder:text-[var(--color-ring-bronze)]/30 focus:border-[var(--color-accent-glow)] focus:outline-none"
                  placeholder="Email or Mobile"
                />
                <Mail className="absolute top-1/2 right-5 h-5 w-5 -translate-y-1/2 text-[var(--color-ring-bronze)]/40" />
              </div>
            </div>

            <div className="group space-y-2">
              <div className="flex items-center justify-between px-1">
                <label className="text-[10px] font-black tracking-[0.3em] text-[var(--color-ring-bronze)] uppercase transition-colors group-focus-within:text-[var(--color-accent-glow)]">
                  Access Key
                </label>
                <button
                  type="button"
                  className="text-[10px] font-black tracking-tighter text-[var(--color-accent-orange)] uppercase transition-all hover:brightness-125"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  className="w-full rounded-2xl border border-[var(--color-ring-bronze)]/20 bg-[var(--color-primary-light)]/5 px-6 py-5 font-medium text-[var(--color-primary-light)] shadow-inner transition-all placeholder:text-[var(--color-ring-bronze)]/30 focus:border-[var(--color-accent-glow)] focus:outline-none"
                  placeholder="••••••••"
                />
                <Lock className="absolute top-1/2 right-5 h-5 w-5 -translate-y-1/2 text-[var(--color-ring-bronze)]/40" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="group flex w-full items-center justify-center space-x-3 rounded-2xl bg-[var(--color-accent-glow)] py-6 font-black text-[var(--color-primary-dark)] shadow-[0_0_40px_rgba(164,196,217,0.1)] transition-all hover:bg-[var(--color-primary-light)] hover:shadow-[0_0_60px_rgba(164,196,217,0.2)] active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  <span className="text-sm tracking-[0.2em] uppercase">
                    Align Records
                  </span>
                  <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          {successMessage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 text-center font-bold text-[var(--color-accent-glow)] italic"
            >
              {successMessage}
            </motion.div>
          )}
        </motion.div>
      </div>

      <style jsx global>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-15px);
          }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
