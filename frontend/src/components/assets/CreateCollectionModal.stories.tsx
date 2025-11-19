/**
 * CreateCollectionModal Storybook Stories
 * Demonstrates collection creation for all asset types
 */

import type { Meta, StoryObj } from '@storybook/react';
import { CreateCollectionModal } from './CreateCollectionModal';

const meta = {
  title: 'Forms/CreateCollectionModal',
  component: CreateCollectionModal,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CreateCollectionModal>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock handlers
const handleClose = () => console.log('Modal closed');
const handleSuccess = (id: string) => console.log('Collection created:', id);

export const TwoDImageCollection: Story = {
  args: {
    assetType: '2d',
    onClose: handleClose,
    onSuccess: handleSuccess,
  },
};

export const ThreeDModelCollection: Story = {
  args: {
    assetType: '3d',
    onClose: handleClose,
    onSuccess: handleSuccess,
  },
};

export const MapCollection: Story = {
  args: {
    assetType: 'map',
    onClose: handleClose,
    onSuccess: handleSuccess,
  },
};

export const StructureCollection: Story = {
  args: {
    assetType: 'structures',
    onClose: handleClose,
    onSuccess: handleSuccess,
  },
};

export const CharacterSheetCollection: Story = {
  args: {
    assetType: 'character-sheet',
    onClose: handleClose,
    onSuccess: handleSuccess,
  },
};
