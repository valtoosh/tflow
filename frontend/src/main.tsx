import React from 'react'
import ReactDOM from 'react-dom/client'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider, darkTheme, lightTheme } from '@rainbow-me/rainbowkit'
import '@rainbow-me/rainbowkit/styles.css'
import App from './App'
import './index.css'
import { config } from './utils/wagmi'
import { ThemeProvider, useTheme } from './hooks/useTheme'

const queryClient = new QueryClient()

// RainbowKit theme wrapper that syncs with our theme
function RainbowKitThemeWrapper({ children }: { children: React.ReactNode }) {
  const { isDark } = useTheme()

  return (
    <RainbowKitProvider
      theme={isDark
        ? darkTheme({
          accentColor: '#F2541B',
          accentColorForeground: '#fff',
          borderRadius: 'medium',
        })
        : lightTheme({
          accentColor: '#F2541B',
          accentColorForeground: '#fff',
          borderRadius: 'medium',
        })
      }
    >
      {children}
    </RainbowKitProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitThemeWrapper>
            <App />
          </RainbowKitThemeWrapper>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
