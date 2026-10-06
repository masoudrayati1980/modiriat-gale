'use client'

import { useRef, useState, useSyncExternalStore } from 'react'
import { Download, Monitor, Smartphone, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { LoadingBlock, PageHeader } from '@/components/flock-ui'
import { clearAll, exportBackup, importBackup } from '@/lib/export'
import { fa, formatJalaliLong } from '@/lib/date'
import { useFlock } from '@/lib/flock'
import { seedDemo } from '@/lib/seed'

const subscribe = (cb: () => void) => {
  window.addEventListener('storage', cb)
  return () => window.removeEventListener('storage', cb)
}

export function BackupPanel() {
  const data = useFlock()
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [, force] = useState(0)
  const lastBackup = useSyncExternalStore(subscribe, () => localStorage.getItem('galleyar:lastBackup'), () => null)

  if (!data) return <LoadingBlock />

  const totalRecords = Object.values(data).reduce((s, rows) => s + rows.length, 0)

  async function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!window.confirm('با بازیابی، تمام اطلاعات فعلی این دستگاه با فایل پشتیبان جایگزین می‌شود. ادامه می‌دهید؟')) return
    setBusy(true)
    try {
      await importBackup(file)
      toast.success('اطلاعات با موفقیت بازیابی شد')
    } catch {
      toast.error('فایل پشتیبان معتبر نیست')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="پشتیبان‌گیری و انتقال اطلاعات" description="اطلاعات روی همین دستگاه ذخیره می‌شود. با فایل پشتیبان می‌توانید آن را بین گوشی و کامپیوتر منتقل کنید." />

      <section className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-xl border bg-card p-5">
          <h2 className="font-semibold">گرفتن پشتیبان</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {fa(data.animals.length)} دام و {fa(totalRecords)} رکورد. آخرین پشتیبان: {lastBackup ? formatJalaliLong(lastBackup.slice(0, 10)) : 'هرگز'}
          </p>
          <Button
            size="lg"
            onClick={async () => {
              await exportBackup()
              force((x) => x + 1)
              toast.success('فایل پشتیبان دانلود شد')
            }}
          >
            <Download aria-hidden /> دانلود فایل پشتیبان
          </Button>
          <p className="text-xs leading-relaxed text-muted-foreground">پیشنهاد: هر هفته یک پشتیبان بگیرید و در گوگل‌درایو، تلگرام یا فلش نگه دارید.</p>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border bg-card p-5">
          <h2 className="font-semibold">بازیابی از فایل</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">فایل پشتیبان گرفته‌شده از گوشی یا کامپیوتر دیگر را انتخاب کنید.</p>
          <Button size="lg" variant="outline" disabled={busy} onClick={() => fileRef.current?.click()}>
            <Upload aria-hidden /> {busy ? 'در حال بازیابی…' : 'انتخاب فایل پشتیبان'}
          </Button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" onChange={onImport} aria-label="فایل پشتیبان" />
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-xl border bg-card p-5">
        <h2 className="font-semibold">نصب به‌عنوان برنامه (بدون اینترنت)</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex gap-3">
            <Smartphone className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
            <p className="text-sm leading-relaxed">
              <strong>اندروید:</strong> سایت را در Chrome باز کنید، از منوی سه‌نقطه گزینه «نصب برنامه» یا «افزودن به صفحه اصلی» را بزنید. پس از نصب، برنامه بدون اینترنت هم باز می‌شود.
            </p>
          </div>
          <div className="flex gap-3">
            <Monitor className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
            <p className="text-sm leading-relaxed">
              <strong>ویندوز:</strong> در Chrome یا Edge روی آیکون نصب در نوار آدرس کلیک کنید. برنامه مانند یک نرم‌افزار ویندوزی در منوی استارت قرار می‌گیرد.
            </p>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-card p-5">
        <h2 className="font-semibold">ابزارها</h2>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={async () => {
              await seedDemo()
              toast.success('گله نمونه اضافه شد')
            }}
          >
            افزودن گله نمونه
          </Button>
          <Button
            variant="destructive"
            onClick={async () => {
              if (!window.confirm('تمام اطلاعات این دستگاه پاک شود؟ این کار قابل بازگشت نیست.')) return
              if (!window.confirm('مطمئن هستید؟ پیشنهاد می‌شود قبلش پشتیبان بگیرید.')) return
              await clearAll()
              toast.success('همه اطلاعات پاک شد')
            }}
          >
            پاک کردن همه اطلاعات
          </Button>
        </div>
      </section>
    </div>
  )
}
