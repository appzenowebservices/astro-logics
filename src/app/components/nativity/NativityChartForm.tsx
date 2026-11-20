"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CalendarDays,
  Clock3,
  Compass,
  Crosshair,
  Globe2,
  Loader,
  MapPin,
  Orbit,
  Sparkles,
} from "lucide-react";

export interface NativityChartPayload {
  name: string;
  description?: string;
  birthDateTime: Date;
  timezone: string;
  latitude: number;
  longitude: number;
  locationName?: string;
  coordinateSystem: "SIDEREAL" | "TROPICAL";
  timeResolution: "MINUTE" | "SECOND" | "EVENT_BASED";
}

interface NativityChartFormProps {
  isLoading: boolean;
  isError: boolean;
  error?: { message?: string } | null;
  onSubmit: (data: NativityChartPayload) => Promise<void>;
}

const FALLBACK_TIMEZONES = [
  "UTC",
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Australia/Sydney",
];

const CITY_PRESETS = [
  { city: "New Delhi", lat: 28.6139, lon: 77.209, tz: "Asia/Kolkata" },
  { city: "Mumbai", lat: 19.076, lon: 72.8777, tz: "Asia/Kolkata" },
  { city: "Bengaluru", lat: 12.9716, lon: 77.5946, tz: "Asia/Kolkata" },
  { city: "Chennai", lat: 13.0827, lon: 80.2707, tz: "Asia/Kolkata" },
  { city: "Kolkata", lat: 22.5726, lon: 88.3639, tz: "Asia/Kolkata" },
  { city: "New York", lat: 40.7128, lon: -74.006, tz: "America/New_York" },
  { city: "London", lat: 51.5074, lon: -0.1278, tz: "Europe/London" },
  { city: "Dubai", lat: 25.2048, lon: 55.2708, tz: "Asia/Dubai" },
  { city: "Singapore", lat: 1.3521, lon: 103.8198, tz: "Asia/Singapore" },
  { city: "Sydney", lat: -33.8688, lon: 151.2093, tz: "Australia/Sydney" },
];

const ZODIAC_GLYPHS = [
  "♈",
  "♉",
  "♊",
  "♋",
  "♌",
  "♍",
  "♎",
  "♏",
  "♐",
  "♑",
  "♒",
  "♓",
];

function getTimeZoneOffsetMs(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const parts: Record<string, string> = {};
  for (const part of formatter.formatToParts(date)) {
    if (part.type !== "literal") parts[part.type] = part.value;
  }

  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) % 24,
    Number(parts.minute),
    Number(parts.second),
  );

  return asUtc - date.getTime();
}

/**
 * Converts a wall-clock date + time in a named IANA zone to the correct UTC
 * instant. The server computes Julian days from UTC fields, so this is what
 * keeps a 06:45 birth in Kolkata from being cast as 06:45 UTC.
 */
