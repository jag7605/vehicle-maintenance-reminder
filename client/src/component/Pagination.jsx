import "./Pagination.css";

// ---------------------------------------------------------------------------
// Generic page-number pagination control.
//
// Props:
//   currentPage  — 1-indexed current page
//   totalPages   — total number of pages (>= 1)
//   onPageChange — (page: number) => void
//
// Renders nothing if there's only one page — callers don't need to guard
// against that themselves.
//
// For >7 pages, shows first, last, current ±1, and "…" gaps instead of
// every single page number, so it doesn't grow unbounded with large lists.
// ---------------------------------------------------------------------------
function getPageNumbers(currentPage, totalPages) {
  const pages = [];

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
    return pages;
  }

  pages.push(1);

  if (currentPage > 3) pages.push("...");

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (currentPage < totalPages - 2) pages.push("...");

  pages.push(totalPages);

  return pages;
}

function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pageNumbers = getPageNumbers(currentPage, totalPages);

  return (
    <nav className="pagination-row" aria-label="Pagination">
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Previous
      </button>

      {pageNumbers.map((page, i) =>
        page === "..." ? (
          <span key={`ellipsis-${i}`} className="pagination-ellipsis">…</span>
        ) : (
          <button
            key={page}
            type="button"
            className={`btn btn-sm ${page === currentPage ? "btn-primary" : "btn-secondary"}`}
            onClick={() => onPageChange(page)}
            disabled={page === currentPage}
            aria-current={page === currentPage ? "page" : undefined}
          >
            {page}
          </button>
        )
      )}

      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next
      </button>
    </nav>
  );
}

export default Pagination;