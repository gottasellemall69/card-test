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
  headers: [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "script-src 'self' 'nonce-${nonce}' 'unsafe-inline' 'unsafe-eval' mpapi.tcgplayer.com infinite-api.tcgplayer.com card-test-ashy.vercel.app va.vercel-scripts.com db.ygoprodeck.com sportscardspro.com; style-src 'self' 'nonce-${nonce}' 'unsafe-inline' card-test-ashy.vercel.app; img-src 'self' images.ygoprodeck.com data:; object-src 'none'; default-src 'self' 'unsafe-inline' mpapi.tcgplayer.com db.ygoprodeck.com sportscardspro.com card-test-ashy.vercel.app infinite-api.tcgplayer.com va.vercel-scripts.com; font-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests;"
        }
      ]
    }
  ]
};
