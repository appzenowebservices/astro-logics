"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { LogOut, Loader2, LayoutDashboard } from "lucide-react";
import { api } from "~/trpc/react";

const SECTION_LINKS = [
  { href: "#engine", label: "Engine" },
  { href: "#method", label: "Method" },
  { href: "#parliament", label: "Parliament" },
  { href: "#market", label: "Market" },
];
// ==========================================================================================
export default function Navbar() {
  // ==========================================================================================

  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === "/";
  const [signingOut, setSigningOut] = useState(false);

  const me = api.user.me.useQuery(undefined, {
    enabled: status === "authenticated",
  });

  /**
   * Smooth sign-out: show a short overlay, clear the session, then land on the
   * landing page instead of an abrupt reload.
   */
  async function handleSignOut() {
    setSigningOut(true);
    await new Promise((resolve) => setTimeout(resolve, 450));
    await signOut({ redirect: false });
    router.replace("/");
    router.refresh();
  }

  const accountLabel = session?.user?.name?.length
    ? session.user.name
    : session?.user?.email;

  const isAnalyst = me.data?.role === "ADMIN" || me.data?.role === "ANALYST";
  const isAdmin = me.data?.role === "ADMIN";

  const links = [
    ...(isHome
      ? SECTION_LINKS
      : [{ href: "/", label: "Home" }]),
    { href: "/ideas", label: "Ideas" },
    ...(status === "authenticated"
      ? [{ href: "/dashboard", label: "Dashboard" }]
      : []),
    ...(isAnalyst ? [{ href: "/studio", label: "Studio" }] : []),
    ...(isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
  ];
  // ==========================================================================================

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-primary-light)]/10 bg-[var(--color-primary-dark)]/75 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        {/* Identity */}
        <Link href="/" className="group flex items-center gap-3">
          <span className="relative grid h-10 w-10 shrink-0 place-items-center">
            <span className="absolute inset-0 rounded-full bg-[var(--color-accent-glow)]/25 blur-lg transition-colors duration-500 group-hover:bg-[var(--color-accent-orange)]/30" />
            <Image
              src="/logo.png"
              alt="Kaalvanta logo"
              width={76}
              height={40}
              className="relative h-10 w-auto object-contain drop-shadow-[0_0_12px_rgba(234,221,189,0.35)]"
            />
          </span>
          <span className="text-sm font-black tracking-[0.28em] text-[var(--color-primary-light)] uppercase sm:text-base">
            Kaal<span className="text-[var(--color-accent-orange)]">vanta</span>
          </span>
        </Link>

        {/* Section links */}
        <div className="hidden items-center gap-7 lg:flex">
          {links.map((link) => {
            const active = !link.href.startsWith("#") && pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`group relative font-mono text-[10px] font-bold tracking-[0.25em] uppercase transition-colors ${
                  active
                    ? "text-[var(--color-accent-orange)]"
                    : "text-[var(--color-primary-light)]/60 hover:text-[var(--color-primary-light)]"
                }`}
              >
                {link.label}
                <span
                  className={`absolute -bottom-1.5 left-0 h-px bg-[var(--color-accent-orange)] transition-all duration-300 ${
                    active ? "w-full" : "w-0 group-hover:w-full"
                  }`}
                />
              </Link>
            );
          })}
        </div>

        {/* Session actions */}
        <div className="flex items-center gap-4">
          {status === "loading" && (
            <Loader2 className="h-5 w-5 animate-spin text-[var(--color-accent-glow)]" />
          )}

          {status === "unauthenticated" && (
            <div className="flex items-center gap-2 sm:gap-4">
              <Link
                href="/login"
                className="hidden font-mono text-[10px] font-bold tracking-[0.25em] text-[var(--color-primary-light)]/60 uppercase transition-colors hover:text-[var(--color-primary-light)] sm:block"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-[var(--color-primary-light)] px-5 py-2.5 text-[11px] font-black tracking-[0.15em] text-[var(--color-primary-dark)] uppercase shadow-[0_0_30px_rgba(234,221,189,0.15)] transition-all hover:bg-[var(--color-accent-orange)] hover:text-white active:scale-95"
              >
                Begin
              </Link>
            </div>
          )}

          {status === "authenticated" && session.user && (
            <div className="flex items-center gap-3 sm:gap-5">
              <Link
                href="/dashboard"
                className="hidden items-center gap-2 rounded-full border border-[var(--color-accent-glow)]/25 bg-[var(--color-primary-light)]/5 px-4 py-2 transition-colors hover:border-[var(--color-accent-orange)]/50 sm:flex"
              >
                <LayoutDashboard className="h-3.5 w-3.5 text-[var(--color-accent-orange)]" />
                <span className="max-w-[140px] truncate font-mono text-[10px] font-bold tracking-[0.15em] text-[var(--color-primary-light)]/80 uppercase">
                  {accountLabel}
                </span>
              </Link>

              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="group flex items-center gap-1.5 font-mono text-[10px] font-bold tracking-[0.2em] text-[var(--color-primary-light)]/50 uppercase transition-all hover:text-[var(--color-accent-orange)] disabled:opacity-60"
              >
                <LogOut className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                <span className="hidden sm:inline">Exit</span>
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Sign-out transition — keeps the session clearing from feeling abrupt */}
      <AnimatePresence>
        {signingOut && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-[var(--color-primary-dark)]/95 backdrop-blur-md"
            role="status"
            aria-live="polite"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center gap-5"
            >
              <Image
                src="/logo.png"
                alt="Kaalvanta logo"
                width={152}
                height={80}
                className="h-16 w-auto animate-pulse object-contain drop-shadow-[0_0_30px_rgba(234,221,189,0.3)]"
              />
              <p className="font-mono text-[10px] font-black tracking-[0.3em] text-[var(--color-primary-light)]/60 uppercase">
                Signing out…
              </p>
              <Loader2 className="h-5 w-5 animate-spin text-[var(--color-accent-orange)]" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
// ==========================================================================================
