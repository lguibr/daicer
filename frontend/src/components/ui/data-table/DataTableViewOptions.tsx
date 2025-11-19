'use client';

import type { Table as DataTable } from '@tanstack/react-table';
import { Settings2 } from 'lucide-react';

import { useI18n } from '../../../i18n';
import { Button } from '../button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../dropdown-menu';

interface DataTableViewOptionsProps<TData> {
  table: DataTable<TData>;
}

export function DataTableViewOptions<TData>({ table }: DataTableViewOptionsProps<TData>) {
  const { t } = useI18n();
  const toggleableColumns = table.getAllLeafColumns().filter((column) => column.getCanHide());

  if (toggleableColumns.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto hidden h-8 items-center gap-2 sm:flex"
          data-testid="dataTable-viewOptions"
        >
          <Settings2 className="size-3.5" />
          {t('ui.dataTable.view.trigger')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-xs font-semibold uppercase text-muted-foreground">
          {t('ui.dataTable.view.label')}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {toggleableColumns.map((column) => (
          <DropdownMenuCheckboxItem
            key={column.id}
            className="capitalize"
            checked={column.getIsVisible()}
            onCheckedChange={(value) => column.toggleVisibility(Boolean(value))}
            data-testid={`dataTable-column-${column.id}`}
          >
            {(column.columnDef.meta as { label?: string })?.label ?? column.id}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
