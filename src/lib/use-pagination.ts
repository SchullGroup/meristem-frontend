import { useState, useMemo } from "react";

export const PAGE_SIZE_OPTIONS = [10, 15, 20, 25, 50];

export function usePagination<T>(data: T[], defaultPageSize = 10) {
  const [page, setPageRaw] = useState(1);
  const [pageSize, setPageSizeRaw] = useState(defaultPageSize);

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const paged = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, safePage, pageSize]);

  const from = data.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to   = Math.min(safePage * pageSize, data.length);

  function setPage(p: number) {
    setPageRaw(Math.max(1, Math.min(p, totalPages)));
  }

  function setPageSize(size: number) {
    setPageSizeRaw(size);
    setPageRaw(1);
  }

  return { page: safePage, pageSize, totalPages, paged, from, to, total: data.length, setPage, setPageSize };
}
