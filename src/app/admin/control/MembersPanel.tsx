"use client";

import React, { useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Search, SlidersHorizontal, Users, X } from "lucide-react";
import { api } from "~/trpc/react";

const ROLE_OPTIONS = ["ADMIN", "ANALYST", "MEMBER"] as const;
const PLAN_OPTIONS = ["FREE", "BASIC", "PREMIUM", "ENTERPRISE"] as const;
const STATUS_OPTIONS = ["INVITED", "ACTIVE", "SUSPENDED"] as const;

type Role = (typeof ROLE_OPTIONS)[number];
type Plan = (typeof PLAN_OPTIONS)[number];
type AccountStatus = (typeof STATUS_OPTIONS)[number];
type Draft = { role: Role; plan: Plan; status: AccountStatus };

const AVATAR_TONES = [
  "bg-[var(--color-primary-dark)] text-[var(--color-primary-light)]",
  "bg-[var(--color-accent-orange)] text-white",
  "bg-white text-[var(--color-primary-dark)]",
  "bg-[var(--color-ring-bronze)] text-[var(--color-primary-dark)]",
];

const ROLE_TONE: Record<string, string> = {
  ADMIN: "bg-[var(--color-accent-orange)]/15 text-[var(--color-accent-orange)]",
  ANALYST: "bg-[var(--color-primary-dark)]/10 text-[var(--color-primary-dark)]",
  MEMBER: "bg-[var(--color-primary-light)] text-[var(--color-primary-dark)]/70",
};

const PLAN_TONE: Record<string, string> = {
  ENTERPRISE:
    "bg-[var(--color-primary-dark)]/10 text-[var(--color-primary-dark)]",
  PREMIUM:
    "bg-[var(--color-accent-orange)]/15 text-[var(--color-accent-orange)]",
  BASIC: "bg-[var(--color-primary-light)] text-[var(--color-primary-dark)]/70",
  FREE: "bg-[var(--color-primary-dark)]/[0.04] text-[var(--color-primary-dark)]/55",
};

const STATUS_TONE: Record<string, string> = {
  ACTIVE: "bg-emerald-500/10 text-emerald-700",
  INVITED: "bg-amber-500/10 text-amber-700",
  SUSPENDED: "bg-red-500/10 text-red-700",
};

const STATUS_DOT: Record<string, string> = {
  ACTIVE: "bg-emerald-500",
  INVITED: "bg-amber-500",
  SUSPENDED: "bg-red-500",
};

const shortDate = (value: Date | string) =>
  new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

function initialsOf(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.split("@")[0] || "?";
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "?";
  const second = parts.length > 1 ? parts[parts.length - 1]?.[0] : source[1];
  return `${first}${second ?? ""}`.toUpperCase();
}

function toneFor(seed: string) {
  const sum = [...seed].reduce(
    (acc, character) => acc + character.charCodeAt(0),
    0,
  );
  return AVATAR_TONES[sum % AVATAR_TONES.length]!;
}

