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
  // outputFileTracing: false ,
  //  outputFileTracingRoot: process.cwd(),
  images: {
    domains: ["apnidesidukaan.com"],

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
  //     outputFileTracingRoot: "D:/Dev/ADDies",
  //   },
};

// Export merged PWA + Next config
// export default withPWA(nextConfig);
export default nextConfig;
