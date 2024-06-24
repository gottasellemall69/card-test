import "@/styles/globals.css"
import "@/styles/dashboard.css"
import "@/styles/gridcards.css"

import {CardProvider} from '@/context/CardContext'

function MyApp({Component, pageProps}) {
  return (
    <CardProvider>
      <Component {...pageProps} />
    </CardProvider>
  )
}
export default MyApp
