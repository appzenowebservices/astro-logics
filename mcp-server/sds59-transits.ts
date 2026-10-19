/* Compute current transit snapshot for the SDS-59 request (Astrologer). */
import { TransitCalculator } from "~/server/services/transitCalculator";

const AT = process.env.AT || "2026-08-31T12:59:00Z";
const LAT = 26.85; // Lucknow
const LON = 80.95;

const ORBS: Record<string, number> = {
  conjunction: 8,
  sextile: 6,
  square: 8,
  trine: 8,
  opposition: 8,
};

function aspectType(a: number): string | null {
  const d = Math.abs(a);
  if (d <= ORBS.conjunction) return "conjunction";
  if (Math.abs(d - 60) <= ORBS.sextile) return "sextile";
  if (Math.abs(d - 90) <= ORBS.square) return "square";
  if (Math.abs(d - 120) <= ORBS.trine) return "trine";
  if (Math.abs(d - 180) <= ORBS.opposition) return "opposition";
  return null;
}

async function main() {
  const calc = new TransitCalculator();
  const snap = await calc.getTransitSnapshot(new Date(AT), LAT, LON);

  const planets = snap.planets;
  const byName = Object.fromEntries(planets.map((p) => [p.planet, p]));

  // Aspect pass between transiting planets (angular separation, minor axis)
  const aspects: Array<{ a: string; b: string; type: string; orb: number; exact: boolean }> = [];
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const p1 = planets[i];
      const p2 = planets[j];
      const sep = Math.abs(p1.longitude - p2.longitude) % 360;
      const ang = sep > 180 ? 360 - sep : sep;
      const t = aspectType(ang);
      if (t) {
        const orb =
          t === "conjunction"
            ? ang
            : t === "sextile"
              ? Math.abs(ang - 60)
              : t === "square"
                ? Math.abs(ang - 90)
                : t === "trine"
                  ? Math.abs(ang - 120)
                  : Math.abs(ang - 180);
        aspects.push({ a: p1.planet, b: p2.planet, type: t, orb: +orb.toFixed(2), exact: orb <= 1 });
      }
    }
  }

  const out: Record<string, unknown> = {
    computedAt: snap.date.toISOString(),
    location: { name: "Lucknow", latitude: LAT, longitude: LON },
    system: "sidereal (Lahiri)",
    planets: planets.map((p) => ({
      planet: p.planet,
      longitude: +p.longitude.toFixed(4),
      zodiacSign: p.zodiacSign,
      degree: +p.degree.toFixed(4),
      isRetrograde: p.isRetrograde,
      isStationary: (p as unknown as { isStationary?: boolean }).isStationary ?? false,
      speedDegPerDay: +(p.speed || 0).toFixed(5),
    })),
    aspects: aspects.sort((x, y) => x.orb - y.orb),
  };
  console.log(JSON.stringify(out, null, 2));
  void byName;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});