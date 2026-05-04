import { ReactNode } from "react";
import { Card } from "@/components/ui/card";

interface Column<T> {
  key: string;
  header: string;
  align?: "left" | "center" | "right";
  render: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyState?: ReactNode;
}

export function DataTable<T extends { id: string | number }>({ columns, data, emptyState }: DataTableProps<T>) {
  return (
    <div className="space-y-4">
      <Card className="mrpsl-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="mrpsl-table-header">
              <tr>
                {columns.map((col, idx) => (
                  <th key={idx} className={`px-4 py-3 text-${col.align || 'left'}`}>
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.length > 0 ? (
                data.map((row) => (
                  <tr key={row.id} className="mrpsl-table-row">
                    {columns.map((col, idx) => (
                      <td key={idx} className={`px-4 py-3 text-${col.align || 'left'}`}>
                        {col.render(row)}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center text-muted-foreground text-sm">
                    {emptyState || "No records found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      
      {data.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Showing 1–{data.length} of {data.length} records
        </div>
      )}
    </div>
  );
}