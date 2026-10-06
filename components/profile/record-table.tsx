'use client'

import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { db, type TableName } from '@/lib/db'

export interface Column<T> {
  header: string
  cell: (row: T) => React.ReactNode
}

export function RecordTable<T extends { id?: number }>({
  title,
  rows,
  columns,
  table,
  empty = 'موردی ثبت نشده است.',
  action,
}: {
  title: string
  rows: T[]
  columns: Column<T>[]
  table?: TableName
  empty?: string
  action?: React.ReactNode
}) {
  async function remove(id?: number) {
    if (!table || !id) return
    if (!window.confirm('این رکورد حذف شود؟')) return
    await db.table(table).delete(id)
    toast.success('رکورد حذف شد')
  }

  return (
    <section className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold">{title}</h3>
        {action}
      </div>
      {!rows.length ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <div className="-mx-4 overflow-x-auto px-4">
          <table className="w-full min-w-max text-sm">
            <thead>
              <tr className="border-b text-right text-xs text-muted-foreground">
                {columns.map((c) => (
                  <th key={c.header} scope="col" className="px-2 py-2 font-medium first:ps-0">
                    {c.header}
                  </th>
                ))}
                {table ? <th scope="col"><span className="sr-only">عملیات</span></th> : null}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b last:border-0">
                  {columns.map((c) => (
                    <td key={c.header} className="px-2 py-2.5 align-top first:ps-0">
                      {c.cell(row)}
                    </td>
                  ))}
                  {table ? (
                    <td className="w-8 py-2 text-left">
                      <button type="button" onClick={() => remove(row.id)} className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label="حذف رکورد">
                        <Trash2 className="size-4" aria-hidden />
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
