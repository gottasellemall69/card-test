/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
  experimental: {
    swcMinify: true,
    modularizeImports: {
      lodash: {
        transform: "lodash/{{member}}",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "script-src 'self' 'unsafe-inline' 'unsafe-eval' mpapi.tcgplayer.com infinite-api.tcgplayer.com card-test-ashy.vercel.app va.vercel-scripts.com db.ygoprodeck.com sportscardspro.com; style-src 'self' 'unsafe-inline' card-test-ashy.vercel.app; img-src 'self' images.ygoprodeck.com data:; object-src 'none'; default-src 'self' mpapi.tcgplayer.com db.ygoprodeck.com sportscardspro.com card-test-ashy.vercel.app infinite-api.tcgplayer.com va.vercel-scripts.com; font-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests;"
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff"
          },
          {
            key: "X-Frame-Options",
            value: "DENY"
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin"
          },
          {
            key: "Permissions-Policy",
            value: "geolocation=(), camera=(), microphone=(), fullscreen=*, payment=()"
          },
          {
            key: "X-Permitted-Cross-Domain-Policies",
            value: "none"
          },
          {
            key: "Expect-CT",
            value: "max-age=86400, enforce"
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
