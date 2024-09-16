/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-inline' 'unsafe-eval' https://infinite-api.tcgplayer.com https://card-test-ashy.vercel.app https://va.vercel-scripts.com https://db.ygoprodeck.com https://sportscardspro.com;
              style-src 'self' 'unsafe-inline' https://card-test-ashy.vercel.app;
              img-src 'self' data:;
              object-src 'none';
              connect-src 'self' https://infinite-api.tcgplayer.com https://db.ygoprodeck.com;
              font-src 'self';
              frame-ancestors 'none';
              upgrade-insecure-requests;
              block-all-mixed-content;
            `.trim(),
          },
        ],
      },
    ];
  },
};
};
