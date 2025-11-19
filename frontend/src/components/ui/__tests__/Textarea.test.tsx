import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Textarea from '../textarea';

describe('Textarea', () => {
  it('renders correctly', () => {
    render(<Textarea />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
    expect(textarea.tagName).toBe('TEXTAREA');
  });

  it('handles user input', async () => {
    const user = userEvent.setup();
    render(<Textarea placeholder="Enter text" />);

    const textarea = screen.getByPlaceholderText('Enter text');
    await user.type(textarea, 'Multi\nline\ntext');

    expect(textarea).toHaveValue('Multi\nline\ntext');
  });

  it('handles onChange event', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Textarea onChange={onChange} />);

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'test');

    expect(onChange).toHaveBeenCalled();
  });

  it('respects disabled state', async () => {
    const user = userEvent.setup();
    render(<Textarea disabled />);

    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeDisabled();
    expect(textarea).toHaveClass('disabled:opacity-50');

    await user.type(textarea, 'test');
    expect(textarea).toHaveValue('');
  });

  it('accepts placeholder', () => {
    render(<Textarea placeholder="Enter your message" />);
    expect(screen.getByPlaceholderText('Enter your message')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Textarea className="custom-textarea" />);
    expect(screen.getByRole('textbox')).toHaveClass('custom-textarea');
  });

  it('forwards ref', () => {
    const ref = { current: null };
    render(<Textarea ref={ref} />);
    expect(ref.current).not.toBeNull();
  });

  it('supports controlled textarea', async () => {
    const user = userEvent.setup();
    const TestComponent = () => {
      const [value, setValue] = React.useState('');
      return <Textarea value={value} onChange={(e) => setValue(e.target.value)} />;
    };

    const { default: React } = await import('react');
    render(<TestComponent />);

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'controlled text');

    expect(textarea).toHaveValue('controlled text');
  });

  it('supports maxLength attribute', () => {
    render(<Textarea maxLength={100} />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('maxLength', '100');
  });

  it('supports rows attribute', () => {
    render(<Textarea rows={5} />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('rows', '5');
  });

  it('supports required attribute', () => {
    render(<Textarea required />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeRequired();
  });

  it('applies minimum height class', () => {
    render(<Textarea />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveClass('min-h-[60px]');
  });

  it('handles multiline content', async () => {
    const user = userEvent.setup();
    render(<Textarea />);

    const textarea = screen.getByRole('textbox');
    const multilineText = 'Line 1\nLine 2\nLine 3';
    await user.type(textarea, multilineText);

    expect(textarea).toHaveValue(multilineText);
  });
});
