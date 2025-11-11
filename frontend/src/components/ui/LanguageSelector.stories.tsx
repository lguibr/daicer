/**
 * @file frontend/src/components/ui/LanguageSelector.stories.tsx
 * @note Update README.md when adding new variants or significant examples
 */

import type { Meta, StoryObj } from '@storybook/react';
import LanguageSelector from './LanguageSelector';
import { Card, CardContent, CardHeader, CardTitle } from './card';

const meta = {
  title: 'UI/LanguageSelector',
  component: LanguageSelector,
  parameters: {
    layout: 'centered',
    mockData: [
      {
        useI18n: {
          language: 'en',
          setLanguage: () => {},
          availableLanguages: [
            { code: 'en', name: 'English', short: 'EN' },
            { code: 'es', name: 'Español', short: 'ES' },
            { code: 'fr', name: 'Français', short: 'FR' },
            { code: 'de', name: 'Deutsch', short: 'DE' },
            { code: 'ja', name: '日本語', short: 'JA' },
          ],
        },
      },
    ],
  },
  tags: ['autodocs'],
} satisfies Meta<typeof LanguageSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const InNavbar: Story = {
  render: () => (
    <div className="bg-slate-800 p-4 rounded-lg w-[600px]">
      <div className="flex items-center justify-between">
        <h2 className="text-white text-lg font-semibold">DAIcer</h2>
        <div className="flex items-center gap-4">
          <span className="text-gray-300 text-sm">Welcome, Player</span>
          <LanguageSelector />
        </div>
      </div>
    </div>
  ),
};

export const InSettings: Story = {
  render: () => (
    <Card className="w-[400px]">
      <CardHeader>
        <CardTitle>Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="lang-setting" className="text-sm font-medium">
            Language
          </label>
          <div id="lang-setting">
            <LanguageSelector />
          </div>
          <p className="text-xs text-muted-foreground">Choose your preferred language for the interface</p>
        </div>
        <div className="space-y-2">
          <label htmlFor="notif-setting" className="text-sm font-medium">
            Notifications
          </label>
          <select
            id="notif-setting"
            className="bg-slate-700 text-white text-sm rounded-lg px-3 py-1.5 border border-slate-600 w-full"
          >
            <option>All notifications</option>
            <option>Important only</option>
            <option>None</option>
          </select>
        </div>
      </CardContent>
    </Card>
  ),
};

export const Standalone: Story = {
  render: () => (
    <div className="space-y-2">
      <label htmlFor="lang-standalone" className="text-sm font-medium text-gray-200">
        Select Language
      </label>
      <div id="lang-standalone">
        <LanguageSelector />
      </div>
    </div>
  ),
};
