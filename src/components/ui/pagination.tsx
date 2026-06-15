interface PaginationProps {
  page: number
  lastPage: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, lastPage, onPageChange }: PaginationProps) {
  if (lastPage <= 1) return null

  return (
    <div className="flex items-center gap-2 justify-end">
      <button
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="px-3 py-1.5 text-sm border border-border rounded-lg disabled:opacity-40 hover:bg-muted transition-colors"
      >
        Sebelumnya
      </button>
      <span className="text-sm text-muted-foreground">{page} / {lastPage}</span>
      <button
        onClick={() => onPageChange(Math.min(lastPage, page + 1))}
        disabled={page === lastPage}
        className="px-3 py-1.5 text-sm border border-border rounded-lg disabled:opacity-40 hover:bg-muted transition-colors"
      >
        Selanjutnya
      </button>
    </div>
  )
}
