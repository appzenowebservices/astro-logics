// next.config.js
// import withPW  AInit from "next-pwa";

/**
 * Configure PWA plugin
 */
// const withPWA = withPWAInit({
//   dest: "public",
//   register: true,
//   skipWaiting: true,
//   publicExcludes: ["**/*"],
//   buildExcludes: [() => true],
// });

/**
 * Base Next.js config
 */

const nextConfig = {
  reactStrictMode: true,

  // The VPS has 2 vCPUs / 4 GB. Serialising build workers keeps Next's peak
  // memory inside the box's headroom (parallel builds have rebooted it before).
  experimental: {
    cpus: 1,
  },

  // outputFileTracing: false ,
  //  outputFileTracingRoot: process.cwd(),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  //  experimental: {
  //     outputFileTracingRoot: "D:/Dev/Kaalvanta",
  //   },
};

// Export merged PWA + Next config
// export default withPWA(nextConfig);
export default nextConfig;
