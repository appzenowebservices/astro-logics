import React from "react";

const StatCard = ({
  label,
  value,
  caption,
}: {
  label: string;
  value: string;
  caption: string;
}) => (
  <div className="group rounded-[2rem] border border-[var(--color-ring-bronze)]/20 bg-[var(--bg-main)] p-6 shadow-sm transition-all duration-500 hover:shadow-[var(--color-accent-glow)]/5">
    {/* Label: Reduced to font-bold and lower opacity for a "whisper" effect */}
    <p className="mb-4 text-[9px] font-bold tracking-[0.4em] text-[var(--text-muted)]/70 uppercase transition-colors group-hover:text-[var(--color-primary-dark)]">
      {label}
    </p>

    {/* Value: Shifted from font-black to font-semibold for a cleaner look */}
    <p className="origin-left text-4xl font-semibold tracking-tight text-[var(--color-primary-light)] transition-transform group-hover:translate-x-1">
      {value}
    </p>

    {/* Divider: Thinner and more transparent */}
    <div className="my-4 h-[0.5px] w-6 bg-[var(--color-accent-orange)] opacity-30 transition-all group-hover:w-12" />

    {/* Caption: Lighter font-medium instead of black */}
    <p className="font-mono text-[10px] font-medium tracking-[0.15em] text-[var(--color-accent-orange)]/80 uppercase">
      {caption}
    </p>
  </div>
);

export default StatCard;
