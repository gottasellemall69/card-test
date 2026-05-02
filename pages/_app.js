import { useEffect, useRef } from 'react';
import NextApp from "next/app";

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

  return getLayout(
    <CardProvider>
      <MarketPriceProvider>
        <Component previousPathname={ previousPathname } { ...pageProps } />
      </MarketPriceProvider>
    </CardProvider>
  );
};

const getNonceFromHeaders = ( headers ) => {
  const nonceHeader = headers?.[ "x-nonce" ];
  return Array.isArray( nonceHeader ) ? nonceHeader[ 0 ] : nonceHeader;
};

App.getInitialProps = async ( appContext ) => {
  const appProps = await NextApp.getInitialProps( appContext );
  const nonce = getNonceFromHeaders( appContext.ctx.req?.headers );

  return {
    ...appProps,
    pageProps: {
      ...appProps.pageProps,
      ...( nonce ? { nonce } : {} ),
    },
  };
};
