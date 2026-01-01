/**
 * FormWizard Storybook Stories
 * Multi-step form wizard component
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { FormWizard, FormWizardSteps, FormWizardContent, FormWizardStep, FormWizardActions } from './FormWizard';
// import { Button } from './button'; // Removed unused
import Input from './input';
import Label from './label';
import Textarea from './textarea';

const meta = {
  title: 'Forms/FormWizard',
  component: FormWizard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof FormWizard>;

export default meta;
type Story = StoryObj<typeof meta>;

// Example wizard with 3 steps
function ExampleWizard() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
  });

  const steps = [
    { id: 'basic', title: 'Basic Info', description: 'Tell us about yourself' },
    { id: 'contact', title: 'Contact', description: 'How to reach you' },
    { id: 'details', title: 'Details', description: 'Additional information' },
  ];

  return (
    <FormWizard steps={steps} onComplete={() => console.info('Wizard completed!', formData)} className="w-[600px]">
      <FormWizardSteps />
      <FormWizardContent>
        <FormWizardStep step="basic">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
          </div>
        </FormWizardStep>

        <FormWizardStep step="contact">
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>
          </div>
        </FormWizardStep>

        <FormWizardStep step="details">
          <div className="space-y-4">
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell us about yourself..."
                rows={4}
              />
            </div>
          </div>
        </FormWizardStep>
      </FormWizardContent>

      <FormWizardActions previousLabel="Back" nextLabel="Next" completeLabel="Complete" />
    </FormWizard>
  );
}

export const ThreeStepWizard: Story = {
  render: () => <ExampleWizard />,
  args: {
    steps: [],
    children: null,
  },
};

export const SingleStep: Story = {
  render: () => (
    <FormWizard steps={[{ id: 'only', title: 'Single Step' }]} onComplete={() => console.info('Done!')}>
      <FormWizardSteps />
      <FormWizardContent>
        <FormWizardStep step="only">
          <div className="p-6">
            <p>This wizard has only one step</p>
          </div>
        </FormWizardStep>
      </FormWizardContent>
      <FormWizardActions completeLabel="Complete" />
    </FormWizard>
  ),
  args: {
    steps: [],
    children: null,
  },
};

export const FiveStepWizard: Story = {
  render: () => (
    <FormWizard
      steps={[
        { id: '1', title: 'Step 1' },
        { id: '2', title: 'Step 2' },
        { id: '3', title: 'Step 3' },
        { id: '4', title: 'Step 4' },
        { id: '5', title: 'Step 5' },
      ]}
      onComplete={() => console.info('Five steps completed!')}
    >
      <FormWizardSteps />
      <FormWizardContent>
        {[1, 2, 3, 4, 5].map((num) => (
          <FormWizardStep key={num} step={String(num)}>
            <div className="p-6">
              <p>Step {num} content</p>
            </div>
          </FormWizardStep>
        ))}
      </FormWizardContent>
      <FormWizardActions previousLabel="Back" nextLabel="Next" completeLabel="Finish" />
    </FormWizard>
  ),
  args: {
    steps: [],
    children: null,
  },
};
