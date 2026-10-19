"use client";

import React, { useState } from "react";
import {
  Mail,
  Lock,
  User,
  Phone,
  Sparkles,
  Loader2,
  ArrowLeft,
  Moon,
  Orbit,
  ChevronRight,
  Ticket,
} from "lucide-react";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    inviteCode: "",
  });
  const [error, setError] = useState("");

  const registerUser = api.user.registerUser.useMutation({
    onSuccess: () => {
      router.push("/login");
    },
    onError: (opts) => {
      setError(opts.message);
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    registerUser.mutate({
      name: formData.name,
      email: formData.email,
      mobile: formData.mobile || undefined,
      inviteCode: formData.inviteCode.trim() || undefined,
      password: formData.password,
    });
  };

  return (
    <div className="flex min-h-screen flex-col overflow-hidden bg-[var(--color-primary-light)] md:flex-row">
      {/* Left Column: The Invitation (Moon Side) */}
      <div className="relative flex w-full flex-col justify-between bg-[var(--color-primary-light)] p-10 md:w-1/2 md:p-24">
        <Link
          href="/login"
          className="group z-20 flex items-center text-sm font-black tracking-widest text-[var(--color-primary-dark)] uppercase"
        >
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />{" "}
          Back to Login
        </Link>

        <div className="relative z-10 my-12 md:my-0">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-8 inline-block"
          >
            <div className="animate-float flex h-20 w-20 rotate-3 items-center justify-center rounded-3xl bg-[var(--color-primary-dark)] shadow-2xl">
              <Sparkles className="h-10 w-10 text-[var(--color-accent-orange)]" />
            </div>
          </motion.div>
          <h1 className="mb-6 font-serif text-5xl leading-tight text-[var(--color-primary-dark)] italic md:text-7xl">
            Begin Your <br />
            <span className="font-sans font-black tracking-tighter text-[var(--color-accent-orange)] not-italic">
              Ascension.
            </span>
          </h1>
          <p className="max-w-sm text-lg leading-relaxed font-medium text-[var(--color-primary-dark)]/70">
            Join our private network of vendors and synchronize your business
            trajectory with cosmic precision.
          </p>
        </div>

        <div className="text-xs font-bold tracking-widest text-[var(--color-primary-dark)]/40 uppercase">
          Secure Enrollment • Protocol 2026
        </div>

        <div className="pointer-events-none absolute top-[10%] right-[-10%] opacity-5">
          <Moon size={500} strokeWidth={1} />
        </div>
      </div>

      {/* Right Column: The Enrollment (Saturn Side) */}
      <div className="relative flex w-full items-center justify-center bg-[var(--color-primary-dark)] p-8 md:w-1/2 md:p-20">
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-10">
          <Orbit
            size={900}
            strokeWidth={1}
            className="absolute bottom-0 -left-1/4 text-[var(--color-accent-glow)]"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 w-full max-w-md"
        >
          <div className="mb-10">
            <h2 className="text-2xl font-black tracking-tight text-[var(--color-primary-light)] uppercase">
              Create Account
            </h2>
            <div className="mt-2 h-1 w-12 bg-[var(--color-accent-orange)]" />
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 rounded-xl border border-red-500/50 bg-red-500/10 p-4 text-xs font-bold tracking-wider text-red-200 uppercase"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-5">
            {/* Full Name */}
            <div className="group space-y-1">
              <label className="ml-1 text-[10px] font-black tracking-[0.3em] text-[var(--color-ring-bronze)] uppercase group-focus-within:text-[var(--color-accent-glow)]">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="w-full rounded-2xl border border-[var(--color-ring-bronze)]/20 bg-[var(--color-primary-light)]/5 px-6 py-4 font-medium text-[var(--color-primary-light)] transition-all placeholder:text-[var(--color-ring-bronze)]/30 focus:border-[var(--color-accent-glow)] focus:outline-none"
                  placeholder="John Doe"
                />
                <User className="absolute top-1/2 right-5 h-4 w-4 -translate-y-1/2 text-[var(--color-ring-bronze)]/40" />
              </div>
            </div>

            {/* Email */}
            <div className="group space-y-1">
              <label className="ml-1 text-[10px] font-black tracking-[0.3em] text-[var(--color-ring-bronze)] uppercase group-focus-within:text-[var(--color-accent-glow)]">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="w-full rounded-2xl border border-[var(--color-ring-bronze)]/20 bg-[var(--color-primary-light)]/5 px-6 py-4 font-medium text-[var(--color-primary-light)] transition-all placeholder:text-[var(--color-ring-bronze)]/30 focus:border-[var(--color-accent-glow)] focus:outline-none"
                  placeholder="john@cosmos.com"
                />
                <Mail className="absolute top-1/2 right-5 h-4 w-4 -translate-y-1/2 text-[var(--color-ring-bronze)]/40" />
              </div>
            </div>

            {/* Mobile & Password Grid */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="group space-y-1">
                <label className="ml-1 text-[10px] font-black tracking-[0.3em] text-[var(--color-ring-bronze)] uppercase group-focus-within:text-[var(--color-accent-glow)]">
                  Mobile
                </label>
                <input
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) => handleInputChange("mobile", e.target.value)}
                  className="w-full rounded-2xl border border-[var(--color-ring-bronze)]/20 bg-[var(--color-primary-light)]/5 px-6 py-4 font-medium text-[var(--color-primary-light)] transition-all placeholder:text-[var(--color-ring-bronze)]/30 focus:border-[var(--color-accent-glow)] focus:outline-none"
                  placeholder="+91..."
                />
              </div>
              <div className="group space-y-1">
                <label className="ml-1 text-[10px] font-black tracking-[0.3em] text-[var(--color-ring-bronze)] uppercase group-focus-within:text-[var(--color-accent-glow)]">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  className="w-full rounded-2xl border border-[var(--color-ring-bronze)]/20 bg-[var(--color-primary-light)]/5 px-6 py-4 font-medium text-[var(--color-primary-light)] transition-all placeholder:text-[var(--color-ring-bronze)]/30 focus:border-[var(--color-accent-glow)] focus:outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Invite code */}
            <div className="group space-y-1">
              <label className="ml-1 text-[10px] font-black tracking-[0.3em] text-[var(--color-ring-bronze)] uppercase group-focus-within:text-[var(--color-accent-glow)]">
                Invite Code
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.inviteCode}
                  onChange={(e) =>
                    handleInputChange("inviteCode", e.target.value.toUpperCase())
                  }
                  className="w-full rounded-2xl border border-[var(--color-ring-bronze)]/20 bg-[var(--color-primary-light)]/5 px-6 py-4 font-mono text-sm font-medium tracking-[0.15em] text-[var(--color-primary-light)] uppercase transition-all placeholder:text-[var(--color-ring-bronze)]/30 focus:border-[var(--color-accent-glow)] focus:outline-none"
                  placeholder="KAAL-XXXX-XXXX"
                />
                <Ticket className="absolute top-1/2 right-5 h-4 w-4 -translate-y-1/2 text-[var(--color-ring-bronze)]/40" />
              </div>
              <p className="ml-1 text-[10px] font-medium text-[var(--color-ring-bronze)]/70">
                Leave blank if registration is open.
              </p>
            </div>

            <button
              type="submit"
              disabled={registerUser.isLoading}
              className="group mt-4 flex w-full items-center justify-center space-x-3 rounded-2xl bg-[var(--color-accent-glow)] py-5 font-black text-[var(--color-primary-dark)] shadow-xl transition-all hover:bg-[var(--color-primary-light)] active:scale-[0.98] disabled:opacity-50"
            >
              {registerUser.isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  <span className="text-sm tracking-[0.2em] uppercase">
                    Initialize Profile
                  </span>
                  <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs font-bold tracking-widest text-[var(--color-ring-bronze)] uppercase">
            Already registered?{" "}
            <Link
              href="/login"
              className="text-[var(--color-primary-light)] underline underline-offset-4 transition-colors hover:text-[var(--color-accent-glow)]"
            >
              Sign In
            </Link>
          </p>
        </motion.div>
      </div>

      <style jsx global>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) rotate(3deg);
          }
          50% {
            transform: translateY(-10px) rotate(-2deg);
          }
        }
        .animate-float {
          animation: float 5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
