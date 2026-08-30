import { useEffect, useState } from "react";

export function usePagination(items, pageSize = 10) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  useEffect(() => {
    setCurrentPage(1);
  }, [items]);
  const safePage = Math.min(currentPage, totalPages);

  const start = (safePage - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);

  return {
    pageItems,
    currentPage: safePage,
    totalPages,
    setPage: setCurrentPage,
  };
}