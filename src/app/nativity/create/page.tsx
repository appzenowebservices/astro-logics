"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Loader2, Lock, Orbit } from "lucide-react";
import Layout from "../../components/Layout";
import NativityChartForm, {
  type NativityChartPayload,
} from "../../components/nativity/NativityChartForm";
import { useActiveProfile } from "../../components/profile/ActiveProfileProvider";
import { api } from "~/trpc/react";

function sanitizeReturn(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/nativity";
  }
  return value;
}

function withChartParam(path: string, chartId: string) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}chart=${chartId}`;
}

function backLabelFor(path: string) {
  if (path.startsWith("/climate")) return "Back to climate";
  if (path.startsWith("/profile-selection")) return "Back to profiles";
  if (path.startsWith("/dashboard")) return "Back to dashboard";
  return "Back to archive";
}

function CreateIntake() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = sanitizeReturn(searchParams.get("return"));
  const { status } = useSession();
  const { setActiveChartId, refetchCharts } = useActiveProfile();

  const createMutation = api.nativity.createChart.useMutation();

  async function handleSubmit(data: NativityChartPayload) {
    const chart = await createMutation.mutateAsync(data);
    setActiveChartId(chart.id);
    refetchCharts();
    router.push(withChartParam(returnTo, chart.id));
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--color-ring-bronze)]/40 pb-4">
        <div>
          <p className="font-sans text-[10px] font-extrabold tracking-[0.24em] text-[var(--color-accent-orange)] uppercase">
            Nativity engine // origin intake
          </p>
          <h1 className="font-poster mt-2 text-3xl leading-none uppercase sm:text-4xl">
            Create natal chart
          </h1>
          <p className="font-hindi mt-2 text-lg text-[var(--color-primary-dark)]/70">
            जन्म कुंडली बनाएँ — एक ही जगह से।
          </p>
          <p className="mt-2 max-w-2xl text-sm font-semibold text-[var(--color-primary-dark)]/65">
            One intake for every entry point. Cast the birth moment once and the
            archive, climate, dashboard and 3D agent all follow this chart.
          </p>
        </div>

        <Link
          href={returnTo}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--color-ring-bronze)]/50 bg-white px-4 py-2.5 font-sans text-[10px] font-extrabold tracking-[0.14em] uppercase transition-colors hover:border-[var(--color-accent-orange)] hover:text-[var(--color-accent-orange)]"
        >
          <ArrowLeft size={12} />
          {backLabelFor(returnTo)}
        </Link>
      </header>

      <div className="mt-5">
        {status === "loading" ? (
          <div className="flex min-h-[420px] items-center justify-center">
            <Loader2
              size={26}
              className="animate-spin text-[var(--color-accent-orange)]"
            />
          </div>
        ) : status === "unauthenticated" ? (
          <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[26px] border border-dashed border-[var(--color-ring-bronze)]/70 bg-white px-6 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full border border-[var(--color-ring-bronze)]/50 bg-[var(--color-primary-light)]">
              <Lock size={22} className="text-[var(--color-accent-orange)]" />
            </span>
            <h2 className="mt-4 text-2xl font-black uppercase">
              Sign in to cast a chart
            </h2>
            <p className="mt-2 max-w-sm text-sm font-semibold text-[var(--color-primary-dark)]/60">
              Nativity charts are stored against your account. Sign in, then
              return to this intake.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--color-primary-dark)] px-5 py-3 font-sans text-[10px] font-extrabold tracking-[0.16em] text-[var(--color-primary-light)] uppercase transition-colors hover:bg-[var(--color-accent-orange)] hover:text-white"
            >
              Sign in
              <Orbit size={13} />
            </Link>
          </div>
        ) : (
          <NativityChartForm
            isLoading={createMutation.isPending}
            isError={createMutation.isError}
            error={createMutation.error}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    </div>
  );
}

export default function CreateNativityChartPage() {
  return (
    <Layout>
      <Suspense
        fallback={
          <div className="flex min-h-[420px] items-center justify-center">
            <Loader2
              size={26}
              className="animate-spin text-[var(--color-accent-orange)]"
            />
          </div>
        }
      >
        <CreateIntake />
      </Suspense>
    </Layout>
  );
}
