import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import AnimatedBackground from '../AnimatedBackground';

describe('AnimatedBackground', () => {
  it('renders without crashing', () => {
    const { container } = render(<AnimatedBackground />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders with fixed positioning', () => {
    const { container } = render(<AnimatedBackground />);
    const background = container.firstChild as HTMLElement;
    expect(background).toHaveClass('fixed', 'inset-0');
  });

  it('renders with pointer-events-none', () => {
    const { container } = render(<AnimatedBackground />);
    const background = container.firstChild as HTMLElement;
    expect(background).toHaveClass('pointer-events-none');
  });

  it('renders gradient layers', () => {
    const { container } = render(<AnimatedBackground />);
    const gradients = container.querySelectorAll('.bg-gradient-to-b, .bg-gradient-to-r, .bg-gradient-to-t');
    expect(gradients.length).toBeGreaterThan(0);
  });

  it('includes animated elements', () => {
    const { container } = render(<AnimatedBackground />);
    const animatedElements = container.querySelectorAll('[class*="animate-"]');
    expect(animatedElements.length).toBeGreaterThan(0);
  });

  it('has proper z-index for background', () => {
    const { container } = render(<AnimatedBackground />);
    const background = container.firstChild as HTMLElement;
    expect(background).toHaveClass('z-0');
  });

  it('contains overflow hidden', () => {
    const { container } = render(<AnimatedBackground />);
    const background = container.firstChild as HTMLElement;
    expect(background).toHaveClass('overflow-hidden');
  });

  it('renders spark drift layer with custom background image', () => {
    const { container } = render(<AnimatedBackground />);
    const sparkLayer = container.querySelector('.animate-spark-drift') as HTMLElement | null;
    expect(sparkLayer).toBeInTheDocument();
    expect(sparkLayer?.style.backgroundImage).toContain('radial-gradient');
  });

  it('renders dark overlay for readability', () => {
    const { container } = render(<AnimatedBackground />);
    const overlays = container.querySelectorAll('[class*="backdrop-blur"]');
    expect(overlays.length).toBeGreaterThan(0);
  });
});
