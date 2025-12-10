'use client';

import type { HTMLAttributes, TableHTMLAttributes } from 'react';
import { forwardRef } from 'react';

import cn from '@/lib/utils';

type TableElement = HTMLTableElement;
type TableHeaderElement = HTMLTableSectionElement;
type TableBodyElement = HTMLTableSectionElement;
type TableFooterElement = HTMLTableSectionElement;
type TableRowElement = HTMLTableRowElement;
type TableCellElement = HTMLTableCellElement;

export const Table = forwardRef<TableElement, TableHTMLAttributes<TableElement>>(({ className, ...props }, ref) => (
  <table ref={ref} className={cn('w-full caption-bottom text-sm', className)} {...props} />
));
Table.displayName = 'Table';

export const TableHeader = forwardRef<TableHeaderElement, HTMLAttributes<TableHeaderElement>>(
  ({ className, ...props }, ref) => (
    <thead ref={ref} className={cn('[&_tr]:border-b text-muted-foreground', className)} {...props} />
  )
);
TableHeader.displayName = 'TableHeader';

export const TableBody = forwardRef<TableBodyElement, HTMLAttributes<TableBodyElement>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props} />
  )
);
TableBody.displayName = 'TableBody';

export const TableFooter = forwardRef<TableFooterElement, HTMLAttributes<TableFooterElement>>(
  ({ className, ...props }, ref) => (
    <tfoot
      ref={ref}
      className={cn('bg-muted/50 font-medium text-muted-foreground [&>tr]:last:border-b-0', className)}
      {...props}
    />
  )
);
TableFooter.displayName = 'TableFooter';

export const TableRow = forwardRef<TableRowElement, HTMLAttributes<TableRowElement>>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      'border-b border-border transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',
      className
    )}
    {...props}
  />
));
TableRow.displayName = 'TableRow';

export const TableHead = forwardRef<TableCellElement, HTMLAttributes<TableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        'h-10 px-3 text-left align-middle text-xs font-semibold uppercase tracking-wide text-muted-foreground',
        className
      )}
      {...props}
    />
  )
);
TableHead.displayName = 'TableHead';

export const TableCell = forwardRef<TableCellElement, React.TdHTMLAttributes<TableCellElement>>(
  ({ className, ...props }, ref) => <td ref={ref} className={cn('p-3 align-middle', className)} {...props} />
);
TableCell.displayName = 'TableCell';

export const TableCaption = forwardRef<TableCellElement, HTMLAttributes<TableCellElement>>(
  ({ className, ...props }, ref) => (
    <caption ref={ref} className={cn('mt-4 text-sm text-muted-foreground', className)} {...props} />
  )
);
TableCaption.displayName = 'TableCaption';
