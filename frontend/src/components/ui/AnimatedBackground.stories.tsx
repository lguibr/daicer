/**
 * @file frontend/src/components/ui/AnimatedBackground.stories.tsx
 * @note Update README.md when adding new variants or significant examples
 */

import type { Meta, StoryObj } from '@storybook/react';
import AnimatedBackground from './AnimatedBackground';
import { Card, CardContent, CardHeader, CardTitle } from './card';

const meta = {
  title: 'UI/AnimatedBackground',
  component: AnimatedBackground,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof AnimatedBackground>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="relative w-screen h-screen">
      <AnimatedBackground />
      <div className="relative z-10 flex items-center justify-center h-full">
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle>Animated Background</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              The background features aurora-like animations, a star field, and gradient overlays for a cosmic theme.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  ),
};

export const WithContent: Story = {
  render: () => (
    <div className="relative w-screen h-screen">
      <AnimatedBackground />
      <div className="relative z-10 p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="text-5xl font-bold text-white">DAIcer</h1>
          <p className="text-xl text-gray-200">
            Experience the magic of AI-powered Dungeons & Dragons storytelling with our immersive animated interface.
          </p>
          <div className="grid grid-cols-3 gap-4 mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Dynamic Worlds</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">AI-generated stories that adapt to your choices.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Epic Combat</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">Tactical grid-based battles with D&D rules.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Multiplayer</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">Adventure with friends in real-time.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  ),
};

export const StandaloneView: Story = {
  render: () => (
    <div className="relative w-screen h-[600px]">
      <AnimatedBackground />
    </div>
  ),
};
