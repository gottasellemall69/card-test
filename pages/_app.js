import "@/styles/globals.css";
import {CardProvider} from '../context/CardContext';

function MyApp({Component,pageProps}) {
  return (
    <CardProvider>
      <Component {...pageProps} />
    </CardProvider>
  );
}
export default MyApp;
