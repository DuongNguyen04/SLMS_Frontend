export default function Pagination({ pageData, onPageChange }) {
  const currentPage = pageData?.number ?? 0
  const totalPages = pageData?.totalPages ?? 0

  if (totalPages <= 1) {
    return null
  }

  const previousDisabled = currentPage <= 0
  const nextDisabled = currentPage + 1 >= totalPages

  return (
    <div className="pagination-wrap">
      <button
        type="button"
        className="btn btn-ghost"
        disabled={previousDisabled}
        onClick={() => onPageChange(currentPage - 1)}
      >
        Previous
      </button>
      <span className="pagination-meta">
        Page {currentPage + 1} / {totalPages}
      </span>
      <button
        type="button"
        className="btn btn-ghost"
        disabled={nextDisabled}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Next
      </button>
    </div>
  )
}
