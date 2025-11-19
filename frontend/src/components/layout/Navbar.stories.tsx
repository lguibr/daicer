import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';

import { I18nProvider } from '@/i18n';

import Navbar from './Navbar';

const signedInAuth = {
  user: {
    displayName: 'Aelar Sunweaver',
    email: 'aelar@daice.dev',
    photoURL: '/face.png',
  },
  signOut: async () => Promise.resolve(),
};

const createAuthHook = () => signedInAuth;

const meta: Meta<typeof Navbar> = {
  title: 'Layout/Navbar',
  component: Navbar,
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
  argTypes: {
    useAuthHook: { table: { disable: true } },
    room: { table: { disable: true } },
    playerCount: { table: { disable: true } },
  },
};

export default meta;

type Story = StoryObj<typeof Navbar>;

export const LobbyView: Story = {
  args: {
    showRoomInfo: true,
    useAuthHook: createAuthHook,
  },
  parameters: {
    initialPath: '/',
  },
};

export const GameView: Story = {
  args: {
    showRoomInfo: true,
    useAuthHook: createAuthHook,
  },
  parameters: {
    initialPath: '/game',
  },
};
