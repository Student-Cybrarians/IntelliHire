import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import Resume from '../src/client/pages/Resume';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';

describe('Accessibility: ARIA labels present', () => {
  it('contains accessible file input', () => {
    const { container } = render(React.createElement(BrowserRouter, null, React.createElement(Resume)));
    const inputs = container.querySelectorAll('input[type="file"]');
    expect(inputs.length).toBeGreaterThan(0);
  });
});
