import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

describe('App tracing animation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('waits for the start prelude before rendering the traced path', () => {
    const { container } = render(<App />);

    fireEvent.click(screen.getAllByRole('button', { name: 'たどる' })[0]);

    expect(container.querySelector('polyline[fill="none"][stroke-width="4.5"]')).toBeNull();

    act(() => {
      vi.advanceTimersByTime(699);
    });

    expect(container.querySelector('polyline[fill="none"][stroke-width="4.5"]')).toBeNull();

    act(() => {
      vi.advanceTimersByTime(1);
    });

    const tracedPath = container.querySelector('polyline[fill="none"][stroke-width="4.5"]');

    expect(tracedPath).not.toBeNull();
    expect(tracedPath?.getAttribute('class')).toContain('path-active');
    expect(tracedPath?.getAttribute('points')?.trim().split(/\s+/)).toHaveLength(1);
  });
});
