import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import Onboarding from './Onboarding';

// Mock fetch
global.fetch = vi.fn();

describe('Onboarding Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockImplementation((url: string) => {
      if (url === '/api/taxonomy/domains') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { id: 'dom_it', name: 'Information Technology', code: '15-0000' }
          ])
        });
      }
      if (url.startsWith('/api/taxonomy/occupations')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { id: 'occ_software_dev', domain_id: 'dom_it', name: 'Software Developer', code: '15-1252' }
          ])
        });
      }
      if (url === '/api/profile') {
        return Promise.resolve({ ok: true });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
  });

  it('should render step 1 initially and fetch domains', async () => {
    render(
      <BrowserRouter>
        <Onboarding />
      </BrowserRouter>
    );
    await waitFor(() => expect(screen.getByText('Information Technology')).toBeInTheDocument());
    expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();
  });

  it('should allow selecting a domain, occupation, and experience', async () => {
    render(
      <BrowserRouter>
        <Onboarding />
      </BrowserRouter>
    );
    
    // Step 1: Domain
    await waitFor(() => expect(screen.getByText('Information Technology')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Information Technology'));
    fireEvent.click(screen.getByText('Continue'));
    
    // Step 2: Occupation Search
    await waitFor(() => expect(screen.getByText('Step 2 of 3')).toBeInTheDocument());
    const input = screen.getByPlaceholderText('Search occupations...');
    fireEvent.change(input, { target: { value: 'soft' } });
    await waitFor(() => expect(screen.getByText('Software Developer')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Software Developer'));
    fireEvent.click(screen.getByText('Continue'));
    
    // Step 3: Experience
    await waitFor(() => expect(screen.getByText('Step 3 of 3')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Mid Level'));
    const submitButton = screen.getByText('Generate Blueprint');
    expect(submitButton).not.toBeDisabled();
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/profile', expect.objectContaining({
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_domain_id: 'dom_it',
          target_occupation_id: 'occ_software_dev',
          experience_level: 'mid',
        }),
      }));
    });
  });
});
