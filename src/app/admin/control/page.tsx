"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  Cpu,
  LayoutDashboard,
  Loader2,
  Newspaper,
  Orbit,
  RefreshCw,
  ScrollText,
  ShieldCheck,
  Ticket,
  Trash2,
  TrendingUpDown,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { api } from "~/trpc/react";
import Layout from "../../components/Layout";
import MembersPanel from "./MembersPanel";

type ControlTab =
  | "overview"
  | "members"
  | "access"
  | "charts"
  | "stories"
  | "market"
  | "content"
  | "billing"
  | "system";

const TABS: Array<{
  id: ControlTab;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
}> = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "members", label: "Members", icon: Users },
  { id: "access", label: "Access & Invites", icon: Ticket },
  { id: "charts", label: "Charts", icon: Orbit },
  { id: "stories", label: "Stories", icon: ScrollText },
  { id: "market", label: "Market Engine", icon: TrendingUpDown },
  { id: "content", label: "Content", icon: Newspaper },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "system", label: "System", icon: Cpu },
];

const PANEL =
  "rounded-2xl border border-black/10 bg-white/70 shadow-[0_20px_45px_-34px_rgba(42,65,112,0.45)]";
const FIELD =
  "rounded-lg border border-black/10 bg-white px-2.5 py-1.5 font-mono text-[11px] font-semibold outline-none focus:border-[var(--color-accent-orange)]";

const fmtDate = (value?: Date | string | null) =>
  value
    ? new Date(value).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const fmtNumber = (value?: number | null) =>
  typeof value === "number" ? value.toLocaleString() : "—";

