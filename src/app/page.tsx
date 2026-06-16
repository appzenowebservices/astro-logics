"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "./components/Navbar";
import {
  Sparkles,
  BarChart3,
  Users,
  Zap,
  ArrowRight,
  Moon,
  Orbit,
} from "lucide-react";

export default function HomePage() {
  const features = [
    {
      icon: <BarChart3 className="h-10 w-10" />,
      title: "Lunar Analytics",
      description:
        "Clear, bright insights that illuminate your sales patterns like a full moon.",
      theme: "moon",
    },
    {
      icon: <Users className="h-10 w-10" />,
      title: "Saturnine Structure",
      description:
        "Deep, disciplined customer management to build rings of long-term loyalty.",
      theme: "saturn",
    },
    {
      icon: <Zap className="h-10 w-10" />,
      title: "Cosmic Velocity",
      description:
        "Fast-acting tools that bridge the gap between intuition and execution.",
      theme: "moon",
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-primary-light)] text-[var(--color-primary-dark)] selection:bg-[var(--color-primary-dark)] selection:text-[var(--color-primary-light)]">
      <Navbar />

      {/* Hero Section: The Moon (Light) */}
      <section className="relative overflow-hidden bg-[var(--color-primary-light)] pt-20 pb-32">
        <div className="pointer-events-none absolute top-20 right-[10%] opacity-10">
          <Moon size={400} strokeWidth={1} />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <div className="relative mx-auto mb-10 w-fit">
            <Image
              src="/astrologics_logo.png"
              alt="Astrologics logo"
              width={200}
              height={200}
              className="animate-float relative drop-shadow-2xl"
              priority
            />
          </div>

          <h1 className="mb-8 text-6xl font-black tracking-tighter text-[var(--color-primary-dark)] md:text-8xl">
            Illuminating <br />
            <span className="font-serif italic">Your Commerce</span>
          </h1>

          <p className="mx-auto mb-12 max-w-2xl text-xl font-medium text-[var(--color-primary-dark)]/80 md:text-2xl">
            The intelligent vendor platform where ancient cosmic wisdom meets
            modern digital scale.
          </p>

          <div className="flex flex-col justify-center gap-6 sm:flex-row">
            <Link
              href="/register"
              className="flex items-center gap-3 rounded-full bg-[var(--color-primary-dark)] px-12 py-5 font-bold text-[var(--color-primary-light)] shadow-xl transition-all hover:scale-105"
            >
              Start Your Journey <Sparkles className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section: The Saturn (Dark) */}
      <section className="relative overflow-hidden bg-[var(--color-primary-dark)] py-32 text-[var(--color-primary-light)]">
        <div className="pointer-events-none absolute bottom-[-10%] left-[-5%] rotate-12 opacity-5">
          <Orbit size={600} strokeWidth={1} />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-24 text-center">
            <h2 className="mb-4 text-sm font-black tracking-[0.5em] text-[var(--color-accent-glow)] uppercase">
              Celestial Infrastructure
            </h2>
            <h3 className="text-4xl font-bold tracking-tight text-[var(--color-primary-light)] md:text-6xl">
              Built for Stability
            </h3>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`rounded-[40px] border p-10 transition-all duration-500 hover:-translate-y-2 ${
                  feature.theme === "moon"
                    ? "border-transparent bg-[var(--color-primary-light)] text-[var(--color-primary-dark)] shadow-2xl"
                    : "border-[var(--color-primary-light)]/20 bg-transparent text-[var(--color-primary-light)] hover:bg-[var(--color-primary-light)]/5"
                }`}
              >
                <div
                  className={`mb-8 flex h-16 w-16 items-center justify-center rounded-2xl ${
                    feature.theme === "moon"
                      ? "bg-[var(--color-primary-dark)] text-[var(--color-primary-light)]"
                      : "bg-[var(--color-primary-light)] text-[var(--color-primary-dark)]"
                  }`}
                >
                  {feature.icon}
                </div>
                <h4 className="mb-4 text-2xl font-black tracking-tight uppercase">
                  {feature.title}
                </h4>
                <p className="leading-relaxed font-medium opacity-90">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section: Balanced Contrast */}
      <section className="bg-[var(--color-primary-light)] py-32">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <div className="inline-block w-full rounded-[60px] border-[6px] border-[var(--color-primary-dark)] p-12 md:p-24">
            <h3 className="mb-8 text-5xl font-black tracking-tighter text-[var(--color-primary-dark)] md:text-7xl">
              Ready to{" "}
              <span className="text-[var(--color-accent-orange)]">Ascend?</span>
            </h3>
            <p className="mx-auto mb-12 max-w-md text-xl font-bold tracking-widest text-[var(--color-primary-dark)]/70 uppercase">
              Establish your domain today.
            </p>
            <Link
              href="/register"
              className="block rounded-full bg-[var(--color-primary-dark)] px-16 py-7 text-xl font-black text-[var(--color-primary-light)] shadow-2xl transition-all hover:bg-[var(--color-accent-orange)] hover:text-white sm:inline-block"
            >
              Join the Constellation
            </Link>
          </div>
        </div>
      </section>

      <style jsx global>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-25px) rotate(2deg);
          }
        }
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
        h1,
        h2,
        h3,
        h4 {
          text-wrap: balance;
        }
      `}</style>
    </div>
  );
}
