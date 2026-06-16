"use client";
import Image from "next/image";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { UserCircle, LogOut, Loader2 } from "lucide-react";
// ==========================================================================================
export default function Navbar() {
  // ==========================================================================================

  const { data: session, status } = useSession();
  // ==========================================================================================

  return (
    <header className="bg-opacity-80 sticky top-0 z-50 border-b border-[var(--color-ring-bronze)]/20 bg-[var(--bg-main)] text-[var(--text-main)] backdrop-blur-md transition-colors duration-300">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center space-x-3">
          <div className="relative rounded-full bg-gradient-to-tr from-[var(--color-accent-orange)] to-[var(--color-accent-glow)] p-0.5 transition-transform group-hover:scale-105">
            <Image
              src="/astrologics_logo.png"
              alt="Astrologics logo"
              width={50}
              height={50}
              className="rounded-full bg-[var(--bg-main)] object-contain"
            />
          </div>
          <span className="text-2xl font-bold tracking-tight text-[var(--color-accent-orange)]">
            Astrologics
          </span>
        </Link>

        <div className="flex items-center space-x-6">
          {status === "loading" && (
            <Loader2 className="h-5 w-5 animate-spin text-[var(--color-accent-glow)]" />
          )}

          {status === "unauthenticated" && (
            <div className="flex items-center space-x-5">
              <Link
                href="/login"
                className="text-sm font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--color-accent-orange)]"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-[var(--brand-gradient)] px-5 py-2.5 text-sm font-semibold text-[var(--color-primary-light)] shadow-md transition hover:shadow-lg hover:brightness-110 active:scale-95"
              >
                Register
              </Link>
            </div>
          )}

          {status === "authenticated" && session.user && (
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2 rounded-full border border-[var(--color-accent-glow)]/30 bg-[var(--color-primary-light)]/10 px-4 py-1.5 shadow-sm">
                <UserCircle className="h-5 w-5 text-[var(--color-accent-orange)]" />
                <span className="text-sm font-semibold text-[var(--text-main)]">
                  {session.user.name || session.user.email}
                </span>
              </div>

              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="group flex items-center space-x-1.5 text-sm font-medium text-[var(--text-muted)] transition-all hover:text-[var(--color-accent-orange)]"
              >
                <LogOut className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
// ==========================================================================================
