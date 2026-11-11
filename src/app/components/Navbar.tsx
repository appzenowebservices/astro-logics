"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { LogOut, Loader2 } from "lucide-react";
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const me = api.user.me.useQuery(undefined, {
    enabled: status === "authenticated",
    retry: false,
  });

  // A stale session (deleted user) resolves to null — clear it instead of
  // letting the query retry on every render.
  useEffect(() => {
    if (status === "authenticated" && me.isSuccess && me.data === null) {
      void signOut({ redirect: false });
    }
  }, [status, me.isSuccess, me.data]);

  /**
   * Smooth sign-out: show a short overlay, clear the session, then land on the
   * landing page instead of an abrupt reload.
   */
  async function handleSignOut() {
    setSigningOut(true);
    await new Promise((resolve) => setTimeout(resolve, 650));
    await signOut({ redirect: false });
    router.replace("/");
    router.refresh();
  }

  const accountLabel = session?.user?.name?.length
    ? session.user.name
    : session?.user?.email;

  const isAnalyst = me.data?.role === "ADMIN" || me.data?.role === "ANALYST";
  const isAdmin = me.data?.role === "ADMIN";

  // OAuth profiles land in `image` (or `avatar` for older rows).
  const avatarUrl = me.data?.avatar ?? me.data?.image ?? session?.user?.image;
  const initial = (session?.user?.name ?? session?.user?.email ?? "K")
    .charAt(0)
    .toUpperCase();

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
    <>
      <header className="sticky top-0 z-50 border-b border-[var(--color-ring-bronze)]/25 bg-[var(--color-primary-dark)]">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        {/* Identity */}
        <Link href="/" className="group flex items-center gap-3">
          <span className="relative grid h-10 w-10 shrink-0 place-items-center">
            <Image
              src="/logo.png"
              alt="Kaalvanta logo"
              width={76}
              height={40}
              className="relative h-10 w-auto object-contain"
            />
          </span>
          <span className="text-sm font-black tracking-[0.22em] text-[var(--color-primary-light)] uppercase sm:text-base">
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
                className={`group relative font-sans text-[12px] font-extrabold tracking-[0.2em] uppercase transition-colors ${
                  active
                    ? "text-[var(--color-accent-orange)]"
                    : "text-[var(--color-primary-light)]/65 hover:text-[var(--color-primary-light)]"
                }`}
              >
                {link.label}
                <span
                  className={`absolute -bottom-1.5 left-0 h-0.5 bg-[var(--color-accent-orange)] transition-all duration-300 ${
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
                className="hidden font-sans text-[12px] font-extrabold tracking-[0.2em] text-[var(--color-primary-light)]/65 uppercase transition-colors hover:text-[var(--color-primary-light)] sm:block"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-[var(--color-primary-light)] px-5 py-2.5 text-[12px] font-black tracking-[0.15em] text-[var(--color-primary-dark)] uppercase transition-all hover:bg-[var(--color-accent-orange)] hover:text-white active:scale-95"
              >
                Begin
              </Link>
            </div>
          )}

          {status === "authenticated" && session.user && (
            <div className="flex items-center gap-3 sm:gap-5">
              <Link
                href="/dashboard"
                className="hidden items-center gap-2.5 rounded-full border border-[var(--color-ring-bronze)]/40 bg-[var(--color-primary-dark)] py-1 pr-4 pl-1 transition-colors hover:border-[var(--color-accent-orange)] sm:flex"
              >
                <span className="relative grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-full border border-[var(--color-ring-bronze)]/50 bg-[var(--color-primary-light)]">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={accountLabel ?? "Profile"}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="font-sans text-[12px] font-black text-[var(--color-primary-dark)]">
                      {initial}
                    </span>
                  )}
                </span>
                <span className="max-w-[140px] truncate font-sans text-[12px] font-extrabold tracking-[0.12em] text-[var(--color-primary-light)]/85 uppercase">
                  {accountLabel}
                </span>
              </Link>

              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="group flex items-center gap-1.5 font-sans text-[12px] font-extrabold tracking-[0.18em] text-[var(--color-primary-light)]/60 uppercase transition-all hover:text-[var(--color-accent-orange)] disabled:opacity-60"
              >
                <LogOut className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                <span className="hidden sm:inline">Exit</span>
              </button>
            </div>
          )}
        </div>
      </nav>

      </header>

      {/* Sign-out transition — portaled to <body> so it stays above the app shell. */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {signingOut && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="fixed inset-0 z-[200] flex items-center justify-center bg-[var(--color-primary-dark)]"
                role="status"
                aria-live="polite"
              >
                <motion.div
                  initial={{ scale: 0.94, opacity: 0, y: 14 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="relative flex w-full max-w-sm flex-col items-center px-8 text-center"
                >
                  <div className="relative grid h-24 w-24 place-items-center">
                    <Image
                      src="/logo.png"
                      alt="Kaalvanta logo"
                      width={152}
                      height={80}
                      className="relative h-14 w-auto object-contain"
                    />
                  </div>

                  <p className="mt-7 font-serif text-3xl leading-none font-normal text-[var(--color-primary-light)] italic">
                    Until next orbit
                  </p>
                  <p className="mt-3 font-sans text-[11px] font-extrabold tracking-[0.3em] text-[var(--color-primary-light)]/55 uppercase">
                    Signing out
                  </p>

                  <div className="mt-7 h-1 w-48 overflow-hidden rounded-full bg-[var(--color-primary-light)]/15">
                    <motion.div
                      initial={{ x: "-100%" }}
                      animate={{ x: "100%" }}
                      transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="h-full w-1/2 rounded-full bg-[var(--color-accent-orange)]"
                    />
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
// ==========================================================================================
