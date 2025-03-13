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
          "value": "default-src 'self'; img-src 'self' data:; script-src 'self'; style-src 'self' 'unsafe-inline';"
        }
      ]
    }
  ]
};
