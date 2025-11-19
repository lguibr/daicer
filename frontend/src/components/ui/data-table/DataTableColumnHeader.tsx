'use client';

import type { HTMLAttributes } from 'react';
import { forwardRef } from 'react';
import type { Column } from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ChevronsUpDown, EyeOff } from 'lucide-react';

import cn from '@/lib/utils';
import { useI18n } from '../../../i18n';
import { Button } from '../button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../dropdown-menu';

interface DataTableColumnHeaderProps<TData, TValue> extends HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
}

function DataTableColumnHeaderComponent<TData, TValue>(
  { column, title, className, ...props }: DataTableColumnHeaderProps<TData, TValue>,
  ref: React.Ref<HTMLDivElement>
) {
  const { t } = useI18n();

  if (!column.getCanSort()) {
    return (
      <div ref={ref} className={cn('flex items-center', className)} {...props}>
        {title}
      </div>
    );
  }

  const sorted = column.getIsSorted();

  return (
    <div ref={ref} className={cn('flex items-center', className)} {...props}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="data-[state=open]:bg-muted -ml-2 h-8 px-2 text-xs uppercase tracking-wide"
            data-testid="dataTable-header-toggle"
            onClick={() => column.toggleSorting(sorted === 'asc')}
          >
            <span>{title}</span>
            {sorted === 'desc' ? (
              <ArrowDown className="ml-2 size-3.5" />
            ) : sorted === 'asc' ? (
              <ArrowUp className="ml-2 size-3.5" />
            ) : (
              <ChevronsUpDown className="ml-2 size-3.5" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-40">
          <DropdownMenuItem onClick={() => column.toggleSorting(false)} data-testid="dataTable-sort-asc">
            <ArrowUp className="mr-2 size-3.5" />
            {t('ui.dataTable.sort.asc')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => column.toggleSorting(true)} data-testid="dataTable-sort-desc">
            <ArrowDown className="mr-2 size-3.5" />
            {t('ui.dataTable.sort.desc')}
          </DropdownMenuItem>
          {column.getCanHide() ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => column.toggleVisibility(false)} data-testid="dataTable-hide-column">
                <EyeOff className="mr-2 size-3.5" />
                {t('ui.dataTable.sort.hide')}
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export const DataTableColumnHeader = forwardRef(DataTableColumnHeaderComponent) as <TData, TValue>(
  props: DataTableColumnHeaderProps<TData, TValue> & { ref?: React.Ref<HTMLDivElement> }
) => JSX.Element;

// DataTableColumnHeader.displayName = 'DataTableColumnHeader';
