import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { auth } from '@/auth'
import { AuthSessionProvider } from '@/components/auth/session-provider'
import { I18nProvider } from '@/components/i18n-provider'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Excelso Pulse",
  description:
    "Command center for the Excelso ecosystem: aggregate health and business signals from product backends, store encrypted secrets in MongoDB, and monitor everything in one dashboard.",
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await auth()

  return (
    <html lang="en" className="dark bg-background" suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <I18nProvider>
          <AuthSessionProvider session={session}>
            {children}
          </AuthSessionProvider>
        </I18nProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
