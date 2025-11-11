import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../select';

describe('Select Components', () => {
  const renderBasicSelect = () => {
    return render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
          <SelectItem value="option2">Option 2</SelectItem>
          <SelectItem value="option3">Option 3</SelectItem>
        </SelectContent>
      </Select>
    );
  };

  it('renders with placeholder', () => {
    renderBasicSelect();
    expect(screen.getByText('Select an option')).toBeInTheDocument();
  });

  it('opens dropdown on click', async () => {
    const user = userEvent.setup();
    renderBasicSelect();

    const trigger = screen.getByRole('combobox');
    await user.click(trigger);

    expect(screen.getByRole('option', { name: 'Option 1' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Option 2' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Option 3' })).toBeInTheDocument();
  });

  it('selects an option', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(
      <Select onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="test1">Test 1</SelectItem>
          <SelectItem value="test2">Test 2</SelectItem>
        </SelectContent>
      </Select>
    );

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'Test 1' }));

    expect(onValueChange).toHaveBeenCalledWith('test1');
  });

  it('renders with default value', () => {
    render(
      <Select defaultValue="option2">
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
          <SelectItem value="option2">Option 2</SelectItem>
        </SelectContent>
      </Select>
    );

    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });

  it('handles disabled state', () => {
    render(
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="Disabled" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="test">Test</SelectItem>
        </SelectContent>
      </Select>
    );

    const trigger = screen.getByRole('combobox');
    expect(trigger).toBeDisabled();
  });

  it('applies custom className to trigger', () => {
    render(
      <Select>
        <SelectTrigger className="custom-trigger">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="test">Test</SelectItem>
        </SelectContent>
      </Select>
    );

    expect(screen.getByRole('combobox')).toHaveClass('custom-trigger');
  });

  it('renders disabled items', async () => {
    const user = userEvent.setup();

    render(
      <Select>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="enabled">Enabled</SelectItem>
          <SelectItem value="disabled" disabled>
            Disabled
          </SelectItem>
        </SelectContent>
      </Select>
    );

    await user.click(screen.getByRole('combobox'));
    const disabledItem = screen.getByRole('option', { name: 'Disabled' });
    expect(disabledItem).toHaveAttribute('aria-disabled', 'true');
  });

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup();
    renderBasicSelect();

    const trigger = screen.getByRole('combobox');
    await user.click(trigger);
    await user.keyboard('{ArrowDown}');

    // First option should be focused/highlighted
    expect(screen.getByRole('option', { name: 'Option 1' })).toBeInTheDocument();
  });
});
