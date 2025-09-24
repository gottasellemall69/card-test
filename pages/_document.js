import { Html, Head, Main, NextScript } from 'next/document';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta name="description" content="Enter list of TCG cards, get data back" />
        <meta name="keywords" content="javascript,nextjs,price-tracker,trading-card-game,tailwindcss" />
        <meta charSet="UTF-8" />
      </Head>
      <body className="mx-auto ">
        <div className="transition-all mx-auto min-h-screen w-full">
          <Main />
        </div>
        <NextScript />
        <SpeedInsights />
      </body>
    </Html>
  );
}
