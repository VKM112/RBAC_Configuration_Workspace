import type { AppProps } from 'next/app'
import '../index.css'

const App = ({ Component, pageProps }: AppProps) => <Component {...pageProps} />

export default App
