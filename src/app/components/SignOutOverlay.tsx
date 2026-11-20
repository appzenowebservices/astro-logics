"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Shared sign-out flow: shows the "Until next orbit" transition, clears the
 * NextAuth session, then returns to the landing page.
 */
export function useSignOut(delayMs = 650) {
  const router = useRouter();
  const { status } = useSession();
  const [signingOut, setSigningOut] = useState(false);

  // Release the overlay as soon as the session is actually gone, even when the
  // navigation itself is a no-op (e.g. signing out from the landing page).
  useEffect(() => {
    if (signingOut && status === "unauthenticated") {
      setSigningOut(false);
    }
  }, [signingOut, status]);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      await signOut({ redirect: false });
      router.replace("/");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  return { signingOut, handleSignOut };
}

/**
 * Full-screen sign-out prompt, portaled to <body> so it stays above the app
 * shell on every page (landing, dashboard, nativity, ...).
 */
export function SignOutOverlay({ open }: { open: boolean }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
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
  );
}
