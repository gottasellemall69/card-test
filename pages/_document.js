import SideNav from "@/components/Navigation/SideNav";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Head, Html, Main, NextScript } from "next/document";


export default function Document() {
  return (
    <Html lang="en" className="h-full bg-black">
      <Head>
        <meta name="description" content="Enter list of TCG cards, get data back" />
        <meta name="keywords" content="javascript,nextjs,price-tracker,trading-card-game,tailwindcss" />
        <meta name="charset" content="UTF-8" />
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
      <body className="h-full w-full">
        <div className="flex h-full">
          <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:max-w-60 lg:flex-col">
            <SideNav />
          </div>
          <div className="w-full mx-auto lg:ml-64 transition-all main">
            <div className="bg-black w-full px-6 py-5 sm:py-12">
              <div className="mx-auto w-full text-center sm:text-left">
                <Main
                  className="pb-10 lg:pl-72 bg-black h-full"
                />
              </div>
            </div>
          </div>
          <NextScript />
        </div>
        <SpeedInsights />
      </body>
    </Html>
  );
}
