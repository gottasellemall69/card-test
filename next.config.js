const path = require("path");
const ignoredAssetWatchPattern = /[\\/]public[\\/]images[\\/]yugiohImages(?:Cropped)?[\\/]/;

const mergeWebpackIgnoredPaths = ( ignored ) => {
  if ( !ignored ) {
    return [ ignoredAssetWatchPattern ];
  }

  return Array.isArray( ignored )
    ? [ ...ignored, ignoredAssetWatchPattern ]
    : [ ignored, ignoredAssetWatchPattern ];
};
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
  turbopack: {
    root: path.join(__dirname),
  },

  webpack: ( config, { dev } ) => {
    if ( dev ) {
      config.watchOptions = {
        ...( config.watchOptions || {} ),
        ignored: mergeWebpackIgnoredPaths( config.watchOptions?.ignored ),
      };
    }

    return config;
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "geolocation=(), camera=(), microphone=(), fullscreen=*, payment=()",
          },
          {
            key: "X-Permitted-Cross-Domain-Policies",
            value: "none",
          },
          {
            key: "Expect-CT",
            value: "max-age=86400, enforce",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
