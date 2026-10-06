'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { AnimalForm } from '@/components/animal-form'
import { EmptyState, LoadingBlock, PageHeader } from '@/components/flock-ui'
import { AnimalProfile } from '@/components/profile/animal-profile'
import { useFlock } from '@/lib/flock'

function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground print:hidden">
      <ChevronRight className="size-4" aria-hidden />
      {label}
    </Link>
  )
}

function useAnimal() {
  const data = useFlock()
  const id = Number(useSearchParams().get('id'))
  const animal = data?.animals.find((a) => a.id === id)
  return { data, animal }
}

function NotFound() {
  return <EmptyState title="دام پیدا نشد" description="ممکن است این پرونده حذف شده باشد." action={<Link href="/herd" className="text-sm font-medium text-primary">بازگشت به گله</Link>} />
}

export function AnimalViewPage() {
  const { data, animal } = useAnimal()
  if (!data) return <LoadingBlock />
  if (!animal) return <NotFound />
  return (
    <div className="mx-auto max-w-6xl">
      <BackLink href="/herd" label="گله" />
      <AnimalProfile data={data} animal={animal} />
    </div>
  )
}

export function AnimalEditPage() {
  const { data, animal } = useAnimal()
  if (!data) return <LoadingBlock />
  if (!animal) return <NotFound />
  return (
    <div className="mx-auto max-w-4xl">
      <BackLink href={`/animals/view?id=${animal.id}`} label="پرونده دام" />
      <PageHeader title="ویرایش شناسنامه" description={`گوشواره ${animal.earTag}`} />
      <AnimalForm key={animal.id} data={data} existing={animal} />
    </div>
  )
}

export function AnimalNewPage() {
  const data = useFlock()
  if (!data) return <LoadingBlock />
  return (
    <div className="mx-auto max-w-4xl">
      <BackLink href="/herd" label="گله" />
      <PageHeader title="ثبت دام جدید" description="شناسنامه دام را تکمیل کنید. بقیه سوابق از داخل پرونده ثبت می‌شود." />
      <AnimalForm data={data} />
    </div>
  )
}
