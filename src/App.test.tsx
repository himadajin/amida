import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

describe('App', () => {
  it('初期表示で参加者名と結果名の初期値が表示される', () => {
    render(<App />);

    expect(screen.getByLabelText('参加者1')).toHaveValue('A');
    expect(screen.getByLabelText('参加者5')).toHaveValue('E');
    expect(screen.getByLabelText('結果1')).toHaveValue('1');
    expect(screen.getByLabelText('結果5')).toHaveValue('5');
  });

  it('空欄がある場合、あみだくじを生成できない', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.clear(screen.getByLabelText('参加者1'));
    await user.click(screen.getByRole('button', { name: 'あみだを作る' }));

    expect(
      screen.getByText('参加者1の名前を入力してください。'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('img', { name: '生成されたあみだくじ' }),
    ).not.toBeInTheDocument();
  });

  it('あみだを作るとあみだくじが表示される', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'あみだを作る' }));

    expect(
      screen.getByRole('img', { name: '生成されたあみだくじ' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'もう一度作る' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '入力を編集する' }),
    ).toBeInTheDocument();
  });

  it('参加者を選ぶと経路表示後に結果を表示する', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'あみだを作る' }));
    await user.click(screen.getAllByRole('button', { name: 'たどる' })[0]);

    expect(screen.getByRole('button', { name: '表示中' })).toBeDisabled();

    await waitFor(() => {
      expect(screen.getByText(/^結果: [1-5]$/)).toBeInTheDocument();
    });
  });

  it('全員分の経路表示後、最終結果一覧を表示する', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'あみだを作る' }));

    for (let i = 0; i < 5; i += 1) {
      await user.click(screen.getAllByRole('button', { name: 'たどる' })[0]);
      await waitFor(() => {
        expect(
          screen.queryByRole('button', { name: '表示中' }),
        ).not.toBeInTheDocument();
      });
    }

    expect(screen.getByText('最終結果一覧')).toBeInTheDocument();
  });
});
