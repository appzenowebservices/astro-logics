"use client";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import {
  Calendar,
  MapPin,
  Globe,
  EyeOff,
  ArrowUpRight,
  Star,
  Clock,
  Compass,
} from "lucide-react";

export default function ProfileBentoSelection() {
  const router = useRouter();
  const { data: charts, isLoading } = api.nativity.getCharts.useQuery();

  if (isLoading)
    return (
      <div className="min-h-screen animate-pulse bg-[var(--color-primary-light)]" />
    );

  // Using the specific data point provided
  const profile = Array.isArray(charts) ? charts[0] : charts;

  return (
    <div className="min-h-screen bg-[var(--color-primary-light)] p-6 text-[var(--color-primary-dark)] lg:p-12">
      <div className="mx-auto max-w-6xl">
        {/* Header Section */}
        <header className="mb-12 flex items-end justify-between border-b border-[var(--color-ring-bronze)] pb-6">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-[var(--color-accent-orange)] uppercase">
              System Entry // Auth-01
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-tighter">
              SELECT NATIVITY
            </h1>
          </div>
          <div className="text-right font-mono text-sm opacity-60">
            {new Date().toLocaleDateString()} //{" "}
            {profile?.locationName?.toUpperCase()}
          </div>
        </header>

        {/* Bento Grid Layout */}
        <div
          onClick={() => router.push("/dashboard")}
          className="group grid cursor-pointer grid-cols-1 gap-4 transition-all duration-500 hover:scale-[1.01] md:grid-cols-4"
        >
          {/* Main Identity Block (Cosmic Blue) */}
          <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl bg-[var(--color-primary-dark)] p-8 text-[var(--color-primary-light)] shadow-2xl md:col-span-2 md:row-span-2">
            <div className="z-10">
              <div className="mb-6 inline-block rounded-full border border-[var(--color-accent-glow)] px-3 py-1 text-[10px] font-bold tracking-widest text-[var(--color-accent-glow)] uppercase">
                Active Collective
              </div>
              <h2 className="mb-2 text-6xl leading-none font-black tracking-tighter italic">
                {profile?.name}
              </h2>
              <p className="text-sm font-medium tracking-widest text-[var(--color-accent-glow)] uppercase opacity-80">
                Lagna // Uncalibrated
              </p>
            </div>

            <div className="z-10 mt-12 flex items-center gap-4">
              <div className="h-px flex-1 bg-[var(--color-accent-glow)] opacity-30" />
              <ArrowUpRight
                size={32}
                className="text-[var(--color-accent-orange)] transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
              />
            </div>

            {/* Background Decorative Rings (Matching your logo style) */}
            <div className="absolute -right-20 -bottom-20 h-80 w-80 rounded-full border-[1px] border-[var(--color-ring-bronze)] opacity-20" />
            <div className="absolute -right-10 -bottom-10 h-60 w-60 rounded-full border-[1px] border-[var(--color-accent-glow)] opacity-10" />
          </div>

          {/* Spatio-Temporal Block */}
          <div className="flex flex-col justify-between rounded-2xl border border-[var(--color-ring-bronze)] bg-white/50 p-6 shadow-sm backdrop-blur-md">
            <Clock size={20} className="text-[var(--color-accent-orange)]" />
            <div>
              <p className="text-[10px] font-bold tracking-tighter uppercase opacity-50">
                Birth Epoch
              </p>
              <p className="text-lg leading-tight font-bold">1995-07-14</p>
              <p className="text-xs opacity-70">14:28:00 UTC+5.5</p>
            </div>
          </div>

          {/* Coordinate System Block */}
          <div className="flex flex-col justify-between rounded-2xl bg-[var(--color-accent-orange)] p-6 text-white shadow-lg">
            <Compass size={20} />
            <div>
              <p className="text-[10px] font-bold tracking-tighter uppercase opacity-80">
                Coordinate System
              </p>
              <p className="text-2xl font-bold tracking-tighter">
                {profile?.coordinateSystem}
              </p>
            </div>
          </div>

          {/* Location Block */}
          <div className="flex items-center justify-between rounded-2xl border border-[var(--color-ring-bronze)] bg-white/80 p-6 shadow-sm md:col-span-2">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-[var(--color-primary-light)] p-3">
                <MapPin
                  size={24}
                  className="text-[var(--color-primary-dark)]"
                />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase opacity-50">
                  Geo Location
                </p>
                <p className="text-xl font-bold">{profile?.locationName}, IN</p>
                <p className="font-mono text-xs italic opacity-60">
                  {profile?.latitude}°N / {profile?.longitude}°E
                </p>
              </div>
            </div>
            <Star
              size={20}
              className="fill-current text-[var(--color-accent-glow)]"
            />
          </div>
        </div>

        {/* System Mechanics Footer */}
        <footer className="mt-12 flex items-center justify-between text-[10px] font-bold tracking-[0.3em] uppercase opacity-40">
          <p>Engine ID // SEC-01</p>
          <p>Validated Matrix // {profile?._id?.substring(0, 8)}</p>
        </footer>
      </div>
    </div>
  );
}
