/**
 * @file i18n tests
 * @description Tests for internationalization functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useI18n } from '../../i18n';

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

  it('defaults to English when no stored language', () => {
    const { result } = renderHook(() => useI18n());
    expect(result.current.language).toBe('en');
  });

  it('detects Spanish from browser language', () => {
    Object.defineProperty(navigator, 'language', {
      value: 'es-ES',
      writable: true,
    });
    const { result } = renderHook(() => useI18n());
    expect(result.current.language).toBe('es');
  });

  it('detects Portuguese from browser language', () => {
    Object.defineProperty(navigator, 'language', {
      value: 'pt-BR',
      writable: true,
    });
    const { result } = renderHook(() => useI18n());
    expect(result.current.language).toBe('pt-BR');
  });

  it('uses stored language over browser language', () => {
    Object.defineProperty(navigator, 'language', {
      value: 'es-ES',
      writable: true,
    });
    localStorage.setItem('daicer-language', 'pt-BR');
    const { result } = renderHook(() => useI18n());
    expect(result.current.language).toBe('pt-BR');
  });

  it('translates English strings correctly', () => {
    const { result } = renderHook(() => useI18n());
    expect(result.current.t('auth.title')).toBe('dAIcer');
    expect(result.current.t('auth.subtitle')).toBe('AI Dungeon Master for tabletop legends');
  });

  it('translates Spanish strings correctly', () => {
    localStorage.setItem('daicer-language', 'es');
    const { result } = renderHook(() => useI18n());
    expect(result.current.t('auth.title')).toBe('dAIcer');
    expect(result.current.t('auth.subtitle')).toBe('Maestro de mazmorras con IA para leyendas de mesa');
  });

  it('translates Portuguese strings correctly', () => {
    localStorage.setItem('daicer-language', 'pt-BR');
    const { result } = renderHook(() => useI18n());
    expect(result.current.t('auth.title')).toBe('dAIcer');
    expect(result.current.t('auth.subtitle')).toBe('Mestre de masmorra com IA para lendas de mesa');
  });

  it('changes language and persists to localStorage', () => {
    const { result } = renderHook(() => useI18n());

    act(() => {
      result.current.setLanguage('es');
    });

    expect(result.current.language).toBe('es');
    expect(localStorage.getItem('daicer-language')).toBe('es');
  });

  it('returns all supported languages', () => {
    const { result } = renderHook(() => useI18n());
    expect(result.current.availableLanguages).toHaveLength(3);
    expect(result.current.availableLanguages.map((l) => l.code)).toEqual(['en', 'es', 'pt-BR']);
  });

  it('fallback to key if translation missing', () => {
    const { result } = renderHook(() => useI18n());
    expect(result.current.t('nonexistent.key')).toBe('nonexistent.key');
  });
});
