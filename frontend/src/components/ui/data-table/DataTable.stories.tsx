/**
 * @file frontend/src/components/ui/data-table/DataTable.stories.tsx
 * @note Update accompanying README when adjusting demo configuration.
 */

import type { Meta, StoryObj } from '@storybook/react';
import type { ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';
import { Flag, Swords } from 'lucide-react';

import { I18nProvider, useI18n } from '../../../i18n';
import { Badge, type BadgeVariantProps } from '../badge';
import { Button } from '../button';
import { DataTable } from './DataTable';
import { DataTableColumnHeader } from './DataTableColumnHeader';

type AdventureStatus = 'draft' | 'active' | 'completed';

interface AdventureRow {
  id: string;
  title: string;
  theme: string;
  status: AdventureStatus;
  players: number;
  updatedAt: string;
}

interface RawAdventureRow {
  id: string;
  titleKey: string;
  themeKey: string;
  status: AdventureStatus;
  players: number;
  updatedAt: string;
}

const RAW_ROWS: RawAdventureRow[] = [
  {
    id: 'hollowspire',
    titleKey: 'ui.dataTable.demo.rows.hollowspire.title',
    themeKey: 'ui.dataTable.demo.rows.hollowspire.theme',
    status: 'active',
    players: 5,
    updatedAt: '2025-11-10T16:30:00.000Z',
  },
  {
    id: 'ashen-rift',
    titleKey: 'ui.dataTable.demo.rows.ashenRift.title',
    themeKey: 'ui.dataTable.demo.rows.ashenRift.theme',
    status: 'draft',
    players: 4,
    updatedAt: '2025-11-12T08:15:00.000Z',
  },
  {
    id: 'luminous-depths',
    titleKey: 'ui.dataTable.demo.rows.luminousDepths.title',
    themeKey: 'ui.dataTable.demo.rows.luminousDepths.theme',
    status: 'completed',
    players: 6,
    updatedAt: '2025-11-02T21:05:00.000Z',
  },
];

const STATUS_BADGE_VARIANT: Record<AdventureStatus, BadgeVariantProps['variant']> = {
  active: 'default',
  draft: 'outline',
  completed: 'secondary',
};

function DemoAdventureTable() {
  const { t, language } = useI18n();

  const data = useMemo<AdventureRow[]>(
    () =>
      RAW_ROWS.map((row) => ({
        id: row.id,
        title: t(row.titleKey),
        theme: t(row.themeKey),
        status: row.status,
        players: row.players,
        updatedAt: row.updatedAt,
      })),
    [t]
  );

  const columns = useMemo<ColumnDef<AdventureRow, unknown>[]>(
    () => [
      {
        accessorKey: 'title',
        header: ({ column }) => <DataTableColumnHeader column={column} title={t('ui.dataTable.columns.adventure')} />,
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-semibold">{row.original.title}</span>
            <span className="text-xs text-muted-foreground">{row.original.theme}</span>
          </div>
        ),
        meta: { label: t('ui.dataTable.columns.adventure') },
        filterFn: 'includesString',
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title={t('ui.dataTable.columns.status')} />,
        cell: ({ row }) => (
          <Badge variant={STATUS_BADGE_VARIANT[row.original.status]}>
            {row.original.status === 'active' ? <Swords className="size-3" /> : <Flag className="size-3" />}
            {t(`ui.dataTable.status.${row.original.status}`)}
          </Badge>
        ),
        meta: { label: t('ui.dataTable.columns.status') },
      },
      {
        accessorKey: 'players',
        header: ({ column }) => <DataTableColumnHeader column={column} title={t('ui.dataTable.columns.players')} />,
        cell: ({ row }) => <span className="font-medium">{row.original.players}</span>,
        meta: { label: t('ui.dataTable.columns.players') },
      },
      {
        accessorKey: 'updatedAt',
        header: ({ column }) => <DataTableColumnHeader column={column} title={t('ui.dataTable.columns.updated')} />,
        cell: ({ row }) => {
          const formatted = new Intl.DateTimeFormat(language, {
            dateStyle: 'medium',
            timeStyle: 'short',
          }).format(new Date(row.original.updatedAt));
          return <span className="text-sm text-muted-foreground">{formatted}</span>;
        },
        meta: { label: t('ui.dataTable.columns.updated') },
      },
    ],
    [language, t]
  );

  return (
    <DataTable
      columns={columns}
      data={data}
      filterColumnId="title"
      filterPlaceholderKey="ui.dataTable.demo.filter"
      toolbarSlot={
        <Button size="sm" data-testid="dataTable-demo-new">
          {t('ui.dataTable.demo.toolbar.new')}
        </Button>
      }
    />
  );
}

const meta = {
  title: 'UI/DataTable',
  component: DemoAdventureTable,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DemoAdventureTable>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <I18nProvider>
      <div className="mx-auto max-w-5xl p-8">
        <DemoAdventureTable />
      </div>
    </I18nProvider>
  ),
};