function StatusPill({ value }: { value: string }) {
  const tone =
    value === "ACTIVE" || value === "PUBLISHED" || value === "CONNECTED"
      ? "bg-emerald-500/10 text-emerald-700"
      : value === "SUSPENDED" || value === "EXPIRED" || value === "ERROR"
        ? "bg-red-500/10 text-red-700"
        : "bg-amber-500/10 text-amber-700";

  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 font-mono text-[10px] font-black tracking-[0.08em] uppercase ${tone}`}
    >
      {value}
    </span>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value?: number | string | null;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white/80 p-4 shadow-sm">
      <p className="font-poster text-3xl leading-none tracking-tight text-[var(--color-primary-dark)]">
        {typeof value === "number" ? fmtNumber(value) : (value ?? "—")}
      </p>
      <p className="mt-1.5 font-mono text-[10px] font-black tracking-[0.18em] uppercase opacity-45">
        {label}
      </p>
      {hint && (
        <p className="mt-1 font-mono text-[9px] tracking-[0.06em] uppercase opacity-30">
          {hint}
        </p>
      )}
    </div>
  );
}

function SectionHeader({
  title,
  count,
  action,
}: {
  title: string;
  count?: number;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-black/8 px-4 py-3">
      <h2 className="font-poster text-lg uppercase">{title}</h2>
      {typeof count === "number" && (
        <span className="rounded-full bg-black/5 px-2 py-0.5 font-mono text-[10px] font-black">
          {count}
        </span>
      )}
      {action && <div className="ml-auto">{action}</div>}
    </div>
  );
}

export default function AdminControlRoom() {
  const utils = api.useUtils();
  const [tab, setTab] = useState<ControlTab>("overview");
  const [copied, setCopied] = useState<string | null>(null);
  const [inviteForm, setInviteForm] = useState({
    email: "",
    role: "MEMBER" as "ADMIN" | "ANALYST" | "MEMBER",
    plan: "FREE" as "FREE" | "BASIC" | "PREMIUM" | "ENTERPRISE",
    maxUses: 1,
    expiresInDays: 30,
  });

  const me = api.user.me.useQuery();
  const isAdmin = me.data?.role === "ADMIN";

  const overview = api.admin.platformOverview.useQuery(undefined, {
    enabled: isAdmin,
  });
  const charts = api.admin.getAllNativityCharts.useQuery(undefined, {
    enabled: isAdmin,
  });
  const stories = api.admin.listCurrentStories.useQuery(undefined, {
    enabled: isAdmin,
  });
  const posts = api.admin.listPosts.useQuery(undefined, { enabled: isAdmin });
  const subscriptions = api.admin.listSubscriptions.useQuery(undefined, {
    enabled: isAdmin,
  });
  const assetProfiles = api.admin.listMarketAssetProfiles.useQuery(undefined, {
    enabled: isAdmin,
  });
  const snapshots = api.admin.listMarketSnapshots.useQuery(undefined, {
    enabled: isAdmin,
  });
  const signals = api.admin.listTradeSignals.useQuery(undefined, {
    enabled: isAdmin,
  });
  const system = api.admin.systemStatus.useQuery(undefined, {
    enabled: isAdmin,
  });
  const invites = api.invite.list.useQuery(undefined, { enabled: isAdmin });
  const waitlist = api.admin.listWaitlist.useQuery(undefined, {
    enabled: isAdmin,
  });

  const deleteChart = api.admin.deleteNativityChartAdmin.useMutation({
    onSuccess: () => {
      void utils.admin.getAllNativityCharts.invalidate();
      void utils.admin.platformOverview.invalidate();
    },
  });
  const deleteStory = api.admin.deleteCurrentStory.useMutation({
    onSuccess: () => {
      void utils.admin.listCurrentStories.invalidate();
      void utils.admin.platformOverview.invalidate();
    },
  });
  const updatePost = api.admin.updatePostAdmin.useMutation({
    onSuccess: () => {
      void utils.admin.listPosts.invalidate();
      void utils.admin.platformOverview.invalidate();
    },
  });
  const deletePost = api.admin.deletePostAdmin.useMutation({
    onSuccess: () => {
      void utils.admin.listPosts.invalidate();
      void utils.admin.platformOverview.invalidate();
    },
  });
  const createInvite = api.invite.create.useMutation({
    onSuccess: () => {
      void utils.invite.list.invalidate();
      void utils.admin.platformOverview.invalidate();
      setInviteForm((current) => ({ ...current, email: "" }));
    },
  });
  const revokeInvite = api.invite.revoke.useMutation({
    onSuccess: () => {
      void utils.invite.list.invalidate();
      void utils.admin.platformOverview.invalidate();
    },
  });
  const approveWaitlist = api.admin.approveWaitlist.useMutation({
    onSuccess: () => {
      void utils.admin.listWaitlist.invalidate();
      void utils.admin.platformOverview.invalidate();
    },
  });

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  if (me.isLoading) {
    return (
      <Layout>
        <div className="flex min-h-[50vh] items-center justify-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-[var(--color-accent-orange)]" />
          <span className="font-mono text-[11px] font-black tracking-[0.2em] uppercase opacity-50">
            Verifying super-admin clearance…
          </span>
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="mx-auto flex min-h-[55vh] max-w-lg flex-col items-center justify-center text-center">
          <AlertTriangle className="h-9 w-9 text-[var(--color-accent-orange)]" />
          <h1 className="font-poster mt-4 text-4xl uppercase">
            Super admin only
          </h1>
          <p className="mt-3 text-sm font-medium opacity-60">
            This control room exposes platform-wide data and destructive
            operations. Ask a super admin to upgrade your role.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 rounded-full bg-[var(--color-primary-dark)] px-5 py-2.5 font-mono text-[11px] font-black tracking-[0.16em] text-white uppercase"
          >
            Back to dashboard
          </Link>
        </div>
      </Layout>
    );
  }

  const o = overview.data;

  return (
    <Layout>
      <div className="space-y-5 text-[var(--color-primary-dark)]">
        {/* Header */}
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-black/10 pb-4">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-[var(--color-accent-orange)]/15 px-3 py-1 font-mono text-[10px] font-black tracking-[0.2em] text-[var(--color-accent-orange)] uppercase">
              <ShieldCheck size={12} /> Super admin · top-down control
            </p>
            <h1 className="font-poster mt-3 text-4xl leading-none uppercase">
              Platform control room
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-medium opacity-55">
              Every tenant, chart, story, market state, subscription, and engine
              surface in one console.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                void utils.invalidate();
              }}
              className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-4 py-2 font-mono text-[10px] font-black tracking-[0.14em] uppercase transition hover:border-[var(--color-accent-orange)]"
            >
              <RefreshCw size={13} /> Refresh all
            </button>
            <Link
              href="/dashboard"
              className="rounded-full bg-[var(--color-primary-dark)] px-4 py-2 font-mono text-[10px] font-black tracking-[0.14em] text-white uppercase"
            >
              Back to dashboard
            </Link>
          </div>
        </header>

        {/* Tabs */}
        <div className="custom-scrollbar flex gap-1 overflow-x-auto rounded-2xl border border-black/10 bg-white/60 p-1.5">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 font-mono text-[10px] font-black tracking-[0.14em] uppercase transition ${
                tab === id
                  ? "bg-[var(--color-primary-dark)] text-white shadow"
                  : "text-[var(--color-primary-dark)]/50 hover:bg-black/5"
              }`}
            >
              <Icon size={13} /> {label}
              {id === "members" && typeof o?.users === "number" && (
                <span
                  className={`grid h-4 min-w-4 place-items-center rounded-full px-1 text-[9px] ${
                    tab === id
                      ? "bg-white/15 text-white"
                      : "bg-black/8 text-[var(--color-primary-dark)]/60"
                  }`}
                >
                  {o.users}
                </span>
              )}
              {id === "access" &&
                typeof o?.pendingInvites === "number" &&
                o.pendingInvites > 0 && (
                  <span
                    className={`grid h-4 min-w-4 place-items-center rounded-full px-1 text-[9px] ${
                      tab === id
                        ? "bg-white/15 text-white"
                        : "bg-[var(--color-accent-orange)]/15 text-[var(--color-accent-orange)]"
                    }`}
                  >
                    {o.pendingInvites}
                  </span>
                )}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === "overview" && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <Stat
                label="Members"
                value={o?.users}
                hint={`${o?.activeUsers ?? 0} active`}
              />
              <Stat label="Charts" value={o?.charts} hint="nativity archives" />
              <Stat
                label="Stories"
                value={o?.stories}
                hint="current transit runs"
              />
              <Stat
                label="Snapshots"
                value={o?.snapshots}
                hint="market states"
              />
              <Stat label="Signals" value={o?.signals} hint="trade signals" />
              <Stat
                label="Subscriptions"
                value={o?.subscriptions}
                hint={`${o?.activeSubscriptions ?? 0} active`}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <section className={PANEL}>
                <SectionHeader title="Tenant distribution" />
                <div className="grid grid-cols-2 gap-3 p-4">
                  <Stat label="Super admins" value={o?.admins} />
                  <Stat label="Analysts" value={o?.analysts} />
                  <Stat label="Suspended" value={o?.suspendedUsers} />
                  <Stat label="Trading accounts" value={o?.tradingAccounts} />
                  <Stat label="Asset profiles" value={o?.assetProfiles} />
                  <Stat label="Chart drawings" value={o?.drawings} />
                </div>
              </section>

              <section className={PANEL}>
                <SectionHeader
                  title="Distribution funnel"
                  action={
                    <button
                      type="button"
                      onClick={() => setTab("access")}
                      className="font-mono text-[10px] font-black tracking-[0.12em] text-[var(--color-accent-orange)] uppercase"
                    >
                      Manage
                    </button>
                  }
                />
                <div className="grid grid-cols-2 gap-3 p-4">
                  <Stat
                    label="Invites"
                    value={o?.invites}
                    hint={`${o?.pendingInvites ?? 0} pending`}
                  />
                  <Stat label="Waitlist" value={o?.waitlist} />
                  <Stat
                    label="Posts"
                    value={o?.posts}
                    hint={`${o?.publishedPosts ?? 0} published`}
                  />
                  <Stat label="Active subs" value={o?.activeSubscriptions} />
                </div>
              </section>
            </div>

            <section className={PANEL}>
              <SectionHeader
                title="Recent subscriptions"
                count={subscriptions.data?.length}
              />
              <div className="divide-y divide-black/5">
                {(subscriptions.data ?? []).slice(0, 5).map((sub) => (
                  <div
                    key={sub.id}
                    className="flex flex-wrap items-center gap-3 px-4 py-3 text-xs"
                  >
                    <span className="font-black">
                      {sub.user?.name ?? "Unknown"}
                    </span>
                    <span className="font-mono opacity-45">
                      {sub.user?.email}
                    </span>
                    <StatusPill value={sub.status} />
                    <span className="ml-auto font-mono text-[11px] opacity-50">
                      {sub.plan} · {sub.currency} {sub.amount ?? 0}
                    </span>
                  </div>
                ))}
                {!subscriptions.data?.length && (
                  <p className="px-4 py-5 text-xs opacity-45">
                    No subscriptions recorded yet.
                  </p>
                )}
              </div>
            </section>
          </div>
        )}

        {/* Members */}
        {tab === "members" && <MembersPanel />}

        {/* Access & Invites */}
        {tab === "access" && (
          <div className="space-y-4">
            <section className={PANEL}>
              <SectionHeader
                title="Mint invite"
                action={
                  <span className="font-mono text-[10px] font-black tracking-[0.16em] uppercase opacity-35">
                    One code, one seat
                  </span>
                }
              />
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  createInvite.mutate({
                    email: inviteForm.email || undefined,
                    role: inviteForm.role,
                    plan: inviteForm.plan,
                    maxUses: Number(inviteForm.maxUses),
                    expiresInDays: Number(inviteForm.expiresInDays),
                  });
                }}
                className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6"
              >
                <label className="block lg:col-span-2">
                  <span className="mb-1.5 block font-mono text-[9px] font-black tracking-[0.18em] uppercase opacity-45">
                    Email (optional)
                  </span>
                  <input
                    type="email"
                    placeholder="anyone@orbit.com"
                    value={inviteForm.email}
                    onChange={(event) =>
                      setInviteForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    className={`${FIELD} w-full`}
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block font-mono text-[9px] font-black tracking-[0.18em] uppercase opacity-45">
                    Role
                  </span>
                  <select
                    value={inviteForm.role}
                    onChange={(event) =>
                      setInviteForm((current) => ({
                        ...current,
                        role: event.target.value as typeof current.role,
                      }))
                    }
                    className={`${FIELD} w-full`}
                  >
                    {["ADMIN", "ANALYST", "MEMBER"].map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1.5 block font-mono text-[9px] font-black tracking-[0.18em] uppercase opacity-45">
                    Plan
                  </span>
                  <select
                    value={inviteForm.plan}
                    onChange={(event) =>
                      setInviteForm((current) => ({
                        ...current,
                        plan: event.target.value as typeof current.plan,
                      }))
                    }
                    className={`${FIELD} w-full`}
                  >
                    {["FREE", "BASIC", "PREMIUM", "ENTERPRISE"].map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1.5 block font-mono text-[9px] font-black tracking-[0.18em] uppercase opacity-45">
                    Uses
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={inviteForm.maxUses}
                    onChange={(event) =>
                      setInviteForm((current) => ({
                        ...current,
                        maxUses: +event.target.value,
                      }))
                    }
                    className={`${FIELD} w-full`}
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block font-mono text-[9px] font-black tracking-[0.18em] uppercase opacity-45">
                    Expires (days)
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={inviteForm.expiresInDays}
                    onChange={(event) =>
                      setInviteForm((current) => ({
                        ...current,
                        expiresInDays: +event.target.value,
                      }))
                    }
                    className={`${FIELD} w-full`}
                  />
                </label>
                <div className="flex items-end sm:col-span-2 lg:col-span-6">
                  <button
                    type="submit"
                    disabled={createInvite.isPending}
                    className="inline-flex items-center gap-2 rounded-full bg-[var(--color-accent-orange)] px-5 py-2.5 font-mono text-[10px] font-black tracking-[0.16em] text-white uppercase transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-50"
                  >
                    {createInvite.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Ticket className="h-3.5 w-3.5" />
                    )}
                    Mint invite
                  </button>
                </div>
              </form>
            </section>

            <section className={PANEL}>
              <SectionHeader
                title="Issued invites"
                count={invites.data?.length}
              />
              <div className="divide-y divide-black/5">
                {(invites.data ?? []).map((invite) => (
                  <div
                    key={invite.id}
                    className="flex flex-wrap items-center gap-3 px-4 py-3"
                  >
                    <button
                      type="button"
                      onClick={() => copy(invite.code)}
                      title="Copy invite code"
                      className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary-dark)] px-3 py-1.5 font-mono text-[11px] font-black tracking-[0.12em] text-white transition-colors hover:bg-[var(--color-accent-orange)]"
                    >
                      {invite.code}
                      {copied === invite.code ? (
                        <Check className="h-3.5 w-3.5 text-emerald-300" />
                      ) : (
                        <Copy className="h-3 w-3 opacity-50" />
                      )}
                    </button>
                    <span className="font-mono text-[10px] font-black tracking-[0.1em] uppercase opacity-55">
                      {invite.role} · {invite.plan}
                    </span>
                    <span className="rounded-full bg-black/5 px-2.5 py-1 font-mono text-[9px] font-black uppercase">
                      {invite.uses}/{invite.maxUses} used
                    </span>
                    <StatusPill value={invite.status} />
                    <span className="flex-1 truncate font-mono text-[11px] opacity-35">
                      {invite.email ?? "any email"}
                    </span>
                    {invite.status === "PENDING" && (
                      <button
                        type="button"
                        onClick={() => revokeInvite.mutate({ id: invite.id })}
                        className="rounded-full p-2 text-red-600/70 transition hover:bg-red-500/10"
                        aria-label="Revoke invite"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
                {!invites.data?.length && (
                  <p className="px-4 py-6 text-xs opacity-45">
                    No invites minted yet.
                  </p>
                )}
              </div>
            </section>

            <section className={PANEL}>
              <SectionHeader
                title="Waitlist"
                count={waitlist.data?.length}
                action={
                  <span className="font-mono text-[10px] font-black tracking-[0.16em] uppercase opacity-35">
                    {waitlist.data?.filter((entry) => !entry.approved).length ??
                      0}{" "}
                    pending
                  </span>
                }
              />
              <div className="divide-y divide-black/5">
                {(waitlist.data ?? []).map((entry) => (
                  <div
                    key={entry.id}
                    className="flex flex-wrap items-center gap-3 px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-xs font-bold">
                        {entry.email}
                      </p>
                      <p className="font-mono text-[9px] tracking-[0.1em] uppercase opacity-35">
                        joined {fmtDate(entry.createdAt)}
                      </p>
                    </div>
                    <StatusPill value={entry.approved ? "ACTIVE" : "PENDING"} />
                    {!entry.approved && (
                      <button
                        type="button"
                        onClick={() => approveWaitlist.mutate({ id: entry.id })}
                        className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-accent-orange)]/15 px-3 py-1.5 font-mono text-[9px] font-black tracking-[0.14em] text-[var(--color-accent-orange)] uppercase transition-colors hover:bg-[var(--color-accent-orange)] hover:text-white"
                      >
                        <Check className="h-3 w-3" /> Approve
                      </button>
                    )}
                  </div>
                ))}
                {!waitlist.data?.length && (
                  <p className="px-4 py-6 text-xs opacity-45">
                    Nobody on the waitlist yet.
                  </p>
                )}
              </div>
            </section>
          </div>
        )}

        {/* Charts */}
        {tab === "charts" && (
          <section className={PANEL}>
            <SectionHeader
              title="All nativity charts"
              count={charts.data?.length}
            />
            <div className="divide-y divide-black/5">
              {(charts.data ?? []).map((chart) => (
                <div
                  key={chart.id}
                  className="flex flex-wrap items-center gap-3 px-4 py-3"
                >
                  <div className="min-w-0 flex-1 basis-48">
                    <p className="truncate text-sm font-black">{chart.name}</p>
                    <p className="font-mono text-[10px] opacity-40">
                      {chart.id} · owner {chart.userId}
                    </p>
                  </div>
                  <span className="font-mono text-[11px] opacity-55">
                    {fmtDate(chart.birthDateTime)}
                  </span>
                  <span className="font-mono text-[11px] opacity-55">
                    {chart.locationName || "Unknown location"}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        confirm(`Delete chart "${chart.name}" permanently?`)
                      ) {
                        deleteChart.mutate({ id: chart.id });
                      }
                    }}
                    className="rounded-full p-2 text-red-600/70 transition hover:bg-red-500/10"
                    aria-label={`Delete ${chart.name}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {!charts.data?.length && (
                <p className="px-4 py-6 text-xs opacity-45">No charts yet.</p>
              )}
            </div>
          </section>
        )}

        {/* Stories */}
        {tab === "stories" && (
          <section className={PANEL}>
            <SectionHeader
              title="Transit stories"
              count={stories.data?.length}
            />
            <div className="divide-y divide-black/5">
              {(stories.data ?? []).map((story) => (
                <div
                  key={story.id}
                  className="flex flex-wrap items-center gap-3 px-4 py-3"
                >
                  <div className="min-w-0 flex-1 basis-56">
                    <p className="truncate text-sm font-black">
                      {story.nativityChart?.name ?? "Unnamed chart"}
                    </p>
                    <p className="font-mono text-[10px] opacity-40">
                      {story.id} · {fmtDate(story.transitDate)}
                    </p>
                  </div>
                  <span className="font-mono text-[11px] opacity-55">
                    intensity {story.overallIntensity ?? "—"}
                  </span>
                  <span className="max-w-[240px] truncate font-mono text-[11px] opacity-45">
                    {story.themes?.slice(0, 2).join(" · ") || "No themes"}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("Delete this story permanently?")) {
                        deleteStory.mutate({ id: story.id });
                      }
                    }}
                    className="rounded-full p-2 text-red-600/70 transition hover:bg-red-500/10"
                    aria-label="Delete story"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {!stories.data?.length && (
                <p className="px-4 py-6 text-xs opacity-45">No stories yet.</p>
              )}
            </div>
          </section>
        )}

        {/* Market */}
        {tab === "market" && (
          <div className="space-y-4">
            <section className={PANEL}>
              <SectionHeader
                title="Market asset profiles"
                count={assetProfiles.data?.length}
              />
              <div className="divide-y divide-black/5">
                {(assetProfiles.data ?? []).map((profile) => (
                  <div
                    key={profile.id}
                    className="flex flex-wrap items-center gap-3 px-4 py-3"
                  >
                    <span className="min-w-20 font-mono text-sm font-black">
                      {profile.symbol}
                    </span>
                    <span className="font-mono text-[11px] opacity-50">
                      {profile.label ?? profile.category ?? "—"}
                    </span>
                    <span className="font-mono text-[11px] opacity-45">
                      {profile.locationName} · {profile.coordinateSystem}
                    </span>
                    <span className="ml-auto font-mono text-[11px] opacity-50">
                      {profile._count.marketStateSnapshots} snapshots
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className={PANEL}>
              <SectionHeader
                title="Recent market states"
                count={snapshots.data?.length}
              />
              <div className="divide-y divide-black/5">
                {(snapshots.data ?? []).slice(0, 20).map((snapshot) => (
                  <div
                    key={snapshot.id}
                    className="flex flex-wrap items-center gap-3 px-4 py-3"
                  >
                    <span className="min-w-20 font-mono text-sm font-black">
                      {snapshot.symbol}
                    </span>
                    <span className="font-mono text-[11px] opacity-50">
                      {snapshot.timeframe || "—"} ·{" "}
                      {fmtDate(snapshot.createdAt)}
                    </span>
                    <span className="font-mono text-[11px] opacity-45">
                      {snapshot._count.events} events ·{" "}
                      {snapshot._count.signals} signals
                    </span>
                    <span className="ml-auto font-mono text-[10px] opacity-35">
                      {snapshot.user?.email ?? "system"}
                    </span>
                  </div>
                ))}
                {!snapshots.data?.length && (
                  <p className="px-4 py-6 text-xs opacity-45">
                    No snapshots yet.
                  </p>
                )}
              </div>
            </section>

            <section className={PANEL}>
              <SectionHeader
                title="Trade signals"
                count={signals.data?.length}
              />
              <div className="divide-y divide-black/5">
                {(signals.data ?? []).slice(0, 20).map((signal) => (
                  <div
                    key={signal.id}
                    className="flex flex-wrap items-center gap-3 px-4 py-3"
                  >
                    <StatusPill value={signal.marketBias} />
                    <span className="font-mono text-[11px] font-black">
                      {signal.snapshot?.symbol ?? "—"}
                    </span>
                    <span className="font-mono text-[11px] opacity-50">
                      {Math.round((signal.confidence ?? 0) * 100)}% confidence ·{" "}
                      {signal.riskLevel}
                    </span>
                    <span className="ml-auto font-mono text-[10px] opacity-35">
                      {fmtDate(signal.createdAt)}
                    </span>
                  </div>
                ))}
                {!signals.data?.length && (
                  <p className="px-4 py-6 text-xs opacity-45">
                    No signals yet.
                  </p>
                )}
              </div>
            </section>
          </div>
        )}

        {/* Content */}
        {tab === "content" && (
          <section className={PANEL}>
            <SectionHeader
              title="Content moderation"
              count={posts.data?.length}
            />
            <div className="divide-y divide-black/5">
              {(posts.data ?? []).map((post) => (
                <div
                  key={post.id}
                  className="flex flex-wrap items-center gap-3 px-4 py-3"
                >
                  <div className="min-w-0 flex-1 basis-56">
                    <p className="truncate text-sm font-black">{post.title}</p>
                    <p className="truncate font-mono text-[10px] opacity-40">
                      {post.kind} · by {post.author?.name ?? post.authorId} ·{" "}
                      {post.slug}
                    </p>
                  </div>
                  <StatusPill value={post.status} />
                  <select
                    value={post.status}
                    onChange={(event) =>
                      updatePost.mutate({
                        id: post.id,
                        status: event.target.value as
                          | "DRAFT"
                          | "PUBLISHED"
                          | "ARCHIVED",
                      })
                    }
                    className={FIELD}
                  >
                    {["DRAFT", "PUBLISHED", "ARCHIVED"].map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                  <select
                    value={post.visibility}
                    onChange={(event) =>
                      updatePost.mutate({
                        id: post.id,
                        visibility: event.target.value as
                          | "PUBLIC"
                          | "MEMBERS"
                          | "PREMIUM",
                      })
                    }
                    className={FIELD}
                  >
                    {["PUBLIC", "MEMBERS", "PREMIUM"].map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Delete "${post.title}"?`)) {
                        deletePost.mutate({ id: post.id });
                      }
                    }}
                    className="rounded-full p-2 text-red-600/70 transition hover:bg-red-500/10"
                    aria-label={`Delete ${post.title}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {!posts.data?.length && (
                <p className="px-4 py-6 text-xs opacity-45">No content yet.</p>
              )}
            </div>
          </section>
        )}

        {/* Billing */}
        {tab === "billing" && (
          <section className={PANEL}>
            <SectionHeader
              title="Subscriptions & entitlements"
              count={subscriptions.data?.length}
            />
            <div className="divide-y divide-black/5">
              {(subscriptions.data ?? []).map((sub) => (
                <div
                  key={sub.id}
                  className="flex flex-wrap items-center gap-3 px-4 py-3"
                >
                  <div className="min-w-0 flex-1 basis-48">
                    <p className="truncate text-sm font-black">
                      {sub.user?.name ?? "Unknown member"}
                    </p>
                    <p className="truncate font-mono text-[11px] opacity-45">
                      {sub.user?.email}
                    </p>
                  </div>
                  <span className="font-mono text-[11px] font-black">
                    {sub.plan}
                  </span>
                  <StatusPill value={sub.status} />
                  <span className="font-mono text-[11px] opacity-50">
                    {sub.currency} {sub.amount ?? 0} / {sub.period}
                  </span>
                  <span className="ml-auto font-mono text-[10px] opacity-40">
                    {fmtDate(sub.currentStart)} → {fmtDate(sub.currentEnd)}
                  </span>
                </div>
              ))}
              {!subscriptions.data?.length && (
                <p className="px-4 py-6 text-xs opacity-45">
                  No subscriptions yet.
                </p>
              )}
            </div>
          </section>
        )}

        {/* System */}
        {tab === "system" && (
          <div className="grid gap-4 lg:grid-cols-2">
            <section className={PANEL}>
              <SectionHeader title="Engine services" />
              <div className="space-y-2 p-4">
                {Object.entries(system.data?.services ?? {}).map(
                  ([service, enabled]) => (
                    <div
                      key={service}
                      className="flex items-center justify-between rounded-xl border border-black/5 bg-white/70 px-3 py-2"
                    >
                      <span className="font-mono text-[11px] font-bold tracking-[0.06em] uppercase">
                        {service}
                      </span>
                      {enabled ? (
                        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-black text-emerald-700 uppercase">
                          <CheckCircle2 size={12} /> Configured
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-black text-red-700 uppercase">
                          <XCircle size={12} /> Missing
                        </span>
                      )}
                    </div>
                  ),
                )}
              </div>
            </section>

            <section className={PANEL}>
              <SectionHeader title="Data volume" />
              <div className="grid grid-cols-2 gap-3 p-4">
                <Stat label="Users" value={system.data?.counts.users} />
                <Stat label="Charts" value={system.data?.counts.charts} />
                <Stat label="Snapshots" value={system.data?.counts.snapshots} />
                <Stat label="Posts" value={system.data?.counts.posts} />
              </div>
              <div className="border-t border-black/5 p-4">
                <p className="font-mono text-[10px] leading-relaxed tracking-[0.05em] uppercase opacity-40">
                  Secrets are never returned to the client. This panel only
                  reports whether each integration is configured.
                </p>
              </div>
            </section>
          </div>
        )}
      </div>
    </Layout>
  );
}
