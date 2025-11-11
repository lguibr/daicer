/**
 * @file frontend/src/components/ui/label.stories.tsx
 * @note Update README.md when adding new variants or significant examples
 */

import type { Meta, StoryObj } from '@storybook/react';
import Label from './label';
import Input from './input';

const meta = {
  title: 'UI/Label',
  component: Label,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Label Text',
  },
};

export const WithInput: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="input-demo">Your Name</Label>
      <Input id="input-demo" placeholder="Enter your name" />
    </div>
  ),
};

export const Required: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="required-input">
        Email <span className="text-red-500">*</span>
      </Label>
      <Input id="required-input" type="email" required />
    </div>
  ),
};

export const WithDescription: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="desc-input">Username</Label>
      <Input id="desc-input" placeholder="Choose a username" />
      <p className="text-sm text-muted-foreground">This will be your public display name.</p>
    </div>
  ),
};

export const DisabledState: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="disabled-input" className="peer-disabled:opacity-70">
        Disabled Field
      </Label>
      <Input id="disabled-input" disabled value="Cannot edit" className="peer" />
    </div>
  ),
};

export const MultipleFields: Story = {
  render: () => (
    <div className="w-[350px] space-y-4">
      <div className="space-y-2">
        <Label htmlFor="first-name">First Name</Label>
        <Input id="first-name" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="last-name">Last Name</Label>
        <Input id="last-name" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email-field">Email Address</Label>
        <Input id="email-field" type="email" />
      </div>
    </div>
  ),
};
