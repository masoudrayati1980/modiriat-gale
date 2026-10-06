import { Suspense } from 'react'
import type { Metadata } from 'next'
import { Reports } from '@/components/reports'
import { LoadingBlock } from '@/components/flock-ui'

export const metadata: Metadata = { title: 'گزارش‌ها | گله‌یار' }

export default function Page() {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <Reports />
    </Suspense>
  )
}
