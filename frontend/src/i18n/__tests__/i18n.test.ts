/**
 * @file i18n tests
 * @description Tests for internationalization functionality
 */

import { createElement } from 'react';
import type { ReactNode } from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { I18nProvider, useI18n } from '../../i18n';

describe('useI18n', () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset navigator.language
    Object.defineProperty(navigator, 'language', {
      writable: true,
      configurable: true,
      value: 'en-US',
    });
  });

  const wrapper = ({ children }: { children: ReactNode }) => createElement(I18nProvider, undefined, children);

  it('defaults to English when no stored language', () => {
    const { result } = renderHook(() => useI18n(), { wrapper });
    expect(result.current.language).toBe('en');
  });

  it('detects Spanish from browser language', () => {
    Object.defineProperty(navigator, 'language', {
      value: 'es-ES',
      writable: true,
    });
    const { result } = renderHook(() => useI18n(), { wrapper });
    expect(result.current.language).toBe('es');
  });

  it('detects Portuguese from browser language', () => {
    Object.defineProperty(navigator, 'language', {
      value: 'pt-BR',
      writable: true,
    });
    const { result } = renderHook(() => useI18n(), { wrapper });
    expect(result.current.language).toBe('pt-BR');
  });

  it('uses stored language over browser language', () => {
    Object.defineProperty(navigator, 'language', {
      value: 'es-ES',
      writable: true,
    });
    localStorage.setItem('daicer-language', 'pt-BR');
    const { result } = renderHook(() => useI18n(), { wrapper });
    expect(result.current.language).toBe('pt-BR');
  });

  it('changes language and persists to localStorage', () => {
    const { result } = renderHook(() => useI18n(), { wrapper });

    act(() => {
      result.current.setLanguage('es');
    });

    expect(result.current.language).toBe('es');
    expect(localStorage.getItem('daicer-language')).toBe('es');
  });

  it('keeps translated value stable when language unchanged', () => {
    const { result, rerender } = renderHook(() => useI18n(), { wrapper });
    const initialValue = result.current.t('lobby.title');

    rerender();

    expect(result.current.t('lobby.title')).toBe(initialValue);
  });

  it('updates translated value when language changes', () => {
    const { result, rerender } = renderHook(() => useI18n(), { wrapper });

    act(() => {
      result.current.setLanguage('es');
    });

    rerender();

    expect(result.current.language).toBe('es');
    expect(result.current.t('rooms.title')).toBe('Tus Salas');
  });

  it('returns all supported languages', () => {
    const { result } = renderHook(() => useI18n(), { wrapper });
    expect(result.current.availableLanguages).toHaveLength(3);
    expect(result.current.availableLanguages.map((l) => l.code)).toEqual(['en', 'es', 'pt-BR']);
  });

  it('fallback to key if translation missing', () => {
    const { result } = renderHook(() => useI18n(), { wrapper });
    expect(result.current.t('nonexistent.key')).toBe('nonexistent.key');
  });
});
