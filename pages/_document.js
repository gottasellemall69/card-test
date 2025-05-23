import { Html, Head, Main, NextScript } from 'next/document';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function Document() {
  return (
    <Html lang="en" className="h-full bg-black">
      <Head>
        <meta name="description" content="Enter list of TCG cards, get data back" />
        <meta name="keywords" content="javascript,nextjs,price-tracker,trading-card-game,tailwindcss" />
        <meta charSet="UTF-8" />
        <meta
          httpEquiv="Content-Security-Policy"
          content="
            script-src 'self' 'unsafe-inline' 'unsafe-eval' mpapi.tcgplayer.com infinite-api.tcgplayer.com card-test-ashy.vercel.app va.vercel-scripts.com db.ygoprodeck.com sportscardspro.com;
            style-src 'self' 'unsafe-inline' card-test-ashy.vercel.app;
            img-src 'self' images.ygoprodeck.com data:;
            object-src 'none';
            default-src 'self' 'unsafe-inline' mpapi.tcgplayer.com db.ygoprodeck.com sportscardspro.com card-test-ashy.vercel.app infinite-api.tcgplayer.com va.vercel-scripts.com;
            font-src 'self';
            base-uri 'self';
            form-action 'self';
            upgrade-insecure-requests;
          "
        />
      </Head>
      <body className="mx-auto">
        <div className="transition-all main mx-auto min-h-screen">
          <Main />
        </div>
        <NextScript />
        <SpeedInsights />
      </body>
    </Html>
  );
}
