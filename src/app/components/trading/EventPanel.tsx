import { useMemo } from "react";
import { getEventMarkerStyle, type ChartEvent } from "./EventMarkerStyles";

type EventPanelProps = {
  events: ChartEvent[];
};

function formatEventTime(time: unknown) {
  if (typeof time !== "number") return "";

  return new Date(time * 1000).toLocaleTimeString();
}

export default function EventPanel({ events }: EventPanelProps) {
  const reversedEvents = useMemo(() => {
    return [...events].reverse();
  }, [events]);

  return (
    <div className="absolute bottom-4 left-4 z-50 max-h-[40%] w-80 overflow-y-auto rounded-xl bg-black/70 px-4 py-3 text-xs text-white backdrop-blur">
      <div className="mb-2 flex items-center justify-between">
        <div className="font-bold">Events ({events.length})</div>
        <div className="text-[10px] tracking-wide text-white/50 uppercase">
          S(t-1) → S(t)
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {reversedEvents.map((event, index) => {
          const style = getEventMarkerStyle(event.type);

          return (
            <div
              key={`${event.type}-${index}`}
              className="rounded-lg border border-white/10 bg-black/40 p-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: style.color }}
                  />
                  <span className="font-mono text-[10px] font-bold uppercase">
                    {event.type.replaceAll("_", " ")}
                  </span>
                </div>

                <span className="text-[10px] text-white/50">
                  {formatEventTime(event.time)}
                </span>
              </div>

              {event.narrative ? (
                <div className="mt-1 text-[11px] text-white/70">
                  {event.narrative}
                </div>
              ) : null}

              <div className="mt-1 flex gap-3 text-[10px] text-white/50">
                <span>
                  str{" "}
                  {typeof event.strength === "number"
                    ? event.strength.toFixed(2)
                    : "—"}
                </span>
                <span>
                  conf{" "}
                  {typeof event.confidence === "number"
                    ? event.confidence.toFixed(2)
                    : "—"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
