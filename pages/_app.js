import "@/styles/globals.css"
import "@/styles/dashboard.css"
import {SWRConfig} from 'swr'
import {CardProvider} from '@/context/CardContext'

function MyApp({Component, pageProps}) {
  return (
    <SWRConfig value={{
      fetcher: (url) => fetch(url).then(res => res.json()),
      onError: (error) => {
        console.error(error)
      }
    }}>
      <CardProvider>
        <Component {...pageProps} />
      </CardProvider>
    </SWRConfig>
  )
}
export default MyApp
