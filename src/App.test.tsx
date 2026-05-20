import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

describe('App tracing animation', () => {
  beforeEach(() => {
    vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders only the starting point immediately after tracing starts', () => {
    const { container } = render(<App />);

    fireEvent.click(screen.getAllByRole('button', { name: 'たどる' })[0]);

    const tracedPath = container.querySelector('polyline[fill="none"][stroke-width="4.5"]');

    expect(tracedPath).not.toBeNull();
    expect(tracedPath?.getAttribute('class')).toContain('path-active');
    expect(tracedPath?.getAttribute('points')?.trim().split(/\s+/)).toHaveLength(1);
  });
});
