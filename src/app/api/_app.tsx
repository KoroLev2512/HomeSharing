import type { AppProps } from 'next/app'
import {ServerGuard} from "@/guards/ServerGuard";
import AppWrapper from "@/widgets/Wrappers/AppWrapper";

import '@/styles/globals.scss'
import '@/styles/tags.scss'

function App({ Component, pageProps }: AppProps) {
    return (
        <ServerGuard pageProps={pageProps}>
            <AppWrapper>
                <Component {...pageProps} />
            </AppWrapper>
        </ServerGuard>
    )
}

export default App;