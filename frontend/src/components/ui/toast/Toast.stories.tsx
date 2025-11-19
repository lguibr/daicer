import type { Meta, StoryObj } from '@storybook/react';
import { useCallback } from 'react';

import { Button } from '../button';
import { Toaster, ToastAction, useToast } from '.';

const meta: Meta = {
  title: 'UI/Toast',
  component: Toaster,
  parameters: {
    layout: 'centered',
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

function ToastPlayground() {
  const { toast } = useToast();

  const showSuccess = useCallback(() => {
    toast({
      title: 'Realm saved',
      description: 'All session data synced successfully.',
      variant: 'success',
    });
  }, [toast]);

  const showError = useCallback(() => {
    toast({
      title: 'Dice service unavailable',
      description: 'Retrying connection to deterministic roller.',
      variant: 'destructive',
      action: <ToastAction altText="Retry">Retry</ToastAction>,
    });
  }, [toast]);

  return (
    <div className="flex flex-col items-center gap-4">
      <Button onClick={showSuccess}>Trigger success toast</Button>
      <Button variant="outline" onClick={showError}>
        Trigger error toast
      </Button>
    </div>
  );
}

export const Playground: Story = {
  render: () => (
    <>
      <ToastPlayground />
      <Toaster />
    </>
  ),
};
