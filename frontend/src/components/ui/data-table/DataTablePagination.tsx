'use client';

import type { Table as DataTable } from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

import { useI18n } from '../../../i18n';
import { Button } from '../button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../select';

const PAGE_SIZES = [10, 20, 30, 40, 50] as const;

interface DataTablePaginationProps<TData> {
  table: DataTable<TData>;
}

export function DataTablePagination<TData>({ table }: DataTablePaginationProps<TData>) {
  const { t } = useI18n();
  const { pageIndex } = table.getState().pagination;
  const currentPage = pageIndex + 1;
  const pageCount = table.getPageCount();
  const selected = table.getFilteredSelectedRowModel().rows.length;
  const total = table.getFilteredRowModel().rows.length;

  return (
    <div className="flex flex-col gap-3 px-2 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-muted-foreground text-xs sm:text-sm">
        {t('ui.dataTable.selection').replace('{{selected}}', String(selected)).replace('{{total}}', String(total))}
      </div>
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-6">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground sm:text-sm">
            {t('ui.dataTable.pagination.rowsPerPage')}
          </span>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => table.setPageSize(Number(value))}
          >
            <SelectTrigger className="h-8 w-[72px]" data-testid="dataTable-rowsPerPage">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent align="end">
              {PAGE_SIZES.map((size) => (
                <SelectItem key={size} value={`${size}`}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground sm:text-sm">
          <span>{t('ui.dataTable.pagination.page')}</span>
          <span>
            {currentPage} {t('ui.dataTable.pagination.of')} {Math.max(pageCount, 1)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="hidden size-8 sm:flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            data-testid="dataTable-firstPage"
          >
            <ChevronsLeft className="size-4" />
            <span className="sr-only">{t('ui.dataTable.pagination.first')}</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            data-testid="dataTable-prevPage"
          >
            <ChevronLeft className="size-4" />
            <span className="sr-only">{t('ui.dataTable.pagination.previous')}</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            data-testid="dataTable-nextPage"
          >
            <ChevronRight className="size-4" />
            <span className="sr-only">{t('ui.dataTable.pagination.next')}</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="hidden size-8 sm:flex"
            onClick={() => table.setPageIndex(pageCount - 1)}
            disabled={!table.getCanNextPage()}
            data-testid="dataTable-lastPage"
          >
            <ChevronsRight className="size-4" />
            <span className="sr-only">{t('ui.dataTable.pagination.last')}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
