import SideNav from "@/components/Navigation/SideNav";
import { Head, Html, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html className="h-full bg-black">

      <Head>
        {/*<meta
          httpEquiv="Content-Security-Policy"
          content="
              script-src 'self' 'unsafe-inline' 'unsafe-eval' vercel.app;
              style-src 'self' 'unsafe-inline' vercel.app;
              img-src 'self' data:;
              object-src 'none';
            "
        />*/}
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
      </body>
    </Html>
  );
}
