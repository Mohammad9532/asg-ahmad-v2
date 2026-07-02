import React, { useRef } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';

interface ReportTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  virtualize?: boolean;
  onRowClick?: (row: TData) => void;
}

export function ReportTable<TData, TValue>({
  columns,
  data,
  isLoading,
  virtualize = false,
  onRowClick
}: ReportTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const parentRef = useRef<HTMLDivElement>(null);

  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 45,
    overscan: 10,
  });

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading report data...</div>;
  }

  if (data.length === 0) {
    return <div className="p-8 text-center text-muted-foreground bg-card border rounded-lg">No data found for the selected filters.</div>;
  }

  return (
    <div 
      ref={parentRef} 
      className={`bg-card border rounded-lg overflow-auto ${virtualize ? 'max-h-[600px]' : ''}`}
    >
      <table className="w-full text-sm text-left">
        <thead className="bg-muted text-muted-foreground sticky top-0 z-10 shadow-sm">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th 
                  key={header.id} 
                  className={`px-4 py-3 font-medium whitespace-nowrap select-none ${header.column.getCanSort() ? 'cursor-pointer hover:bg-muted/80' : ''}`}
                  onClick={header.column.getToggleSortingHandler()}
                  style={{ width: header.getSize() }}
                >
                  <div className="flex items-center gap-1">
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                    {{
                      asc: ' ↑',
                      desc: ' ↓',
                    }[header.column.getIsSorted() as string] ?? null}
                  </div>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y relative">
          {virtualize ? (
            <>
              <tr style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
                <td colSpan={columns.length} />
              </tr>
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const row = rows[virtualRow.index];
                return (
                  <tr
                    key={row.id}
                    className={`absolute w-full flex ${onRowClick ? 'cursor-pointer hover:bg-muted/50 transition-colors' : 'hover:bg-muted/30'}`}
                    style={{
                      top: 0,
                      left: 0,
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    onClick={() => onRowClick && onRowClick(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td 
                        key={cell.id} 
                        className="px-4 py-3 flex items-center"
                        style={{ width: cell.column.getSize() }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </>
          ) : (
            rows.map((row) => (
              <tr 
                key={row.id} 
                className={`${onRowClick ? 'cursor-pointer hover:bg-muted/50 transition-colors' : 'hover:bg-muted/30'}`}
                onClick={() => onRowClick && onRowClick(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
