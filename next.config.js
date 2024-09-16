/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

 // next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)', // Applies to all routes
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self' db.ygoprodeck.com;
              script-src 'self' 'unsafe-inline' 'unsafe-eval' infinite-api.tcgplayer.com card-test-ashy.vercel.app va.vercel-scripts.com db.ygoprodeck.com sportscardspro.com;
              style-src 'self' 'unsafe-inline' card-test-ashy.vercel.app;
              img-src 'self' data:;
              object-src 'none';
            `.trim(), // Remove extra whitespace
          },
        ],
      },
    ];
  },
};

