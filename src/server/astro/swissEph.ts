import SwissEph from "swisseph-wasm";

let sweInstance: SwissEph | null = null;
let initPromise: Promise<SwissEph> | null = null;

export async function getSwissEph(): Promise<SwissEph> {
  if (sweInstance) return sweInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const swe = new SwissEph();
    await swe.initSwissEph();
    swe.set_sid_mode(swe.SE_SIDM_LAHIRI, 0, 0);
    sweInstance = swe;
    return swe;
  })();

  return initPromise;
}
