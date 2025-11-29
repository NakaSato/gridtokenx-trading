'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
}

export default function Pagination({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
}: PaginationProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage)

  const getPageNumbers = () => {
    const pageNumbers = []
    const maxVisiblePages = 5
    const sidePages = Math.floor((maxVisiblePages - 3) / 2)

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push({ number: i, ellipsis: false })
      }
    } else {
      pageNumbers.push({ number: 1, ellipsis: false })

      let start = Math.max(2, currentPage - sidePages)
      let end = Math.min(totalPages - 1, currentPage + sidePages)

      if (currentPage <= sidePages + 3) {
        end = maxVisiblePages - 1
      } else if (currentPage >= totalPages - (sidePages + 2)) {
        start = totalPages - (maxVisiblePages - 2)
      }

      if (start > 2) {
        pageNumbers.push({ number: -1, ellipsis: true })
      }

      for (let i = start; i <= end; i++) {
        pageNumbers.push({ number: i, ellipsis: false })
      }
      if (end < totalPages - 1) {
        pageNumbers.push({ number: -1, ellipsis: true })
      }

      pageNumbers.push({ number: totalPages, ellipsis: false })
    }

    return pageNumbers
  }

  return (
    <div className="mt-auto flex w-full items-center justify-between gap-5 pt-1">
      <button
        className="hover:bg-secondary/80 flex h-9 w-9 items-center rounded-sm bg-secondary p-2 disabled:cursor-not-allowed disabled:opacity-50"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-fit w-fit text-secondary-foreground" />
      </button>
      <div className="space-x-2">
        {getPageNumbers().map((item, index) =>
          item.ellipsis ? (
            <span key={`ellipsis-${index}`} className="px-2">
              ...
            </span>
          ) : (
            <button
              key={item.number}
              className={`h-9 w-9 rounded-sm p-[6px] ${
                currentPage === item.number
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary'
              }`}
              onClick={() => onPageChange(item.number)}
            >
              {item.number}
            </button>
          )
        )}
      </div>
      <button
        className="hover:bg-secondary/80 flex h-9 w-9 items-center rounded-sm bg-secondary p-2 disabled:cursor-not-allowed disabled:opacity-50"
        onClick={() => onPageChange(Math.max(1, currentPage + 1))}
        disabled={currentPage === totalPages}
      >
        <ChevronRight className="h-fit w-fit text-secondary-foreground" />
      </button>
    </div>
  )
}
