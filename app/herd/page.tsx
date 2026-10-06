import { Suspense } from 'react'
import type { Metadata } from 'next'
import { HerdList } from '@/components/herd-list'
import { LoadingBlock } from '@/components/flock-ui'

export const metadata: Metadata = { title: 'گله | گله‌یار' }

export default function HerdPage() {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <HerdList />
    </Suspense>
  )
}
