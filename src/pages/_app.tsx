import type { AppProps } from 'next/app'
import {ServerGuard} from "@/guards/ServerGuard";
import AppWrapper from "@/ui/Wrappers/AppWrapper";

import '../../styles/globals.scss'
import '../../styles/tags.scss'

function App({ Component, pageProps }: AppProps) {
    return (
        <ServerGuard>
            <AppWrapper>
                <Component {...pageProps} />
            </AppWrapper>
        </ServerGuard>
    )
}

export default App;