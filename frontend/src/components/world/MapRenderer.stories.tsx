/**
 * MapRenderer Storybook Stories
 * Visual testing with real structure data
 */

import type { Meta, StoryObj } from '@storybook/react';
import { MapRenderer } from './MapRenderer';

const meta: Meta<typeof MapRenderer> = {
  title: 'World/MapRenderer',
  component: MapRenderer,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof MapRenderer>;

// Real structure data from a generated world
const realStructures = [
  {
    id: '1',
    name: 'Éden Verde',
    x: 256,
    y: 256,
    size: 'huge' as const,
    width: 96,
    height: 86,
    type: 'settlement' as const,
    significance: 9,
    era: 0,
    description: 'Central settlement founded in the first age',
  },
  {
    id: '2',
    name: 'O Coração da Floresta',
    x: 325,
    y: 334,
    size: 'large' as const,
    width: 96,
    height: 88,
    type: 'natural' as const,
    significance: 8,
    era: 0,
    description: 'Sacred forest grove',
  },
  {
    id: '3',
    name: 'Torre do Observador',
    x: 184,
    y: 184,
    size: 'small' as const,
    width: 33,
    height: 38,
    type: 'landmark' as const,
    significance: 6,
    era: 0,
    description: 'Ancient watchtower',
  },
  {
    id: '4',
    name: 'Fortaleza da Aurora',
    x: 383,
    y: 259,
    size: 'large' as const,
    width: 80,
    height: 72,
    type: 'settlement' as const,
    significance: 8,
    era: 1,
    description: 'Fortress built in the second era',
  },
  {
    id: '5',
    name: 'As Ruínas Sombrias',
    x: 256,
    y: 77,
    size: 'huge' as const,
    width: 96,
    height: 81,
    type: 'ruin' as const,
    significance: 9,
    era: 1,
    description: 'Collapsed ancient city',
  },
];

const realRoads = [
  {
    id: 'road-1',
    from: '1',
    to: '2',
    waypoints: [
      { x: 256, y: 256, type: 'junction' as const },
      { x: 280, y: 280, type: 'path' as const },
      { x: 305, y: 310, type: 'path' as const },
      { x: 325, y: 334, type: 'junction' as const },
    ],
    terrain: 'flat' as const,
    quality: 'road' as const,
  },
  {
    id: 'road-2',
    from: '1',
    to: '4',
    waypoints: [
      { x: 256, y: 256, type: 'junction' as const },
      { x: 320, y: 258, type: 'path' as const },
      { x: 383, y: 259, type: 'junction' as const },
    ],
    terrain: 'flat' as const,
    quality: 'highway' as const,
  },
  {
    id: 'road-3',
    from: '3',
    to: '5',
    waypoints: [
      { x: 184, y: 184, type: 'junction' as const },
      { x: 220, y: 130, type: 'path' as const },
      { x: 256, y: 77, type: 'junction' as const },
    ],
    terrain: 'hilly' as const,
    quality: 'trail' as const,
  },
];

/**
 * Default map with real structures
 */
export const Default: Story = {
  args: {
    roomId: 'story-room-1',
    structures: realStructures,
    roads: realRoads,
    mapWidth: 512,
    mapHeight: 512,
    initialLayer: 0,
  },
};

/**
 * Empty map (no structures)
 */
export const Empty: Story = {
  args: {
    roomId: 'story-room-2',
    structures: [],
    roads: [],
  },
};

/**
 * Single structure
 */
export const SingleStructure: Story = {
  args: {
    roomId: 'story-room-3',
    structures: [realStructures[0]],
    roads: [],
  },
};

/**
 * Dense map (many structures)
 */
export const Dense: Story = {
  args: {
    roomId: 'story-room-4',
    structures: [
      ...realStructures,
      ...Array.from({ length: 10 }, (_, i) => ({
        id: `extra-${i}`,
        name: `Structure ${i + 6}`,
        x: 50 + (i % 5) * 80,
        y: 400 + Math.floor(i / 5) * 60,
        size: 'small' as const,
        width: 24,
        height: 24,
        type: 'landmark' as const,
        significance: 5,
        era: 2,
        description: `Extra structure ${i}`,
      })),
    ],
    roads: realRoads,
  },
};

/**
 * Underground layer (z = -5)
 */
export const UndergroundLayer: Story = {
  args: {
    roomId: 'story-room-5',
    structures: realStructures.filter((s) => s.type === 'dungeon' || s.type === 'ruin'),
    roads: [],
    initialLayer: -5,
  },
};

/**
 * High layer (z = 10)
 */
export const SkyLayer: Story = {
  args: {
    roomId: 'story-room-6',
    structures: realStructures.filter((s) => s.type === 'landmark'),
    roads: [],
    initialLayer: 10,
  },
};
