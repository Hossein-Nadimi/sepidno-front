"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * ResponsiveTable — renders a traditional <table> on desktop (sm+ screens),
 * and a card-based layout on mobile (< 640px).
 *
 * Usage:
 * <ResponsiveTable
 *   columns={[
 *     { key: "name", label: "نام", className: "font-medium" },
 *     { key: "phone", label: "موبایل" },
 *     { key: "actions", label: "", className: "text-left" },
 *   ]}
 *   data={[
 *     { id: "1", name: "علی", phone: "0912...", actions: <Button>...</Button> },
 *   ]}
 *   renderRow={(row) => row}  // optional: customize cell rendering
 *   getKey={(row) => row.id}
 * />
 *
 * On mobile, each row becomes a card with the column label shown above the value.
 * On desktop, a normal <table> is rendered.
 */

export interface Column<T> {
  key: string
  label: string
  className?: string
  /** Whether to hide this column on mobile (e.g. less important info) */
  hideOnMobile?: boolean
  /** Render function for the cell content */
  render?: (row: T) => React.ReactNode
}

export function ResponsiveTable<T extends Record<string, unknown>>({
  columns,
  data,
  getKey,
  emptyState,
  className,
}: {
  columns: Column<T>[]
  data: T[]
  getKey: (row: T) => string | number
  emptyState?: React.ReactNode
  className?: string
}) {
  if (!data || data.length === 0) {
    return <>{emptyState}</>
  }

  return (
    <>
      {/* Desktop: traditional table (hidden on mobile) */}
      <div className={cn("hidden sm:block overflow-x-auto", className)}>
        <table className="w-full caption-bottom text-sm">
          <thead>
            <tr className="border-b">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "h-12 px-4 text-right align-middle font-medium text-muted-foreground",
                    col.className,
                  )}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={getKey(row)} className="border-b transition-colors hover:bg-muted/50">
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn("p-4 align-middle", col.className)}
                  >
                    {col.render ? col.render(row) : String(row[col.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: card layout (hidden on desktop) */}
      <div className="sm:hidden space-y-2">
        {data.map((row) => (
          <div
            key={getKey(row)}
            className="rounded-lg border p-3 space-y-2"
          >
            {columns
              .filter((col) => !col.hideOnMobile)
              .map((col) => (
                <div
                  key={col.key}
                  className="flex items-center justify-between gap-2"
                >
                  {col.label && (
                    <span className="text-xs font-medium text-muted-foreground shrink-0">
                      {col.label}
                    </span>
                  )}
                  <span className={cn("text-sm text-right min-w-0 flex-1", col.className)}>
                    {col.render ? col.render(row) : String(row[col.key] ?? "")}
                  </span>
                </div>
              ))}
          </div>
        ))}
      </div>
    </>
  )
}
