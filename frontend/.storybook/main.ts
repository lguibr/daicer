/**
 * @file frontend/.storybook/main.ts
 * @description Storybook 10 configuration for D20 AI component library
 * @note Storybook 10 has built-in controls, actions, docs - no addon-essentials needed
 */

import type { StorybookConfig } from '@storybook/react-vite';
import { mergeConfig } from 'vite';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-a11y',
    // Note: Storybook 10 includes controls, actions, docs, viewport, backgrounds by default
    // No need for addon-essentials
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  viteFinal: async (config) => {
    return mergeConfig(config, {
      resolve: {
        alias: {
          '@': join(__dirname, '../src'),
        },
      },
    });
  },
};

export default config;
