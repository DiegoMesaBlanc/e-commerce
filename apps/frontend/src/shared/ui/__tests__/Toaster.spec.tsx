import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Toaster } from '../Toaster';

describe('Toaster', () => {
  it('renders the globally configured toast container', () => {
    const { container } = render(<Toaster />);

    expect(container.firstElementChild).not.toBeNull();
  });
});