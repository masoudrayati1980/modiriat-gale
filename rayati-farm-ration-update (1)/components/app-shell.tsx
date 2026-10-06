'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Rows3, ChartColumn, Warehouse, DatabaseBackup, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/', label: 'داشبورد', icon: LayoutDashboard },
  { href: '/herd', label: 'گله', icon: Rows3 },
  { href: '/reports', label: 'گزارش‌ها', icon: ChartColumn },
  { href: '/pens', label: 'جایگاه‌ها', icon: Warehouse },
  { href: '/backup', label: 'پشتیبان', icon: DatabaseBackup },
]

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  if (href === '/herd') return pathname.startsWith('/herd') || pathname.startsWith('/animals')
  return pathname.startsWith(href)
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-dvh">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-6 bg-sidebar p-5 text-sidebar-foreground lg:flex">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/icon-512.png" alt="" width={40} height={40} className="rounded-lg" />
          <div className="flex flex-col">
            <span className="text-lg font-bold leading-tight">گله‌یار</span>
            <span className="text-xs text-sidebar-foreground/70">پرونده الکترونیکی دام</span>
          </div>
        </Link>
        <Link
          href="/animals/new"
          className="flex items-center justify-center gap-2 rounded-lg bg-sidebar-primary px-4 py-2.5 text-sm font-semibold text-sidebar-primary-foreground transition-opacity hover:opacity-90"
        >
          <Plus className="size-4" aria-hidden />
          ثبت دام جدید
        </Link>
        <nav aria-label="منوی اصلی" className="flex flex-col gap-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(pathname, href) ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-sidebar-accent',
                isActive(pathname, href) && 'bg-sidebar-accent font-semibold',
              )}
            >
              <Icon className="size-5" aria-hidden />
              {label}
            </Link>
          ))}
        </nav>
        <p className="mt-auto text-xs leading-relaxed text-sidebar-foreground/60">
          اطلاعات روی همین دستگاه ذخیره می‌شود و بدون اینترنت هم کار می‌کند. به‌طور منظم پشتیبان بگیرید.
        </p>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-card/95 px-4 py-3 backdrop-blur lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/icon-512.png" alt="" width={32} height={32} className="rounded-md" />
            <span className="font-bold">گله‌یار</span>
          </Link>
          <Link
            href="/animals/new"
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
          >
            <Plus className="size-4" aria-hidden />
            دام جدید
          </Link>
        </header>

        <main className="flex-1 px-4 pb-28 pt-5 md:px-8 lg:pb-10 lg:pt-8">{children}</main>

        <nav
          aria-label="منوی پایین"
          className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t bg-card pb-[env(safe-area-inset-bottom)] lg:hidden"
        >
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(pathname, href) ? 'page' : undefined}
              className={cn(
                'flex flex-col items-center gap-1 py-2.5 text-xs text-muted-foreground',
                isActive(pathname, href) && 'font-semibold text-primary',
              )}
            >
              <Icon className="size-5" aria-hidden />
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}
