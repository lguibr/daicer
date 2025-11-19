import type { Meta, StoryObj } from '@storybook/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';

import AppProviders from '../../providers/AppProviders';
import NotFoundPage from '../NotFound';
import ErrorPage from '../Error';

const meta: Meta = {
  title: 'Pages/Status',
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

function StoryShell({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter>
      <AppProviders>{children}</AppProviders>
    </MemoryRouter>
  );
}

export const NotFound: Story = {
  render: () => (
    <StoryShell>
      <NotFoundPage />
    </StoryShell>
  ),
};

export const Error: Story = {
  render: () => (
    <StoryShell>
      <ErrorPage />
    </StoryShell>
  ),
};
