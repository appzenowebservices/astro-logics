"""Sun position calculator (NOAA-style solar position algorithm).

Computes the Sun's equatorial coordinates, constellation, distance, and
horizon position (altitude/azimuth plus rise/noon/set times) for any
UTC instant and observer location. Pure stdlib, no dependencies.
"""
import math
from datetime import datetime, timezone


def julian_date(dt):
    """Julian Day from a timezone-aware UTC datetime."""
    y, m = dt.year, dt.month
    d = dt.day + (dt.hour + dt.minute / 60 + dt.second / 3600) / 24.0
    if m <= 2:
        y -= 1
        m += 12
    A = math.floor(y / 100)
    B = 2 - A + math.floor(A / 4)
    return math.floor(365.25 * (y + 4716)) + math.floor(30.6001 * (m + 1)) + d + B - 1524.5


def sun_equatorial(jd):
    """Sun's apparent equatorial coordinates for Julian Day `jd`.

    Returns (RA deg, Dec deg, distance AU, apparent ecliptic longitude deg).
    """
    T = (jd - 2451545.0) / 36525.0
    L0 = math.radians((280.46646 + 36000.76983 * T + 0.0003032 * T * T) % 360)
    M = math.radians((357.52911 + 35999.05029 * T - 0.0001537 * T * T) % 360)
    e = 0.016708634 - 0.000042037 * T - 0.0000001267 * T * T
    C = (math.sin(M) * (1.914602 - 0.004817 * T - 0.000014 * T * T)
         + math.sin(2 * M) * (0.019993 - 0.000101 * T)
         + math.sin(3 * M) * 0.000289)
    L_true = L0 + math.radians(C)
    L_app = (L_true
             - math.radians(0.00569 + 0.00478 * math.sin(math.radians(125.04 - 1934.136 * T))))
    eps = math.radians(23.439291 - 0.0130042 * T)
    ra = math.degrees(math.atan2(math.cos(eps) * math.sin(L_app), math.cos(L_app))) % 360
    dec = math.degrees(math.asin(math.sin(eps) * math.sin(L_app)))
    dist = 1.000001018 * (1 - e * e) / (1 + e * math.cos(M + math.radians(C)))
    ecl_lon = math.degrees(L_app) % 360
    return ra, dec, dist, ecl_lon


def equation_of_time(jd, T):
    """Equation of time in minutes (NOAA)."""
    L0 = math.radians((280.46646 + 36000.76983 * T + 0.0003032 * T * T) % 360)
    M = math.radians((357.52911 + 35999.05029 * T - 0.0001537 * T * T) % 360)
    e = 0.016708634 - 0.000042037 * T - 0.0000001267 * T * T
    y = math.tan(math.radians(23.439291 - 0.0130042 * T) / 2) ** 2
    return 4 * math.degrees(
        y * math.sin(2 * L0) - 2 * e * math.sin(M)
        + 4 * e * y * math.sin(M) * math.cos(2 * L0)
        - 0.5 * y * y * math.sin(4 * L0) - 1.25 * e * e * math.sin(2 * M))


def horizon_angle(lat, lon, ra, dec, jd, T):
    """Local hour angle in degrees."""
    gmst = (280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T) % 360
    return (gmst + lon - ra) % 360


def alt_az(lat, lon, ra, dec, H):
    """Observer altitude (deg) and azimuth from North, clockwise (deg)."""
    lat_r, dec_r = math.radians(lat), math.radians(dec)
    Hr = math.radians(H)
    alt = math.degrees(math.asin(
        math.sin(lat_r) * math.sin(dec_r) + math.cos(lat_r) * math.cos(dec_r) * math.cos(Hr)))
    az = (math.degrees(math.atan2(
        math.sin(Hr), math.cos(Hr) * math.sin(lat_r) - math.tan(dec_r) * math.cos(lat_r))) + 180) % 360
    return alt, az


# Approximate zodiacal boundaries by ecliptic longitude (deg, ascending).
# E.g. Sun enters Virgo at ~150 deg, Libra at ~180 deg.
CONSTELLATIONS = [
    (0, "Pisces"), (30, "Aries"), (53, "Taurus"), (90, "Gemini"), (120, "Cancer"),
    (150, "Leo"), (180, "Virgo"), (210, "Libra"), (243, "Scorpius"), (266, "Sagittarius"),
    (300, "Capricornus"), (330, "Aquarius"), (360, "Pisces"),
]


def constellation(ecl_lon):
    """Best-effort constellation from apparent ecliptic longitude."""
    for upper, name in CONSTELLATIONS:
        if ecl_lon < upper:
            return name
    return "Pisces"


def fmt(hours):
    """Format decimal hours as HH:MM (24h)."""
    h = hours % 24
    mins = int(round((h % 1) * 60))
    if mins == 60:
        h += 1
        mins = 0
    return f"{int(h) % 24:02d}:{mins:02d}"


if __name__ == "__main__":
    # --- context: UTC instant + observer location (Lucknow, IN) ---
    now = datetime(2026, 8, 31, 17, 55, 12, tzinfo=timezone.utc)
    jd = julian_date(now)
    T = (jd - 2451545.0) / 36525.0
    ra, dec, dist, ecl_lon = sun_equatorial(jd)
    eot = equation_of_time(jd, T)
    lat, lon = 26.8393, 80.9231  # Lucknow, IN (IP-geolocated)
    H = horizon_angle(lat, lon, ra, dec, jd, T)
    alt, az = alt_az(lat, lon, ra, dec, H)

    # sunrise / solar noon / sunset (UTC hours)
    cosH0 = ((math.sin(math.radians(-0.833)) - math.sin(math.radians(lat)) * math.sin(math.radians(dec)))
             / (math.cos(math.radians(lat)) * math.cos(math.radians(dec))))
    H0 = math.degrees(math.acos(max(-1, min(1, cosH0))))
    solar_noon_utc = 12 - lon / 15 - eot / 60
    sunrise_utc = solar_noon_utc - H0 / 15
    sunset_utc = solar_noon_utc + H0 / 15
    ist = 5.5

    local_h = now.hour + now.minute / 60 + ist
    print(f"UTC now          : {now.strftime('%Y-%m-%d %H:%M:%S')}  (JD {jd:.5f})")
    print(f"Local now        : {fmt(local_h)} IST (Lucknow, 26.8393N 80.9231E)")
    print(f"Right Ascension  : {ra:8.3f} deg  = {fmt(ra / 15)}")
    print(f"Declination      : {dec:+.3f} deg")
    print(f"Ecliptic longitude: {ecl_lon:.3f} deg  -> constellation {constellation(ecl_lon)}")
    print(f"Distance         : {dist:.6f} AU  ({dist * 1.495978707e8:,.0f} km)")
    print(f"Angular size     : {0.533 / dist:.3f} deg")
    print(f"Equation of time : {eot:+.2f} min")
    print(f"Altitude         : {alt:+.2f} deg ({'above' if alt > 0 else 'BELOW'} horizon)")
    print(f"Azimuth          : {az:.2f} deg from North (clockwise)")
    print(f"Sunrise / Noon / Sunset (IST): "
          f"{fmt(sunrise_utc + ist)} / {fmt(solar_noon_utc + ist)} / {fmt(sunset_utc + ist)}")