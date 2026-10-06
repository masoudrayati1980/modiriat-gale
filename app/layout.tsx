import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Vazirmatn } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { AppShell } from '@/components/app-shell'
import { ServiceWorkerRegister } from '@/components/sw-register'
import './globals.css'

const _vazirmatn = Vazirmatn({ subsets: ['arabic', 'latin'] })

export const metadata: Metadata = {
  title: 'گله‌یار — پرونده الکترونیکی گوسفند',
  description:
    'سامانه آفلاین مدیریت گله گوسفند: شناسنامه، وزن، BCS، درمان، واکسن، تولیدمثل، زایش، شجره‌نامه و گزارش‌ها.',
  generator: 'v0.app',
  applicationName: 'گله‌یار',
  appleWebApp: { capable: true, title: 'گله‌یار', statusBarStyle: 'default' },
  icons: {
    icon: '/icon-512.png',
    apple: '/icon-512.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#2f5a43',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fa" dir="rtl" className="bg-background">
      <body className="font-sans antialiased">
        <AppShell>{children}</AppShell>
        <Toaster position="top-center" richColors dir="rtl" />
        <ServiceWorkerRegister />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
