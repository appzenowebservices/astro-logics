import Layout from "./Layout";

export const Loader = () => {
  return (
    <Layout>
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-[var(--color-primary-dark)] text-white/40">
        <div className="h-10 w-10 animate-spin rounded-xl border-2 border-[var(--color-accent-orange)] border-t-transparent shadow-[0_0_15px_rgba(209,122,56,0.2)]" />
        <span className="font-roboto animate-pulse text-xs tracking-[0.25em] uppercase">
          Synchronizing State Space...
        </span>
      </div>
    </Layout>
  );
};
