import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Compression and performance optimizations
  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,

  // Image optimizations
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.startech.com.bd",
      },
    ],
    // Use modern image formats for better compression
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Cache images for 1 year in production
    minimumCacheTTL: 31536000,
    dangerouslyAllowSVG: true,
  },

  // Headers for caching and security
  headers: async () => {
    return [
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/fonts/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },

  // Explicit Turbopack config avoids Next 16 treating the webpack block as accidental.
  turbopack: {
    root: process.cwd(),
  },

  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    if (dev || isServer) {
      return config;
    }

    config.optimization = {
      ...config.optimization,
      // Split chunks for better caching
      splitChunks: {
        chunks: "all",
        cacheGroups: {
          default: false,
          vendors: false,
          // Common vendors
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendor",
            priority: 20,
            reuseExistingChunk: true,
            enforce: true,
          },
        },
      },
    };

    return config;
  },
};

export default nextConfig;
