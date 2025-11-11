/**
 * @file frontend/src/components/ui/textarea.stories.tsx
 * @note Update README.md when adding new variants or significant examples
 */

import type { Meta, StoryObj } from '@storybook/react';
import Textarea from './textarea';
import Label from './label';

const meta = {
  title: 'UI/Textarea',
  component: Textarea,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    disabled: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Type your message here...',
  },
};

export const WithLabel: Story = {
  render: () => (
    <div className="w-[400px] space-y-2">
      <Label htmlFor="message">Your Message</Label>
      <Textarea id="message" placeholder="Tell us what you think..." />
    </div>
  ),
};

export const WithValue: Story = {
  args: {
    value: 'This is some pre-filled text content\nwith multiple lines\nof text.',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    value: 'This textarea is disabled and cannot be edited.',
  },
};

export const WithRows: Story = {
  args: {
    rows: 10,
    placeholder: 'A taller textarea with 10 rows...',
  },
};

export const WithMaxLength: Story = {
  render: () => (
    <div className="w-[400px] space-y-2">
      <Label htmlFor="limited">Limited to 100 characters</Label>
      <Textarea id="limited" maxLength={100} placeholder="Maximum 100 characters..." />
      <p className="text-sm text-muted-foreground">Character limit: 100</p>
    </div>
  ),
};

export const Required: Story = {
  render: () => (
    <div className="w-[400px] space-y-2">
      <Label htmlFor="required">
        Feedback <span className="text-red-500">*</span>
      </Label>
      <Textarea id="required" required placeholder="Required field..." />
    </div>
  ),
};

export const FormExample: Story = {
  render: () => (
    <div className="w-[500px] space-y-4">
      <div className="space-y-2">
        <Label htmlFor="subject">Subject</Label>
        <input
          id="subject"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          placeholder="Brief description"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="details">Details</Label>
        <Textarea id="details" rows={6} placeholder="Provide more details about your request..." />
      </div>
      <div className="text-sm text-muted-foreground">
        Please be as specific as possible to help us assist you better.
      </div>
    </div>
  ),
};