function wallTimeToUtc(
  dateStr: string,
  timeStr: string,
  timeZone: string,
): Date | null {
  if (!dateStr || !timeStr) return null;

  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = timeStr.split(":").map(Number);

  if (!year || !month || !day || Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  try {
    const wallClock = Date.UTC(year, month - 1, day, hours, minutes, 0);
    let instant =
      wallClock - getTimeZoneOffsetMs(new Date(wallClock), timeZone);
    const corrected =
      wallClock - getTimeZoneOffsetMs(new Date(instant), timeZone);
    if (corrected !== instant) instant = corrected;
    return new Date(instant);
  } catch {
    return null;
  }
}

function nowParts(timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const parts: Record<string, string> = {};
  for (const part of formatter.formatToParts(new Date())) {
    if (part.type !== "literal") parts[part.type] = part.value;
  }

  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${String(Number(parts.hour) % 24).padStart(2, "0")}:${parts.minute}`,
  };
}

function initialsFor(name: string) {
  const cleaned = name.trim();
  if (!cleaned) return "N";
  const words = cleaned.split(/\s+/).slice(0, 2);
  return words.map((word) => word.charAt(0).toUpperCase()).join("");
}

function ChartWheel({ seed }: { seed: string }) {
  const ticks = Array.from({ length: 72 }, (_, index) => index * 5);
  // Round SVG coordinates so the server and client serialize identical
  // attribute strings (raw floats can differ in the last digit and break
  // hydration).
  const round = (value: number) => Math.round(value * 1000) / 1000;

  return (
    <svg
      viewBox="0 0 240 240"
      role="img"
      aria-label="Natal chart preview wheel"
      className="mx-auto mt-6 h-52 w-52 sm:h-60 sm:w-60"
    >
      <circle
        cx="120"
        cy="120"
        r="114"
        fill="none"
        stroke="var(--color-ring-bronze)"
        strokeOpacity="0.45"
        strokeWidth="1"
      />
      <circle
        cx="120"
        cy="120"
        r="94"
        fill="none"
        stroke="var(--color-ring-bronze)"
        strokeOpacity="0.3"
        strokeWidth="1"
      />
      <circle
        cx="120"
        cy="120"
        r="70"
        fill="none"
        stroke="var(--color-accent-orange)"
        strokeOpacity="0.5"
        strokeWidth="1"
      />
      <circle
        cx="120"
        cy="120"
        r="40"
        fill="none"
        stroke="var(--color-ring-bronze)"
        strokeOpacity="0.3"
        strokeWidth="1"
      />

      {ticks.map((degrees) => {
        const radians = (degrees * Math.PI) / 180;
        const outer = 114;
        const inner = degrees % 30 === 0 ? 101 : 107;
        return (
          <line
            key={degrees}
            x1={round(120 + Math.sin(radians) * inner)}
            y1={round(120 - Math.cos(radians) * inner)}
            x2={round(120 + Math.sin(radians) * outer)}
            y2={round(120 - Math.cos(radians) * outer)}
            stroke="var(--color-ring-bronze)"
            strokeOpacity={degrees % 30 === 0 ? 0.6 : 0.25}
            strokeWidth="1"
          />
        );
      })}

      {ZODIAC_GLYPHS.map((glyph, index) => {
        const radians = ((index * 30 + 15) * Math.PI) / 180;
        const radius = 82;
        return (
          <text
            key={glyph}
            x={round(120 + Math.sin(radians) * radius)}
            y={round(120 - Math.cos(radians) * radius)}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="12"
            fill="var(--color-primary-light)"
            fillOpacity="0.6"
          >
            {glyph}
          </text>
        );
      })}

      <circle cx="120" cy="120" r="30" fill="var(--color-accent-orange)" />
      <text
        x="120"
        y="121"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="13"
        fontWeight="900"
        fill="#ffffff"
        letterSpacing="1"
      >
        {seed}
      </text>
    </svg>
  );
}

function SectionHeader({
  index,
  eyebrow,
  title,
}: {
  index: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--color-primary-dark)] text-[11px] font-black text-[var(--color-primary-light)]">
        {index}
      </span>
      <div>
        <p className="text-[9px] font-extrabold tracking-[0.24em] text-[var(--color-accent-orange)] uppercase">
          {eyebrow}
        </p>
        <h2 className="mt-0.5 text-base font-black tracking-tight text-[var(--color-primary-dark)] uppercase">
          {title}
        </h2>
      </div>
    </div>
  );
}

export default function NativityChartForm({
  isLoading,
  isError,
  error,
  onSubmit,
}: NativityChartFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("12:00");
  const [timezone, setTimezone] = useState("UTC");
  const [locationName, setLocationName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [coordinateSystem, setCoordinateSystem] = useState<
    "SIDEREAL" | "TROPICAL"
  >("SIDEREAL");
  const [resolution, setResolution] = useState<
    "MINUTE" | "SECOND" | "EVENT_BASED"
  >("MINUTE");
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationNote, setLocationNote] = useState<string | null>(null);
  const [timezones, setTimezones] = useState<string[]>(FALLBACK_TIMEZONES);

  const timezoneOptions = useMemo(
    () => (timezones.includes(timezone) ? timezones : [timezone, ...timezones]),
    [timezone, timezones],
  );

  useEffect(() => {
    try {
      setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
    } catch {
      setTimezone("UTC");
    }

    try {
      const intlWithZones = Intl as typeof Intl & {
        supportedValuesOf?: (key: string) => string[];
      };
      const zones = intlWithZones.supportedValuesOf?.("timeZone");
      if (zones?.length) setTimezones(zones);
    } catch {
      // Keep the curated fallback list.
    }
  }, []);

  const previewInstant = useMemo(
    () => wallTimeToUtc(birthDate, birthTime, timezone),
    [birthDate, birthTime, timezone],
  );

  const previewMoment = useMemo(() => {
    if (!previewInstant) return null;
    try {
      return new Intl.DateTimeFormat("en-US", {
        dateStyle: "long",
        timeStyle: "short",
        timeZone: timezone,
      }).format(previewInstant);
    } catch {
      return null;
    }
  }, [previewInstant, timezone]);

  const latitudeNumber = Number(latitude);
  const longitudeNumber = Number(longitude);

  const errors = useMemo(() => {
    const next: Record<string, string> = {};

    if (!name.trim()) next.name = "Give this chart a name.";
    if (!birthDate) next.birthDate = "Pick a birth date.";
    if (!birthTime) next.birthTime = "Pick a birth time.";
    if (!timezone) next.timezone = "Choose a timezone.";

    if (
      latitude.trim() === "" ||
      !Number.isFinite(latitudeNumber) ||
      Math.abs(latitudeNumber) > 90
    ) {
      next.latitude = "Latitude must be between -90 and 90.";
    }

    if (
      longitude.trim() === "" ||
      !Number.isFinite(longitudeNumber) ||
      Math.abs(longitudeNumber) > 180
    ) {
      next.longitude = "Longitude must be between -180 and 180.";
    }

    if (!previewInstant) next.birthDate = "This date and time is invalid.";

    return next;
  }, [
    birthDate,
    birthTime,
    latitude,
    latitudeNumber,
    longitude,
    longitudeNumber,
    name,
    previewInstant,
    timezone,
  ]);

  const hasErrors = Object.keys(errors).length > 0;
  const visibleError = (field: string) =>
    submitAttempted ? errors[field] : undefined;

  const applyCity = (city: (typeof CITY_PRESETS)[number]) => {
    setLocationName(city.city);
    setLatitude(String(city.lat));
    setLongitude(String(city.lon));
    setTimezone(city.tz);
    setLocationNote(null);
  };

  const useCurrentMoment = () => {
    const parts = nowParts(timezone);
    setBirthDate(parts.date);
    setBirthTime(parts.time);
  };

  const useDeviceLocation = () => {
    if (!navigator.geolocation) {
      setLocationNote("This browser cannot share a location.");
      return;
    }

    setLocating(true);
    setLocationNote(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(4));
        setLongitude(position.coords.longitude.toFixed(4));
        setLocationName((current) => current || "Current location");
        try {
          const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
          if (detected) setTimezone(detected);
        } catch {
          // Keep the selected zone.
        }
        setLocating(false);
      },
      () => {
        setLocationNote("Location permission was declined.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitAttempted(true);

    if (hasErrors || !previewInstant) return;

    await onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      birthDateTime: previewInstant,
      timezone,
      latitude: latitudeNumber,
      longitude: longitudeNumber,
      locationName: locationName.trim() || undefined,
      coordinateSystem,
      timeResolution: resolution,
    });
  };

  const fieldClass =
    "w-full rounded-xl border border-[var(--color-ring-bronze)]/45 bg-[var(--color-primary-light)]/70 px-4 py-3 text-sm font-semibold text-[var(--color-primary-dark)] transition outline-none placeholder:text-[var(--color-primary-dark)]/35 focus:border-[var(--color-accent-orange)] focus:bg-white";
  const labelClass =
    "mb-1.5 block text-[9px] font-extrabold tracking-[0.2em] text-[var(--color-primary-dark)]/55 uppercase";
  const errorClass = "mt-1.5 text-[11px] font-bold text-red-700";

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_21rem]">
      <form onSubmit={handleSubmit} noValidate className="space-y-3">
        {isError && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800"
          >
            <AlertCircle size={17} className="mt-0.5 shrink-0" />
            <span>{error?.message ?? "The chart could not be created."}</span>
          </div>
        )}

        <section className="rounded-2xl border border-[var(--color-ring-bronze)]/35 bg-white p-5 shadow-sm sm:p-6">
          <SectionHeader
            index="01"
            eyebrow="Identity"
            title="Name this origin point"
          />

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="chart-name" className={labelClass}>
                Chart name
              </label>
              <input
                id="chart-name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Nischal Gupta"
                className={fieldClass}
                autoComplete="off"
              />
              {visibleError("name") && (
                <p className={errorClass}>{errors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="chart-description" className={labelClass}>
                Short note <span className="normal-case">(optional)</span>
              </label>
              <input
                id="chart-description"
                type="text"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="e.g. Natal chart for the 1987 cohort"
                className={fieldClass}
                autoComplete="off"
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--color-ring-bronze)]/35 bg-white p-5 shadow-sm sm:p-6">
          <SectionHeader
            index="02"
            eyebrow="Birth moment"
            title="Pin the exact instant"
          />

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="birth-date" className={labelClass}>
                <CalendarDays size={11} className="mr-1 inline" />
                Birth date
              </label>
              <input
                id="birth-date"
                type="date"
                value={birthDate}
                onChange={(event) => setBirthDate(event.target.value)}
                className={fieldClass}
              />
              {visibleError("birthDate") && (
                <p className={errorClass}>{errors.birthDate}</p>
              )}
            </div>

            <div>
              <label htmlFor="birth-time" className={labelClass}>
                <Clock3 size={11} className="mr-1 inline" />
                Birth time
              </label>
              <input
                id="birth-time"
                type="time"
                value={birthTime}
                onChange={(event) => setBirthTime(event.target.value)}
                className={fieldClass}
              />
              {visibleError("birthTime") && (
                <p className={errorClass}>{errors.birthTime}</p>
              )}
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="birth-timezone" className={labelClass}>
              <Globe2 size={11} className="mr-1 inline" />
              Timezone of the birthplace
            </label>
            <select
              id="birth-timezone"
              value={timezone}
              onChange={(event) => setTimezone(event.target.value)}
              className={fieldClass}
            >
              {timezoneOptions.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </select>
            {visibleError("timezone") && (
              <p className={errorClass}>{errors.timezone}</p>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={useCurrentMoment}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-ring-bronze)]/45 px-3 py-1.5 text-[10px] font-extrabold tracking-[0.14em] text-[var(--color-primary-dark)]/70 uppercase transition-colors hover:border-[var(--color-accent-orange)] hover:text-[var(--color-accent-orange)]"
            >
              <Sparkles size={11} />
              Use current moment
            </button>
            <span className="text-[10px] font-semibold text-[var(--color-primary-dark)]/45">
              Local wall time is converted to UTC before the ephemeris runs.
            </span>
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--color-ring-bronze)]/35 bg-white p-5 shadow-sm sm:p-6">
          <SectionHeader
            index="03"
            eyebrow="Place"
            title="Where the sky was overhead"
          />

          <div className="mt-5 flex flex-wrap gap-1.5">
            {CITY_PRESETS.map((city) => (
              <button
                key={city.city}
                type="button"
                onClick={() => applyCity(city)}
                className={`rounded-full border px-3 py-1.5 text-[10px] font-extrabold tracking-[0.1em] uppercase transition-colors ${
                  locationName === city.city
                    ? "border-[var(--color-accent-orange)] bg-[var(--color-accent-orange)] text-white"
                    : "border-[var(--color-ring-bronze)]/40 text-[var(--color-primary-dark)]/65 hover:border-[var(--color-accent-orange)] hover:text-[var(--color-accent-orange)]"
                }`}
              >
                {city.city}
              </button>
            ))}
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="location-name" className={labelClass}>
                <MapPin size={11} className="mr-1 inline" />
                Place name
              </label>
              <input
                id="location-name"
                type="text"
                value={locationName}
                onChange={(event) => setLocationName(event.target.value)}
                placeholder="City, region, country"
                className={fieldClass}
                autoComplete="off"
              />
            </div>

            <div>
              <label htmlFor="latitude" className={labelClass}>
                Latitude
              </label>
              <input
                id="latitude"
                type="number"
                step="any"
                inputMode="decimal"
                value={latitude}
                onChange={(event) => setLatitude(event.target.value)}
                placeholder="28.6139"
                className={fieldClass}
              />
              {visibleError("latitude") && (
                <p className={errorClass}>{errors.latitude}</p>
              )}
            </div>

            <div>
              <label htmlFor="longitude" className={labelClass}>
                Longitude
              </label>
              <input
                id="longitude"
                type="number"
                step="any"
                inputMode="decimal"
                value={longitude}
                onChange={(event) => setLongitude(event.target.value)}
                placeholder="77.2090"
                className={fieldClass}
              />
              {visibleError("longitude") && (
                <p className={errorClass}>{errors.longitude}</p>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={useDeviceLocation}
              disabled={locating}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-ring-bronze)]/45 px-3 py-1.5 text-[10px] font-extrabold tracking-[0.14em] text-[var(--color-primary-dark)]/70 uppercase transition-colors hover:border-[var(--color-accent-orange)] hover:text-[var(--color-accent-orange)] disabled:opacity-60"
            >
              {locating ? (
                <Loader size={11} className="animate-spin" />
              ) : (
                <Crosshair size={11} />
              )}
              Use my location
            </button>
            {locationNote && (
              <span className="text-[10px] font-bold text-[var(--color-accent-orange)]">
                {locationNote}
              </span>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--color-ring-bronze)]/35 bg-white p-5 shadow-sm sm:p-6">
          <SectionHeader
            index="04"
            eyebrow="System"
            title="Choose the zodiac frame"
          />

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {(
              [
                {
                  value: "SIDEREAL",
                  title: "Sidereal",
                  body: "Vedic frame. Accounts for precession; default for Kaalvanta.",
                },
                {
                  value: "TROPICAL",
                  title: "Tropical",
                  body: "Western frame. Seasons anchor the wheel at 0° Aries.",
                },
              ] as const
            ).map((option) => {
              const active = coordinateSystem === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setCoordinateSystem(option.value)}
                  aria-pressed={active}
                  className={`rounded-xl border p-3.5 text-left transition-colors ${
                    active
                      ? "border-[var(--color-accent-orange)] bg-[var(--color-primary-light)]"
                      : "border-[var(--color-ring-bronze)]/35 hover:border-[var(--color-ring-bronze)]"
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-[12px] font-black tracking-[0.08em] text-[var(--color-primary-dark)] uppercase">
                      {option.title}
                    </span>
                    <span
                      className={`grid h-4 w-4 place-items-center rounded-full border ${
                        active
                          ? "border-[var(--color-accent-orange)]"
                          : "border-[var(--color-ring-bronze)]/50"
                      }`}
                    >
                      {active && (
                        <span className="h-2 w-2 rounded-full bg-[var(--color-accent-orange)]" />
                      )}
                    </span>
                  </span>
                  <span className="mt-1.5 block text-[11px] leading-snug font-medium text-[var(--color-primary-dark)]/60">
                    {option.body}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className={labelClass}>Time resolution</span>
            {(
              [
                { value: "MINUTE", label: "Minute" },
                { value: "SECOND", label: "Second" },
                { value: "EVENT_BASED", label: "Event" },
              ] as const
            ).map((option) => {
              const active = resolution === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setResolution(option.value)}
                  aria-pressed={active}
                  className={`rounded-full border px-3 py-1.5 text-[10px] font-extrabold tracking-[0.12em] uppercase transition-colors ${
                    active
                      ? "border-[var(--color-primary-dark)] bg-[var(--color-primary-dark)] text-[var(--color-primary-light)]"
                      : "border-[var(--color-ring-bronze)]/40 text-[var(--color-primary-dark)]/60 hover:border-[var(--color-primary-dark)]/40"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--color-ring-bronze)]/35 bg-white p-4 shadow-sm">
          <p className="max-w-md text-[11px] leading-snug font-semibold text-[var(--color-primary-dark)]/55">
            Saving casts 11 bodies, the ascendant, whole-sign houses, and every
            aspect — then opens the chart in its destination surface.
          </p>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--color-accent-orange)] px-6 py-3 text-[11px] font-black tracking-[0.18em] text-white uppercase transition-all hover:bg-[var(--color-primary-dark)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? (
              <Loader size={15} className="animate-spin" />
            ) : (
              <Orbit size={15} />
            )}
            {isLoading ? "Casting chart" : "Cast natal chart"}
          </button>
        </div>
      </form>

      <aside className="lg:sticky lg:top-4 lg:self-start">
        <div className="overflow-hidden rounded-[26px] border border-[var(--color-ring-bronze)]/30 bg-[var(--color-primary-dark)] text-[var(--color-primary-light)] shadow-sm">
          <div className="p-5 sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[9px] font-extrabold tracking-[0.24em] text-[var(--color-accent-orange)] uppercase">
                Chart dossier
              </p>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-ring-bronze)]/40 px-2 py-0.5 text-[8px] font-extrabold tracking-[0.14em] uppercase">
                <span className="h-1 w-1 rounded-full bg-[var(--color-accent-orange)]" />
                Live preview
              </span>
            </div>

            <h2 className="mt-2 text-2xl leading-tight font-black tracking-tight uppercase">
              {name.trim() || "Untitled nativity"}
            </h2>
            <p className="mt-1.5 min-h-[2.5rem] text-[11px] leading-snug font-medium text-[var(--color-primary-light)]/55">
              {description.trim() ||
                "Name the chart and enter the birth data — this dossier updates as you type."}
            </p>

            <ChartWheel seed={initialsFor(name)} />

            <dl className="mt-4 divide-y divide-[var(--color-ring-bronze)]/20 border-t border-[var(--color-ring-bronze)]/20 text-[11px]">
              <div className="flex items-start justify-between gap-3 py-2.5">
                <dt className="font-extrabold tracking-[0.14em] text-[var(--color-primary-light)]/45 uppercase">
                  Moment
                </dt>
                <dd className="max-w-[65%] text-right font-bold">
                  {previewMoment ?? "—"}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-3 py-2.5">
                <dt className="font-extrabold tracking-[0.14em] text-[var(--color-primary-light)]/45 uppercase">
                  Place
                </dt>
                <dd className="max-w-[65%] truncate text-right font-bold">
                  {locationName.trim() || "—"}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-3 py-2.5">
                <dt className="font-extrabold tracking-[0.14em] text-[var(--color-primary-light)]/45 uppercase">
                  Coordinates
                </dt>
                <dd className="text-right font-bold">
                  {latitude && longitude
                    ? `${Number(latitude).toFixed(2)}°, ${Number(longitude).toFixed(2)}°`
                    : "—"}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-3 py-2.5">
                <dt className="font-extrabold tracking-[0.14em] text-[var(--color-primary-light)]/45 uppercase">
                  Frame
                </dt>
                <dd className="text-right font-bold">
                  {coordinateSystem === "SIDEREAL" ? "Sidereal" : "Tropical"} ·{" "}
                  {resolution === "MINUTE"
                    ? "Minute"
                    : resolution === "SECOND"
                      ? "Second"
                      : "Event"}
                </dd>
              </div>
            </dl>
          </div>

          <div className="border-t border-[var(--color-ring-bronze)]/25 bg-[#22365d] px-5 py-4 sm:px-6">
            <p className="flex items-start gap-2 text-[10px] leading-snug font-semibold text-[var(--color-primary-light)]/55">
              <Compass size={13} className="mt-0.5 shrink-0" />
              One intake feeds the archive, climate, dashboard, and every
              profile-aware module.
            </p>
            <Link
              href="/nativity"
              className="mt-3 inline-flex items-center gap-1.5 text-[9px] font-extrabold tracking-[0.18em] text-[var(--color-accent-orange)] uppercase transition-colors hover:text-[var(--color-primary-light)]"
            >
              Open archive
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
}
