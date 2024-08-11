import SideNav from "@/components/Navigation/SideNav";
import { Head, Html, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta
          httpEquiv="Content-Security-Policy"
          content="
              script-src 'self' 'unsafe-inline' 'unsafe-eval' vercel.app;
              style-src 'self' 'unsafe-inline' vercel.app;
              img-src 'self' data:;
              object-src 'none';
            "
        />
      </Head>
      <body className="mx-auto min-h-full">
        <div>
          <SideNav />
          <div className="w-full mx-auto lg:w-[calc(100%-256px)] lg:ml-64 min-h-screen transition-all main">
            <Main />
          </div>
          <NextScript />
        </div>
      </body>
    </Html>
  );
}
