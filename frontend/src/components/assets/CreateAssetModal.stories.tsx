/**
 * CreateAssetModal Storybook Stories
 * Asset creation forms for different asset types
 */

import type { Meta, StoryObj } from '@storybook/react';
import { CreateAssetModal } from './CreateAssetModal';

const meta = {
  title: 'Forms/CreateAssetModal',
  component: CreateAssetModal,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CreateAssetModal>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock handlers
const handleClose = () => console.log('Modal closed');
const handleSuccess = (id: string) => console.log('Asset created:', id);
const handleGenerate = async (id: string) => {
  console.log('Auto-generating asset:', id);
  return Promise.resolve();
};

export const TwoDImage: Story = {
  args: {
    collectionId: 'collection-123',
    assetType: '2d',
    onClose: handleClose,
    onSuccess: handleSuccess,
    onGenerate: handleGenerate,
  },
};

export const ThreeDVoxel: Story = {
  args: {
    collectionId: 'collection-123',
    assetType: '3d',
    onClose: handleClose,
    onSuccess: handleSuccess,
    onGenerate: handleGenerate,
  },
};

export const Structure: Story = {
  args: {
    collectionId: 'collection-123',
    assetType: 'structures',
    onClose: handleClose,
    onSuccess: handleSuccess,
    onGenerate: handleGenerate,
  },
};

export const Map: Story = {
  args: {
    collectionId: 'collection-123',
    assetType: 'map',
    onClose: handleClose,
    onSuccess: handleSuccess,
    onGenerate: handleGenerate,
  },
};

export const CharacterSheet: Story = {
  args: {
    collectionId: 'collection-123',
    assetType: 'character-sheet',
    onClose: handleClose,
    onSuccess: handleSuccess,
    onGenerate: handleGenerate,
  },
};
