import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AmidaBoard } from './AmidaBoard';
import { type AmidaBoardData } from '../logic/amida';

const boardData: AmidaBoardData = {
  cols: 5,
  levels: 1,
  horizontalLines: [],
};

const renderBoard = (
  tracedPaths: Map<number, number>,
  startedPaths: Record<number, boolean> = {},
) => {
  render(
    <AmidaBoard
      boardData={boardData}
      participants={['A', 'B', 'C', 'D', 'E']}
      results={['1', '2', '3', '4', '5']}
      tracedPaths={tracedPaths}
      startedPaths={startedPaths}
      activeTracings={{}}
      startedOrder={[]}
      onStartTrace={vi.fn()}
      onChangeParticipant={vi.fn()}
      onChangeResult={vi.fn()}
      levelHeight={40}
    />,
  );
};

describe('AmidaBoard', () => {
  it('colors the completed bottom result dot with the matching user color', () => {
    renderBoard(new Map([[3, 3]]));

    expect(screen.getByTestId('bottom-dot-3')).toHaveAttribute('fill', '#0090ff');
    expect(screen.getByTestId('bottom-dot-0')).toHaveAttribute('fill', 'var(--slate-11)');
  });

  it('renders the completion effect only for completed bottom dots', () => {
    renderBoard(new Map([[3, 3]]));

    expect(screen.getByTestId('completion-effect-3')).toBeInTheDocument();
    expect(screen.queryByTestId('completion-effect-0')).not.toBeInTheDocument();
  });

  it('renders unstarted top buttons in black', () => {
    renderBoard(new Map());

    expect(screen.getByTestId('top-button-ring-0')).toHaveAttribute('stroke', 'var(--slate-11)');
  });

  it('dims a started participant label and leaves a light button color trail', () => {
    renderBoard(new Map(), { 0: true });

    expect(screen.getByTestId('participant-input-0')).toHaveStyle({ color: 'var(--slate-9)' });
    expect(screen.getByTestId('top-button-ring-0')).toHaveAttribute('stroke', '#fdbdaf');
    expect(screen.getByTestId('start-effect-0')).toBeInTheDocument();
    expect(screen.getByTestId('label-transfer-0')).toBeInTheDocument();
  });

  it('keeps a started trace button at its hover elevation', () => {
    renderBoard(new Map(), { 0: true });

    expect(screen.getByRole('button', { name: 'たどり完了' })).toHaveClass('-translate-y-px');
  });
});
