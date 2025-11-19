import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import type { ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';

import { I18nProvider, useI18n } from '../../../i18n';
import { Badge } from '../badge';
import { DataTable } from './DataTable';
import { DataTableColumnHeader } from './DataTableColumnHeader';

interface Row {
  id: string;
  name: string;
  category: string;
  updatedAt: string;
}

const rows: Row[] = [
  {
    id: 'aurora',
    name: 'Aurora Vanguard',
    category: 'Adventuring Company',
    updatedAt: '2025-11-01T14:00:00.000Z',
  },
  {
    id: 'elysian',
    name: 'Elysian Chorus',
    category: 'Lorehall',
    updatedAt: '2025-09-18T09:45:00.000Z',
  },
];

function TestTable() {
  const { t } = useI18n();

  const columns = useMemo<ColumnDef<Row>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => <DataTableColumnHeader column={column} title={t('ui.dataTable.test.columns.name')} />,
        cell: ({ row }) => <span className="font-semibold">{row.original.name}</span>,
        filterFn: 'includesString',
        meta: { label: t('ui.dataTable.test.columns.name') },
      },
      {
        accessorKey: 'category',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('ui.dataTable.test.columns.category')} />
        ),
        cell: ({ row }) => <Badge variant="secondary">{row.original.category}</Badge>,
        meta: { label: t('ui.dataTable.test.columns.category') },
      },
    ],
    [t]
  );

  return (
    <DataTable<Row, unknown>
      columns={columns}
      data={rows}
      filterColumnId="name"
      filterPlaceholderKey="ui.dataTable.filter.placeholder"
    />
  );
}

function renderTable() {
  return render(
    <I18nProvider>
      <TestTable />
    </I18nProvider>
  );
}

describe('DataTable', () => {
  it('renders provided rows', () => {
    renderTable();

    expect(screen.getByText('Aurora Vanguard')).toBeInTheDocument();
    expect(screen.getByText('Elysian Chorus')).toBeInTheDocument();
  });

  it('filters rows using the configured column', () => {
    renderTable();

    const filterInput = screen.getByTestId('dataTable-filter') as HTMLInputElement;
    fireEvent.change(filterInput, { target: { value: 'Aurora' } });

    const [, body] = screen.getAllByRole('rowgroup');
    expect(within(body).getByText('Aurora Vanguard')).toBeInTheDocument();
    expect(within(body).queryByText('Elysian Chorus')).toBeNull();
  });

  it('shows empty state when no rows match filters', () => {
    renderTable();

    const filterInput = screen.getByTestId('dataTable-filter') as HTMLInputElement;
    fireEvent.change(filterInput, { target: { value: 'Unknown' } });

    expect(screen.getByTestId('dataTable-empty')).toBeInTheDocument();
  });
});
