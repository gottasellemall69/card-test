import "@/styles/globals.css";
import "@/styles/hovercards.css";
import "@/styles/index.css";

import Layout from "@/components/Layout";
import { CardProvider } from "@/context/CardContext";
import { MarketPriceProvider } from "@/context/MarketPriceContext";

function MyApp( { Component, pageProps } ) {
  return (
    <Layout>
      <CardProvider>
        <MarketPriceProvider>
          <Component { ...pageProps } />
        </MarketPriceProvider>
      </CardProvider>
    </Layout>
  );
}

export default MyApp;
