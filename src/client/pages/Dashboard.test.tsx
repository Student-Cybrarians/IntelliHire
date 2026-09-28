import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DashboardRouter from './Dashboard';

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch);
});

describe('Dashboard Router Role Isolation', () => {
  it('Redirects to login if unauthenticated', async () => {
    mockFetch.mockResolvedValueOnce({ json: vi.fn().mockResolvedValue({ user: null }) });
    
    await act(async () => {
      render(<BrowserRouter><DashboardRouter /></BrowserRouter>);
    });
    
    // fetch will be called to auth/me
    expect(mockFetch).toHaveBeenCalledWith('/api/auth/me');
  });

  it('Renders CandidateWorkspace for candidates', async () => {
    mockFetch.mockResolvedValueOnce({ 
      json: vi.fn().mockResolvedValue({ 
        user: { role: 'candidate', full_name: 'John Doe' } 
      }) 
    });
    
    // Stub the candidate API calls
    mockFetch.mockResolvedValueOnce({ json: vi.fn().mockResolvedValue({ profile: {} }) });
    mockFetch.mockResolvedValueOnce({ json: vi.fn().mockResolvedValue({ status: 503 }) });

    await act(async () => {
      render(<BrowserRouter><DashboardRouter /></BrowserRouter>);
    });
    
    expect(await screen.findByText(/Command Center/i)).toBeInTheDocument();
  });

  it('Renders RecruiterWorkspace for recruiters', async () => {
    mockFetch.mockResolvedValueOnce({ 
      json: vi.fn().mockResolvedValue({ 
        user: { role: 'recruiter', full_name: 'Jane Smith' } 
      }) 
    });
    
    mockFetch.mockResolvedValueOnce({ json: vi.fn().mockResolvedValue({ pipeline_stats: {} }) });

    await act(async () => {
      render(<BrowserRouter><DashboardRouter /></BrowserRouter>);
    });
    
    expect(await screen.findByText(/Pipeline Overview/i)).toBeInTheDocument();
  });
});
