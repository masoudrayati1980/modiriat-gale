import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'گله‌یار — مدیریت گله گوسفند',
    short_name: 'گله‌یار',
    description: 'پرونده الکترونیکی و آمار دقیق هر گوسفند، حتی بدون اینترنت',
    start_url: '/',
    display: 'standalone',
    dir: 'rtl',
    lang: 'fa',
    background_color: '#f6f7f3',
    theme_color: '#2f5a43',
    id: '/',
    orientation: 'any',
    categories: ['productivity', 'business'],
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
