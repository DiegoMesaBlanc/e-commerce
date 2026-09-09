import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import toast from 'react-hot-toast';
import { Toaster } from '../../../../shared/ui/Toaster';
import { LIMIT_REACHED_MESSAGE, LimitReachedAlert } from '../LimitReachedAlert';

function Harness({ limitReached }: { limitReached: boolean }) {
  return (
    <>
      <Toaster />
      <LimitReachedAlert limitReached={limitReached} />
    </>
  );
}

describe('LimitReachedAlert', () => {
  afterEach(() => {
    toast.dismiss();
  });

  it('renders nothing when limitReached is false', () => {
    render(<Harness limitReached={false} />);

    expect(screen.queryByTestId('limit-reached-alert')).not.toBeInTheDocument();
  });

  it('renders the banner and fires a persistent toast when limitReached is true', async () => {
    render(<Harness limitReached={true} />);

    const banner = screen.getByTestId('limit-reached-alert');
    expect(banner).toHaveTextContent('35%');
    expect(screen.getByRole('alert')).toHaveTextContent(LIMIT_REACHED_MESSAGE);

    await waitFor(() => {
      expect(document.querySelector('[role="status"]')).toHaveTextContent(LIMIT_REACHED_MESSAGE);
    });
  });

  it('hides the banner and dismisses the toast when the limit stops applying', async () => {
    const { rerender } = render(<Harness limitReached={true} />);
    await waitFor(() => {
      expect(document.querySelector('[role="status"]')).toHaveTextContent(LIMIT_REACHED_MESSAGE);
    });

    rerender(<Harness limitReached={false} />);

    expect(screen.queryByTestId('limit-reached-alert')).not.toBeInTheDocument();
    await waitFor(
      () => {
        expect(document.body.textContent).not.toContain(LIMIT_REACHED_MESSAGE);
      },
      { timeout: 2500 },
    );
  });

  it('keeps the toast alive while the limit remains reached', async () => {
    const { rerender } = render(<Harness limitReached={true} />);

    rerender(<Harness limitReached={true} />);

    await waitFor(() => {
      expect(document.querySelector('[role="status"]')).toHaveTextContent(LIMIT_REACHED_MESSAGE);
    });
  });
});