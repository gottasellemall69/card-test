import { useEffect, useRef } from 'react';
import { SpeedInsights } from "@vercel/speed-insights/next";

import Layout from "@/components/Layout";
import { CardProvider } from "@/context/CardContext";
import { MarketPriceProvider } from "@/context/MarketPriceContext";

import "@/styles/globals.css";

function usePrevious( value ) {
  let ref = useRef();

  useEffect( () => {
    ref.current = value;
  }, [ value ] );

  return ref.current;
}

export default function App( { Component, pageProps, router } ) {
  let previousPathname = usePrevious( router.pathname );
  const getLayout = Component.getLayout ?? ( ( page ) => <Layout>{ page }</Layout> );
  const shouldRenderSpeedInsights =
    process.env.NEXT_PUBLIC_VERCEL_ENV === "production" ||
    process.env.NEXT_PUBLIC_ENABLE_SPEED_INSIGHTS === "true";

  return getLayout(
    <CardProvider>
      <MarketPriceProvider>
        <Component previousPathname={ previousPathname } { ...pageProps } />
        { shouldRenderSpeedInsights ? <SpeedInsights /> : null }
      </MarketPriceProvider>
    </CardProvider>
  );
};
