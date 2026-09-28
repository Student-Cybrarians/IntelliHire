import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import Onboarding from './Onboarding';

// Mock fetch
global.fetch = vi.fn();

describe('Onboarding Component', () => {
  it('should render step 1 initially', () => {
    render(
      <BrowserRouter>
        <Onboarding />
      </BrowserRouter>
    );
    expect(screen.getByText('What is your target role?')).toBeInTheDocument();
    expect(screen.getByText('Step 1 of 2')).toBeInTheDocument();
  });

  it('should allow selecting a role and navigating to step 2', () => {
    render(
      <BrowserRouter>
        <Onboarding />
      </BrowserRouter>
    );
    
    const roleButton = screen.getByText('Software Engineer (Frontend, Backend, Fullstack)');
    fireEvent.click(roleButton);
    
    const continueButton = screen.getByText('Continue');
    expect(continueButton).not.toBeDisabled();
    fireEvent.click(continueButton);
    
    expect(screen.getByText('Experience Level')).toBeInTheDocument();
    expect(screen.getByText('Step 2 of 2')).toBeInTheDocument();
  });

  it('should allow submitting the profile', async () => {
    (global.fetch as any).mockResolvedValueOnce({ ok: true });

    render(
      <BrowserRouter>
        <Onboarding />
      </BrowserRouter>
    );
    
    // Step 1
    fireEvent.click(screen.getByText('Product Manager / Owner'));
    fireEvent.click(screen.getByText('Continue'));
    
    // Step 2
    fireEvent.click(screen.getByText('Mid Level'));
    const submitButton = screen.getByText('Generate Blueprint');
    expect(submitButton).not.toBeDisabled();
    fireEvent.click(submitButton);

    expect(global.fetch).toHaveBeenCalledWith('/api/profile', expect.objectContaining({
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        target_role: 'product',
        experience_level: 'mid',
      }),
    }));
  });
});
