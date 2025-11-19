'use client';

import type { ReactNode } from 'react';
import type { Table as DataTable } from '@tanstack/react-table';

import { useI18n } from '../../../i18n';
import Input from '../input';
import { DataTableViewOptions } from './DataTableViewOptions';

interface DataTableToolbarProps<TData> {
  table: DataTable<TData>;
  filterColumnId?: string;
  placeholderKey?: string;
  children?: ReactNode;
}

const DEFAULT_FILTER_COLUMN = 'name';

export function DataTableToolbar<TData>({
  table,
  filterColumnId = DEFAULT_FILTER_COLUMN,
  placeholderKey = 'ui.dataTable.filter.placeholder',
  children,
}: DataTableToolbarProps<TData>) {
  const { t } = useI18n();
  const filterColumn = table.getColumn(filterColumnId);
  const currentFilterValue = (filterColumn?.getFilterValue() as string) ?? '';

  return (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
      {filterColumn ? (
        <Input
          value={currentFilterValue}
          onChange={(event) => filterColumn.setFilterValue(event.target.value)}
          placeholder={t(placeholderKey)}
          className="max-w-xs"
          data-testid="dataTable-filter"
        />
      ) : null}
      <div className="flex flex-1 items-center justify-between gap-3 sm:justify-end">
        {children}
        <DataTableViewOptions table={table} />
      </div>
    </div>
  );
}
