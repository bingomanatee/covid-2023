import '~/styles/globals.css'
import type { AppProps } from 'next/app'
import PageFrame from '~/components/PageFrame'

export default function App({ Component, pageProps }: AppProps) {
  return <PageFrame>
    <Component {...pageProps} />
  </PageFrame>
}
