import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { act } from 'react';

import { Combobox, type ComboboxOption } from '../../ui/combobox';

const OPTIONS: ComboboxOption[] = [
  { value: 'next.js', label: 'Next.js', description: 'React framework' },
  { value: 'sveltekit', label: 'SvelteKit', description: 'Svelte framework' },
  { value: 'remix', label: 'Remix' },
];

// Radix Popover relies on ResizeObserver
// Radix Popover relies on ResizeObserver
class ResizeObserverStub {
  // eslint-disable-next-line class-methods-use-this
  observe() {}

  // eslint-disable-next-line class-methods-use-this
  unobserve() {}

  // eslint-disable-next-line class-methods-use-this
  disconnect() {}
}

describe('Combobox', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverStub as unknown as typeof globalThis.ResizeObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders placeholder and selects an option', async () => {
    const user = userEvent.setup();
    const Wrapper = () => {
      const [value, setValue] = React.useState<string | null>(null);
      return (
        <>
          <Combobox options={OPTIONS} value={value} onValueChange={setValue} />
          <div data-testid="selected">{value ?? 'none'}</div>
        </>
      );
    };

    render(<Wrapper />);

    const button = screen.getByRole('combobox');
    expect(button).toHaveTextContent('Select an option...');

    await act(async () => {
      await user.click(button);
    });

    const listbox = within(document.body);
    await act(async () => {
      await user.click(listbox.getByRole('option', { name: 'Next.js React framework' }));
    });

    expect(screen.getByTestId('selected')).toHaveTextContent('next.js');
    expect(button).toHaveTextContent('Next.js');
  });

  it('allows deselecting when selecting the same option again', async () => {
    const user = userEvent.setup();
    const Wrapper = () => {
      const [value, setValue] = React.useState<string | null>('sveltekit');
      return <Combobox options={OPTIONS} value={value} onValueChange={setValue} />;
    };

    render(<Wrapper />);

    const button = screen.getByRole('combobox');
    expect(button).toHaveTextContent('SvelteKit');

    await act(async () => {
      await user.click(button);
    });
    await act(async () => {
      await user.click(within(document.body).getByRole('option', { name: 'SvelteKit Svelte framework' }));
    });

    expect(button).toHaveTextContent('Select an option...');
  });

  it('shows empty message when filtering yields no results', async () => {
    const user = userEvent.setup();
    const Wrapper = () => {
      const [value, setValue] = React.useState<string | null>(null);
      return (
        <Combobox options={OPTIONS} value={value} onValueChange={setValue} searchPlaceholder="Search frameworks..." />
      );
    };

    render(<Wrapper />);

    await act(async () => {
      await user.click(screen.getByRole('combobox'));
    });
    const searchInput = within(document.body).getByPlaceholderText('Search frameworks...');
    await act(async () => {
      await user.type(searchInput, 'vue');
    });

    expect(within(document.body).getByText('No results found.')).toBeInTheDocument();
  });
});
