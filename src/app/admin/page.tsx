"use client";

import React, { useState } from "react";
import { api } from "~/trpc/react";
import Navbar from "../components/Navbar";
import {
  Check,
  Copy,
  Loader2,
  ShieldAlert,
  Ticket,
  Users,
  X,
} from "lucide-react";

type Tab = "users" | "invites" | "waitlist";

const ROLE_OPTIONS = ["ADMIN", "ANALYST", "MEMBER"] as const;
const PLAN_OPTIONS = ["FREE", "BASIC", "PREMIUM", "ENTERPRISE"] as const;
const STATUS_OPTIONS = ["INVITED", "ACTIVE", "SUSPENDED"] as const;

export default function AdminPage() {
  const utils = api.useUtils();
  const [tab, setTab] = useState<Tab>("users");
  const [copied, setCopied] = useState<string | null>(null);

  const me = api.user.me.useQuery();
  const isAdmin = me.data?.role === "ADMIN";

  const overview = api.admin.overview.useQuery(undefined, {
    enabled: isAdmin,
  });
  const users = api.admin.listUsers.useQuery(undefined, { enabled: isAdmin });
  const invites = api.invite.list.useQuery(undefined, { enabled: isAdmin });
  const waitlist = api.admin.listWaitlist.useQuery(undefined, {
    enabled: isAdmin,
  });

  const updateUser = api.admin.updateUser.useMutation({
    onSuccess: () => utils.admin.listUsers.invalidate(),
  });
  const createInvite = api.invite.create.useMutation({
    onSuccess: () => utils.invite.list.invalidate(),
  });
  const revokeInvite = api.invite.revoke.useMutation({
    onSuccess: () => utils.invite.list.invalidate(),
  });
  const approveWaitlist = api.admin.approveWaitlist.useMutation({
    onSuccess: () => utils.admin.listWaitlist.invalidate(),
  });

  const [inviteForm, setInviteForm] = useState({
    email: "",
    role: "MEMBER",
    plan: "FREE",
    maxUses: 1,
    expiresInDays: 30,
  });

  if (!me.isLoading && !isAdmin) {
    return (
      <div className="min-h-screen bg-[var(--color-primary-light)] text-[var(--color-primary-dark)]">
        <Navbar />
        <div className="mx-auto max-w-3xl px-6 py-24 text-center">
          <ShieldAlert className="mx-auto mb-4 h-9 w-9 text-[var(--color-accent-orange)]" />
          <h1 className="text-2xl font-black tracking-tight">Admins only</h1>
          <p className="mt-2 text-sm font-medium opacity-60">
            Your account does not have access to this console.
          </p>
        </div>
      </div>
    );
  }

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-primary-light)] text-[var(--color-primary-dark)]">
      <Navbar />

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-[var(--color-ring-bronze)]/40 pb-6">
          <div>
            <p className="font-mono text-[10px] font-black tracking-[0.35em] text-[var(--color-accent-orange)] uppercase">
              Control plane
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tighter">
              Admin{" "}
              <span className="font-serif font-normal italic">console</span>
            </h1>
          </div>

          <div className="flex gap-1.5 rounded-full border border-[var(--color-ring-bronze)]/40 p-1">
            {(["users", "invites", "waitlist"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-full px-4 py-2 font-mono text-[9px] font-black tracking-[0.18em] uppercase transition-colors ${
                  tab === t
                    ? "bg-[var(--color-primary-dark)] text-[var(--color-primary-light)]"
                    : "opacity-60 hover:opacity-100"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Overview */}
        <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: "Users", value: overview.data?.users },
            { label: "Active", value: overview.data?.activeUsers },
            { label: "Suspended", value: overview.data?.suspended },
            { label: "Charts", value: overview.data?.charts },
            { label: "Published", value: overview.data?.published },
            { label: "Open invites", value: overview.data?.invites },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-[var(--color-ring-bronze)]/40 bg-white/60 p-4"
            >
              <p className="font-mono text-2xl font-black tracking-tight">
                {s.value ?? "—"}
              </p>
              <p className="mt-1 font-mono text-[8px] font-bold tracking-[0.2em] uppercase opacity-50">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* Users */}
        {tab === "users" && (
          <div className="overflow-hidden rounded-3xl border border-[var(--color-ring-bronze)]/40 bg-white/60">
            <div className="flex items-center gap-2 border-b border-[var(--color-ring-bronze)]/30 px-5 py-3.5">
              <Users className="h-4 w-4 text-[var(--color-accent-orange)]" />
              <span className="font-mono text-[9px] font-black tracking-[0.2em] uppercase opacity-60">
                Members
              </span>
            </div>

            <div className="divide-y divide-[var(--color-ring-bronze)]/20">
              {users.isLoading && (
                <div className="p-6">
                  <Loader2 className="h-5 w-5 animate-spin opacity-40" />
                </div>
              )}

              {users.data?.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-wrap items-center gap-3 px-5 py-3.5 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{user.name}</p>
                    <p className="truncate font-mono text-[10px] opacity-50">
                      {user.email}
                    </p>
                  </div>

                  <select
                    value={user.role}
                    onChange={(e) =>
                      updateUser.mutate({
                        id: user.id,
                        role: e.target.value as (typeof ROLE_OPTIONS)[number],
                      })
                    }
                    className="rounded-lg border border-[var(--color-ring-bronze)]/40 bg-white px-2 py-1 font-mono text-[10px] font-bold uppercase"
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>

                  <select
                    value={user.plan}
                    onChange={(e) =>
                      updateUser.mutate({
                        id: user.id,
                        plan: e.target.value as (typeof PLAN_OPTIONS)[number],
                      })
                    }
                    className="rounded-lg border border-[var(--color-ring-bronze)]/40 bg-white px-2 py-1 font-mono text-[10px] font-bold uppercase"
                  >
                    {PLAN_OPTIONS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>

                  <select
                    value={user.status}
                    onChange={(e) =>
                      updateUser.mutate({
                        id: user.id,
                        status: e.target.value as (typeof STATUS_OPTIONS)[number],
                      })
                    }
                    className="rounded-lg border border-[var(--color-ring-bronze)]/40 bg-white px-2 py-1 font-mono text-[10px] font-bold uppercase"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Invites */}
        {tab === "invites" && (
          <div className="space-y-6">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createInvite.mutate({
                  email: inviteForm.email || undefined,
                  role: inviteForm.role as (typeof ROLE_OPTIONS)[number],
                  plan: inviteForm.plan as (typeof PLAN_OPTIONS)[number],
                  maxUses: Number(inviteForm.maxUses),
                  expiresInDays: Number(inviteForm.expiresInDays),
                });
              }}
              className="grid gap-3 rounded-3xl border border-[var(--color-ring-bronze)]/40 bg-white/60 p-5 sm:grid-cols-2 lg:grid-cols-6"
            >
              <input
                type="email"
                placeholder="email (optional)"
                value={inviteForm.email}
                onChange={(e) =>
                  setInviteForm((f) => ({ ...f, email: e.target.value }))
                }
                className="rounded-xl border border-[var(--color-ring-bronze)]/40 bg-white px-3 py-2 text-xs font-medium"
              />
              <select
                value={inviteForm.role}
                onChange={(e) =>
                  setInviteForm((f) => ({ ...f, role: e.target.value }))
                }
                className="rounded-xl border border-[var(--color-ring-bronze)]/40 bg-white px-3 py-2 font-mono text-[10px] font-bold uppercase"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <select
                value={inviteForm.plan}
                onChange={(e) =>
                  setInviteForm((f) => ({ ...f, plan: e.target.value }))
                }
                className="rounded-xl border border-[var(--color-ring-bronze)]/40 bg-white px-3 py-2 font-mono text-[10px] font-bold uppercase"
              >
                {PLAN_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                max={1000}
                value={inviteForm.maxUses}
                onChange={(e) =>
                  setInviteForm((f) => ({ ...f, maxUses: +e.target.value }))
                }
                className="rounded-xl border border-[var(--color-ring-bronze)]/40 bg-white px-3 py-2 text-xs font-medium"
              />
              <input
                type="number"
                min={1}
                max={365}
                value={inviteForm.expiresInDays}
                onChange={(e) =>
                  setInviteForm((f) => ({
                    ...f,
                    expiresInDays: +e.target.value,
                  }))
                }
                className="rounded-xl border border-[var(--color-ring-bronze)]/40 bg-white px-3 py-2 text-xs font-medium"
              />
              <button
                type="submit"
                disabled={createInvite.isPending}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-primary-dark)] px-4 py-2 font-mono text-[9px] font-black tracking-[0.16em] text-[var(--color-primary-light)] uppercase disabled:opacity-50"
              >
                {createInvite.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Ticket className="h-3.5 w-3.5" />
                )}
                Mint
              </button>
            </form>

            <div className="overflow-hidden rounded-3xl border border-[var(--color-ring-bronze)]/40 bg-white/60">
              <div className="divide-y divide-[var(--color-ring-bronze)]/20">
                {invites.data?.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm"
                  >
                    <button
                      onClick={() => copy(invite.code)}
                      className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary-light)] px-2.5 py-1 font-mono text-[11px] font-black tracking-wider"
                    >
                      {invite.code}
                      {copied === invite.code ? (
                        <Check className="h-3 w-3 text-emerald-700" />
                      ) : (
                        <Copy className="h-3 w-3 opacity-40" />
                      )}
                    </button>
                    <span className="font-mono text-[10px] font-bold uppercase opacity-60">
                      {invite.role} · {invite.plan} · {invite.uses}/
                      {invite.maxUses}
                    </span>
                    <span className="font-mono text-[10px] uppercase opacity-40">
                      {invite.status}
                    </span>
                    <span className="flex-1 truncate font-mono text-[10px] opacity-40">
                      {invite.email ?? "any email"}
                    </span>
                    {invite.status === "PENDING" && (
                      <button
                        onClick={() => revokeInvite.mutate({ id: invite.id })}
                        title="Revoke"
                        className="rounded-lg border border-[var(--color-ring-bronze)]/40 p-1.5 text-red-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Waitlist */}
        {tab === "waitlist" && (
          <div className="overflow-hidden rounded-3xl border border-[var(--color-ring-bronze)]/40 bg-white/60">
            <div className="divide-y divide-[var(--color-ring-bronze)]/20">
              {waitlist.data?.length === 0 && (
                <p className="p-6 text-xs font-medium opacity-50">
                  Nobody on the waitlist yet.
                </p>
              )}
              {waitlist.data?.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 px-5 py-3 text-sm"
                >
                  <span className="flex-1 truncate font-mono text-xs">
                    {entry.email}
                  </span>
                  <span className="font-mono text-[10px] uppercase opacity-40">
                    {entry.approved ? "approved" : "pending"}
                  </span>
                  {!entry.approved && (
                    <button
                      onClick={() => approveWaitlist.mutate({ id: entry.id })}
                      className="rounded-lg border border-[var(--color-ring-bronze)]/40 p-1.5 text-emerald-700"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
