import { Suspense } from 'react'
import type { Metadata } from 'next'
import { PensManager } from '@/components/pens-manager'
import { LoadingBlock } from '@/components/flock-ui'

export const metadata: Metadata = { title: 'جایگاه‌ها | گله‌یار' }

export default function Page() {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <PensManager />
    </Suspense>
  )
}
