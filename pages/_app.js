import { CardProvider } from "@/context/CardContext";
import "@/styles/globals.css";
import "@/styles/gridcards.css";

function MyApp({ Component, pageProps }) {
  return (
    <CardProvider>
      <Component {...pageProps} />
    </CardProvider>
  );
}
export default MyApp;
