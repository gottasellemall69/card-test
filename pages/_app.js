import "@/styles/globals.css";
import "@/styles/hovercards.css";

import Layout from "@/components/Layout";
import { CardProvider } from "@/context/CardContext";
import { MarketPriceProvider } from "@/context/MarketPriceContext";

export default function MyApp( { Component, pageProps } ) {
  const getLayout = Component.getLayout ?? ( ( page ) => page );
  return getLayout(
    <CardProvider>
      <MarketPriceProvider>
        <Layout>

          <Component { ...pageProps } />

        </Layout>
      </MarketPriceProvider>
    </CardProvider>
  );
};
