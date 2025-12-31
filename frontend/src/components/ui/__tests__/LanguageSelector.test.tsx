import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LanguageSelector from '../LanguageSelector';
import * as i18nModule from '../../../i18n';

// Mock the useI18n hook
vi.mock('../../../i18n', () => ({
  useI18n: vi.fn(),
}));

describe('LanguageSelector', () => {
  const mockSetLanguage = vi.fn();
  const mockAvailableLanguages = [
    { code: 'en', name: 'English', short: 'EN' },
    { code: 'es', name: 'Español', short: 'ES' },
    { code: 'fr', name: 'Français', short: 'FR' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
    (i18nModule.useI18n as any).mockReturnValue({
      language: 'en',
      setLanguage: mockSetLanguage,
      availableLanguages: mockAvailableLanguages,
    });
  });

  it('renders with current language selected', () => {
    render(<LanguageSelector />);
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select).toBeInTheDocument();
    expect(select.value).toBe('en');
  });

  it('displays descriptive labels by default', () => {
    render(<LanguageSelector />);
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(3);
    expect(screen.getByRole('option', { name: 'EN · English' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'ES · Español' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'FR · Français' })).toBeInTheDocument();
  });

  it('calls setLanguage when selection changes', async () => {
    const user = userEvent.setup();
    render(<LanguageSelector />);

    const select = screen.getByRole('combobox');
    await user.selectOptions(select, 'es');

    expect(mockSetLanguage).toHaveBeenCalledWith('es');
  });

  it('updates when language prop changes', () => {
    const { rerender } = render(<LanguageSelector />);
    expect((screen.getByRole('combobox') as HTMLSelectElement).value).toBe('en');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
    (i18nModule.useI18n as any).mockReturnValue({
      language: 'fr',
      setLanguage: mockSetLanguage,
      availableLanguages: mockAvailableLanguages,
    });

    rerender(<LanguageSelector />);
    expect((screen.getByRole('combobox') as HTMLSelectElement).value).toBe('fr');
  });

  it('applies styling classes', () => {
    render(<LanguageSelector />);
    const select = screen.getByRole('combobox');
    expect(select).toHaveClass('rounded-md', 'border', 'border-midnight-500/60');
  });

  it('handles single language option', () => {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
    (i18nModule.useI18n as any).mockReturnValue({
      language: 'en',
      setLanguage: mockSetLanguage,
      availableLanguages: [{ code: 'en', name: 'English', short: 'EN' }],
    });

    render(<LanguageSelector />);
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(1);
  });

  it('renders flag-only labels for compact variant', () => {
    render(<LanguageSelector variant="compact" />);
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(3);
    expect(screen.getByRole('option', { name: '🇬🇧' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '🇪🇸' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'FR' })).toBeInTheDocument();
  });
});
