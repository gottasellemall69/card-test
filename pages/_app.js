import { useEffect, useRef } from 'react';

import Layout from "@/components/Layout";
import { CardProvider } from "@/context/CardContext";
import { MarketPriceProvider } from "@/context/MarketPriceContext";

import "@/styles/globals.css";
import "@/styles/hovercards.css";

function usePrevious( value ) {
  let ref = useRef();

  useEffect( () => {
    ref.current = value;
  }, [ value ] );

  return ref.current;
}

export default function App( { Component, pageProps, router } ) {
  let previousPathname = usePrevious( router.pathname );
  const getLayout = Component.getLayout ?? ( ( page ) => page );

  return getLayout(
    <CardProvider>
      <MarketPriceProvider>
        <Layout>

          <Component previousPathname={ previousPathname } { ...pageProps } />

        </Layout>
      </MarketPriceProvider>
    </CardProvider>
  );
};
