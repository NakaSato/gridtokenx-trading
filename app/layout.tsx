import type { Metadata } from 'next'
import './globals.css'
import NavBar from '@/components/NavBar'
import { ThemeProvider } from '@/components/ThemeProvider'
import Script from 'next/script'
import Connectionprovider from '@/contexts/connectionprovider'
import { AuthProvider } from '@/contexts/AuthProvider'
import { Toaster } from 'react-hot-toast'
import { SocketProvider } from '@/contexts/SocketContext'
import { generateStructuredData } from '@/lib/metadata'
import AuthModalManager from '@/components/auth/AuthModalManager'
import DevFaucet from '@/components/DevFaucet'
import { EmailVerificationBanner } from '@/components/EmailVerificationBanner'
import { WasmProvider } from '@/lib/wasm-provider'
import QueryProvider from '@/components/QueryProvider'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://app.gridtokenx.com'
const siteName = 'GridTokenX Trading'
const siteDescription =
  'Advanced P2P energy trading platform on Solana. Trade energy tokens, manage futures and options, earn yields, and participate in decentralized renewable energy markets.'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  applicationName: siteName,
  authors: [
    { name: 'GridTokenX', url: 'https://gridtokenx.com' },
  ],
  generator: 'Next.js',
  keywords: [
    'GridTokenX',
    'energy trading',
    'P2P energy',
    'Solana trading',
    'DeFi',
    'decentralized energy',
    'renewable energy',
    'blockchain trading',
    'crypto trading',
    'energy tokens',
    'futures trading',
    'options trading',
    'yield farming',
    'energy marketplace',
    'web3',
    'Solana DeFi',
    'energy derivatives',
    'green energy',
    'sustainable trading',
    'carbon credits',
  ],
  referrer: 'origin-when-cross-origin',
  creator: 'GridTokenX',
  publisher: 'GridTokenX',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName,
    title: siteName,
    description: siteDescription,
    images: [
      {
        url: '/images/logo-color.png',
        width: 1200,
        height: 630,
        alt: 'GridTokenX Trading Platform',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@GridTokenX',
    creator: '@GridTokenX',
    title: siteName,
    description: siteDescription,
    images: ['/images/logo-color.png'],
  },
  icons: {
    icon: [
      { url: '/images/logo-color.png', sizes: '32x32', type: 'image/png' },
      { url: '/images/logo-color.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/images/logo-color.png',
    apple: [
      { url: '/images/logo-color.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/images/logo-color.png',
      },
    ],
  },
  manifest: '/manifest.json',
  category: 'finance',
  classification: 'DeFi Trading Platform',
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'format-detection': 'telephone=no',
    'mobile-web-app-capable': 'yes',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const structuredData = generateStructuredData()

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className={`antialiased`} suppressHydrationWarning>
        <ThemeProvider attribute="data-theme" defaultTheme="dark-purple">
          <QueryProvider>
            <Connectionprovider>
              <AuthProvider>
                <SocketProvider>
                  <WasmProvider>
                    <AuthModalManager />
                    <DevFaucet />
                    <EmailVerificationBanner />
                    <div className="mx-auto flex h-screen flex-col px-6">
                      <NavBar></NavBar>
                      <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
                    </div>
                  </WasmProvider>
                </SocketProvider>
              </AuthProvider>
            </Connectionprovider>
          </QueryProvider>
        </ThemeProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#1a1a1a',
              color: '#fff',
              border: '1px solid #333',
            },
          }}
        />
        <Script
          src="/charting_library/charting_library.standalone.js"
          strategy="beforeInteractive"
        />
        <Script
          src="/datafeeds/udf/dist/bundle.js"
          strategy="beforeInteractive"
        />
      </body>
    </html>
  )
}
