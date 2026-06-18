"use client";

import { useState } from "react";

/** Minimal shape of a server paginated response needed to drive the UI. */
interface PaginatedMeta {
  totalElements?: number;
  totalPages?: number;
}

/**
 * Server-side pagination state for endpoints that accept a 0-indexed `page`
 * and `size` (Spring pageable style). Pair the returned `tableProps()` with
 * the <TablePagination /> component:
 *
 *   const pg = useServerPagination();
 *   const { data } = useQuery({
 *     queryKey: [..., pg.page, pg.pageSize],
 *     queryFn: () => fetchThing({ page: pg.page, size: pg.pageSize }),
 *   });
 *   <TablePagination {...pg.tableProps(data)} />
 */
export function useServerPagination(defaultPageSize = 20) {
  // `page` is 0-indexed to match the API; the UI component is 1-indexed.
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  function tableProps(meta?: PaginatedMeta) {
    const total = meta?.totalElements ?? 0;
    const totalPages = Math.max(1, meta?.totalPages ?? 1);
    const from = total === 0 ? 0 : page * pageSize + 1;
    const to = Math.min((page + 1) * pageSize, total);

    return {
      page: page + 1,
      pageSize,
      totalPages,
      from,
      to,
      total,
      onPageChange: (p: number) => setPage(p - 1),
      onPageSizeChange: (size: number) => {
        setPageSize(size);
        setPage(0);
      },
    };
  }

  return { page, pageSize, setPage, setPageSize, tableProps };
}