function UserAvatar({
  name,
  email,
  src,
  size = 44,
}: {
  name?: string | null;
  email?: string | null;
  src?: string | null;
  size?: number;
}) {
  const [broken, setBroken] = useState(false);
  const label = name?.trim() || email || "Member";

  return (
    <span
      style={{ width: size, height: size }}
      className={`relative grid shrink-0 place-items-center overflow-hidden rounded-full border-2 border-white shadow-[0_3px_10px_rgba(42,65,112,0.18)] ${toneFor(label)}`}
    >
      {src && !broken ? (
        <img
          src={src}
          alt={label}
          referrerPolicy="no-referrer"
          onError={() => setBroken(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span
          className="font-poster leading-none"
          style={{ fontSize: size * 0.4 }}
        >
          {initialsOf(name, email)}
        </span>
      )}
    </span>
  );
}

function Pill({
  children,
  tone,
  dot,
}: {
  children: ReactNode;
  tone: string;
  dot?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-sans text-[10px] font-black tracking-[0.1em] uppercase ${tone}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />}
      {children}
    </span>
  );
}

function OptionGroup<T extends string>({
  label,
  options,
  value,
  tones,
  disabledOptions,
  disabledHint,
  onChange,
}: {
  label: string;
  options: readonly T[];
  value: T;
  tones: Record<string, string>;
  disabledOptions?: readonly T[];
  disabledHint?: string;
  onChange: (next: T) => void;
}) {
  return (
    <div>
      <p className="mb-2 font-sans text-[10px] font-black tracking-[0.2em] uppercase opacity-40">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = option === value;
          const disabled = disabledOptions?.includes(option) ?? false;

          return (
            <button
              key={option}
              type="button"
              disabled={disabled}
              onClick={() => onChange(option)}
              className={`rounded-full px-3.5 py-2 font-sans text-[10px] font-black tracking-[0.1em] uppercase transition ${
                active
                  ? `${tones[option] ?? "bg-white"} ring-2 ring-[var(--color-primary-dark)]/20`
                  : "bg-white text-[var(--color-primary-dark)]/55 hover:bg-white hover:text-[var(--color-primary-dark)]"
              } ${disabled ? "cursor-not-allowed opacity-35" : ""}`}
            >
              {option}
            </button>
          );
        })}
      </div>
      {disabledOptions?.length ? (
        <p className="mt-2 font-sans text-[9px] tracking-[0.06em] uppercase opacity-35">
          {disabledHint}
        </p>
      ) : null}
    </div>
  );
}

