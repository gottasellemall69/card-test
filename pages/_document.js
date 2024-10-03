import { SpeedInsights } from "@vercel/speed-insights/next";
import { Head, Html, Main, NextScript } from "next/document";


export default function Document() {
  return (
    <Html lang="en" className="h-full bg-black">
      <Head>
        <meta name="description" content="Enter list of TCG cards, get data back" />
        <meta name="keywords" content="javascript,nextjs,price-tracker,trading-card-game,tailwindcss" />
        <meta name="charSet" content="UTF-8" />
        <meta
          httpEquiv="Content-Security-Policy"
          content="
              script-src 'self' 'unsafe-inline' 'unsafe-eval' infinite-api.tcgplayer.com card-test-ashy.vercel.app va.vercel-scripts.com db.ygoprodeck.com sportscardspro.com;
              style-src 'self' 'unsafe-inline' card-test-ashy.vercel.app;
              img-src 'self' data:;
              object-src 'none';
              default-src 'self' db.ygoprodeck.com;
            "
        />
      </Head>
      <>
        <body className="h-full w-full">
          <div className="w-full transition-all main">
            <div className="text-center sm:text-left">
              <Main
              />
            </div>
          </div>
          <NextScript />
        </body>
        <SpeedInsights />
      </>
    </Html>
  );
}
