import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';

import { I18nProvider } from '@/i18n';

import PublicNavbar from './PublicNavbar';

const meta: Meta<typeof PublicNavbar> = {
  title: 'Layout/PublicNavbar',
  component: PublicNavbar,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story, context) => {
      const initialPath = (context.parameters.initialPath as string | undefined) ?? '/';
      return (
        <MemoryRouter initialEntries={[initialPath]}>
          <I18nProvider>
            <div className="min-h-screen bg-midnight-900 text-shadow-100">
              <Story />
            </div>
          </I18nProvider>
        </MemoryRouter>
      );
    },
  ],
};

export default meta;

type Story = StoryObj<typeof PublicNavbar>;

export const Landing: Story = {
  parameters: {
    initialPath: '/',
  },
};

export const ExploreActive: Story = {
  parameters: {
    path: '/rules',
  },
};