export default function MembersPanel() {
  const utils = api.useUtils();
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!editingId) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setEditingId(null);
        setDraft(null);
      }
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [editingId]);

  const me = api.user.me.useQuery();
  const users = api.admin.listUsers.useQuery();

  const updateUser = api.admin.updateUser.useMutation({
    onSuccess: () => {
      void utils.admin.listUsers.invalidate();
      void utils.admin.platformOverview.invalidate();
    },
  });
  const deleteUser = api.admin.deleteUser.useMutation({
    onSuccess: () => {
      void utils.admin.listUsers.invalidate();
      void utils.admin.platformOverview.invalidate();
      closeEditor();
    },
  });

  const filteredUsers = useMemo(() => {
    const list = users.data ?? [];
    const needle = query.trim().toLowerCase();
    if (!needle) return list;
    return list.filter((user) =>
      [user.name, user.email, user.mobile]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(needle)),
    );
  }, [query, users.data]);

  const editingUser = users.data?.find((user) => user.id === editingId) ?? null;
  const isSelf = editingUser?.id === me.data?.id;
  const dirty = Boolean(
    editingUser &&
    draft &&
    (draft.role !== editingUser.role ||
      draft.plan !== editingUser.plan ||
      draft.status !== editingUser.status),
  );

  function closeEditor() {
    setEditingId(null);
    setDraft(null);
    setConfirmingDelete(false);
  }

  const saveDraft = () => {
    if (!editingUser || !draft) return;
    updateUser.mutate(
      { id: editingUser.id, ...draft },
      { onSuccess: closeEditor },
    );
  };

  return (
    <>
      <section className="overflow-hidden rounded-3xl border border-[var(--color-primary-dark)]/10 bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-3 border-b border-[var(--color-primary-dark)]/8 bg-[var(--color-primary-light)]/50 px-5 py-3.5">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--color-accent-orange)]/15 text-[var(--color-accent-orange)]">
            <Users className="h-3.5 w-3.5" />
          </span>
          <h2 className="font-poster text-lg uppercase">The roster</h2>
          <span className="rounded-full bg-[var(--color-primary-dark)]/8 px-2 py-0.5 font-sans text-[10px] font-black">
            {filteredUsers.length}
            {query ? `/${users.data?.length ?? 0}` : ""}
          </span>

          <div className="relative ml-auto w-full sm:w-auto">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 opacity-35" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search crew…"
              aria-label="Search members"
              className="w-full rounded-full border border-[var(--color-primary-dark)]/12 bg-white py-2 pr-3 pl-8 text-xs font-semibold transition outline-none placeholder:text-[var(--color-primary-dark)]/30 focus:border-[var(--color-accent-orange)]/50 focus:ring-2 focus:ring-[var(--color-accent-orange)]/15 sm:w-52 sm:py-1.5"
            />
          </div>
        </div>

        {users.isLoading && (
          <div className="flex items-center gap-3 px-5 py-6">
            <Loader2 className="h-5 w-5 animate-spin opacity-35" />
            <span className="font-sans text-[11px] font-black tracking-[0.2em] uppercase opacity-40">
              Loading crew…
            </span>
          </div>
        )}

        {!users.isLoading && filteredUsers.length === 0 && (
          <p className="px-5 py-6 text-xs font-semibold opacity-45">
            No members match “{query}”.
          </p>
        )}

        <div className="divide-y divide-[var(--color-primary-dark)]/8">
          {filteredUsers.map((user) => {
            const self = user.id === me.data?.id;
            const avatar = user.avatar ?? user.image ?? null;

            return (
              <div
                key={user.id}
                className="flex flex-wrap items-center gap-3 px-5 py-4 transition-colors hover:bg-[var(--color-primary-light)]/35"
              >
                <UserAvatar name={user.name} email={user.email} src={avatar} />

                <div className="min-w-0 flex-1 basis-40">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-black">{user.name}</p>
                    {self && (
                      <span className="rounded-full bg-[var(--color-accent-orange)]/15 px-2 py-0.5 font-sans text-[9px] font-black tracking-[0.16em] text-[var(--color-accent-orange)] uppercase">
                        You
                      </span>
                    )}
                  </div>
                  <p className="truncate font-sans text-[12px] opacity-50">
                    {user.email}
                  </p>
                  <p className="mt-1 font-sans text-[10px] tracking-[0.08em] uppercase opacity-35">
                    {user._count.nativityCharts} charts · {user._count.posts}{" "}
                    posts · joined {shortDate(user.createdAt)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Pill tone={ROLE_TONE[user.role] ?? "bg-white"}>
                    {user.role}
                  </Pill>
                  <Pill tone={PLAN_TONE[user.plan] ?? "bg-white"}>
                    {user.plan}
                  </Pill>
                  <Pill
                    tone={STATUS_TONE[user.status] ?? "bg-white"}
                    dot={STATUS_DOT[user.status]}
                  >
                    {user.status}
                  </Pill>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(user.id);
                      setDraft({
                        role: user.role,
                        plan: user.plan,
                        status: user.status,
                      });
                      setConfirmingDelete(false);
                    }}
                    title={`Manage ${user.name}`}
                    aria-label={`Manage ${user.name}`}
                    className="ml-1 grid h-8 w-8 place-items-center rounded-full border border-[var(--color-primary-dark)]/10 bg-white text-[var(--color-primary-dark)]/55 shadow-sm transition-colors hover:border-[var(--color-accent-orange)]/40 hover:text-[var(--color-accent-orange)]"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {editingUser && draft && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={closeEditor}
                className="fixed inset-0 z-[160] flex items-end justify-center bg-[var(--color-primary-dark)]/35 p-4 sm:items-center"
              >
                <motion.div
                  role="dialog"
                  aria-modal="true"
                  aria-label={`Manage ${editingUser.name}`}
                  onClick={(event) => event.stopPropagation()}
                  initial={{ opacity: 0, y: 24, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 16, scale: 0.98 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="w-full max-w-lg rounded-3xl border border-white/60 bg-[var(--color-primary-light)] p-5 shadow-[0_40px_90px_-40px_rgba(20,32,58,0.8)] sm:p-6"
                >
                  <div className="flex items-start gap-3">
                    <UserAvatar
                      name={editingUser.name}
                      email={editingUser.email}
                      src={editingUser.avatar ?? editingUser.image ?? null}
                      size={48}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-black">
                        {editingUser.name}
                      </p>
                      <p className="truncate font-sans text-[11px] opacity-50">
                        {editingUser.email}
                      </p>
                      <p className="mt-1 font-sans text-[10px] tracking-[0.08em] uppercase opacity-35">
                        Member since {shortDate(editingUser.createdAt)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={closeEditor}
                      aria-label="Close editor"
                      className="grid h-8 w-8 place-items-center rounded-full text-[var(--color-primary-dark)]/40 transition-colors hover:bg-white hover:text-[var(--color-primary-dark)]"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-6 space-y-5">
                    <OptionGroup
                      label="Role"
                      options={ROLE_OPTIONS}
                      value={draft.role}
                      tones={ROLE_TONE}
                      disabledOptions={
                        isSelf ? (["ANALYST", "MEMBER"] as Role[]) : undefined
                      }
                      disabledHint="You can’t demote your own account."
                      onChange={(role) =>
                        setDraft((current) =>
                          current ? { ...current, role } : current,
                        )
                      }
                    />
                    <OptionGroup
                      label="Plan"
                      options={PLAN_OPTIONS}
                      value={draft.plan}
                      tones={PLAN_TONE}
                      onChange={(plan) =>
                        setDraft((current) =>
                          current ? { ...current, plan } : current,
                        )
                      }
                    />
                    <OptionGroup
                      label="Status"
                      options={STATUS_OPTIONS}
                      value={draft.status}
                      tones={STATUS_TONE}
                      onChange={(status) =>
                        setDraft((current) =>
                          current ? { ...current, status } : current,
                        )
                      }
                    />
                  </div>

                  <div className="mt-6 rounded-2xl border border-red-900/10 bg-red-500/5 px-4 py-3">
                    {isSelf ? (
                      <p className="font-sans text-[10px] tracking-[0.06em] uppercase opacity-40">
                        You can’t delete your own account.
                      </p>
                    ) : confirmingDelete ? (
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="min-w-0 flex-1 basis-52 font-sans text-[10px] leading-relaxed tracking-[0.05em] uppercase opacity-60">
                          Delete {editingUser.name} permanently? Charts, posts
                          and login access are removed.
                        </p>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setConfirmingDelete(false)}
                            className="rounded-full px-3 py-2 font-sans text-[10px] font-black tracking-[0.12em] uppercase opacity-55 transition-colors hover:bg-white hover:opacity-100"
                          >
                            Keep
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              deleteUser.mutate({ id: editingUser.id })
                            }
                            disabled={deleteUser.isPending}
                            className="inline-flex items-center gap-1.5 rounded-full bg-red-700 px-4 py-2 font-sans text-[10px] font-black tracking-[0.12em] text-white uppercase transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-50"
                          >
                            {deleteUser.isPending && (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            )}
                            Delete member
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-sans text-[10px] tracking-[0.06em] uppercase opacity-40">
                          Remove this member
                        </p>
                        <button
                          type="button"
                          onClick={() => setConfirmingDelete(true)}
                          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-sans text-[10px] font-black tracking-[0.12em] text-red-700 uppercase transition-colors hover:bg-red-500/10"
                        >
                          <X className="h-3.5 w-3.5" /> Delete
                        </button>
                      </div>
                    )}
                  </div>

                  {(deleteUser.error || updateUser.error) && (
                    <p className="mt-3 rounded-xl bg-red-500/10 px-3 py-2 font-sans text-[10px] leading-relaxed tracking-[0.04em] text-red-700 uppercase">
                      {deleteUser.error?.message ?? updateUser.error?.message}
                    </p>
                  )}

                  <div className="mt-5 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={closeEditor}
                      className="rounded-full px-4 py-2.5 font-sans text-[10px] font-black tracking-[0.16em] uppercase opacity-55 transition-colors hover:bg-white hover:opacity-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={saveDraft}
                      disabled={!dirty || updateUser.isPending}
                      className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary-dark)] px-5 py-2.5 font-sans text-[10px] font-black tracking-[0.16em] text-[var(--color-primary-light)] uppercase shadow-sm transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-40"
                    >
                      {updateUser.isPending && (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      )}
                      Save changes
                    </button>
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
