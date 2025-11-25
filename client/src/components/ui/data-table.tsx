import React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type ColumnDef<T> = {
  /** Optional key for React; DataTable will prefer getRowKey for rows */
  id?: string;
  header: React.ReactNode | ((opts: { column: ColumnDef<T> }) => React.ReactNode);
  cell: (row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  align?: "left" | "center" | "right";
};

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  getRowKey: (row: T, index: number) => string;
  empty?: React.ReactNode;
  className?: string;
  headerClassName?: string;
  rowClassName?: string | ((row: T, index: number) => string | undefined);
}

export function DataTable<T>({
  data,
  columns,
  getRowKey,
  empty,
  className,
  headerClassName,
  rowClassName,
}: DataTableProps<T>) {
  const hasData = data && data.length > 0;
  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <Table>
        <TableHeader>
          <TableRow className={cn("bg-muted/50", headerClassName)}>
            {columns.map((col, idx) => (
              <TableHead
                key={col.id ?? idx}
                className={cn(
                  "uppercase text-xs font-medium text-muted-foreground",
                  col.headerClassName,
                  col.align === "center" && "text-center",
                  col.align === "right" && "text-right"
                )}
              >
                {typeof col.header === "function" ? col.header({ column: col }) : col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {!hasData ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="py-12 text-center text-muted-foreground">
                {empty ?? "No data"}
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, rIdx) => (
              <TableRow key={getRowKey(row, rIdx)} className={typeof rowClassName === 'function' ? rowClassName(row, rIdx) : rowClassName}>
                {columns.map((col, cIdx) => (
                  <TableCell
                    key={(col.id ?? cIdx) + "_" + rIdx}
                    className={cn(
                      col.className,
                      col.align === "center" && "text-center",
                      col.align === "right" && "text-right"
                    )}
                  >
                    {col.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
