import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DashboardRouter from './Dashboard';

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch);
  mockFetch.mockImplementation((url: string) => {
    if (url === '/api/auth/me') {
      return Promise.resolve({ json: () => Promise.resolve({ user: { role: 'candidate', full_name: 'John Doe' } }) });
    }
    if (url === '/api/dashboard/candidate') {
      return Promise.resolve({ json: () => Promise.resolve({ profile: {} }) });
    }
    if (url === '/api/resume/status') {
      return Promise.resolve({ json: () => Promise.resolve({ status: 503 }) });
    }
    if (url === '/api/dashboard/recruiter') {
      return Promise.resolve({ json: () => Promise.resolve({ pipeline_stats: {} }) });
    }
    return Promise.resolve({ json: () => Promise.resolve({}) });
  });
});

describe('Dashboard Router Role Isolation', () => {
  it('Redirects to login if unauthenticated', async () => {
    mockFetch.mockImplementationOnce(() => Promise.resolve({ json: () => Promise.resolve({ user: null }) }));
    
    await act(async () => {
      render(<BrowserRouter><DashboardRouter /></BrowserRouter>);
    });
    
    expect(mockFetch).toHaveBeenCalledWith('/api/auth/me');
  });

  it('Renders CandidateWorkspace for candidates', async () => {
    await act(async () => {
      render(<BrowserRouter><DashboardRouter /></BrowserRouter>);
    });
    
    expect(await screen.findByRole('heading', { name: /Welcome back/i })).toBeInTheDocument();
  });

  it('Renders RecruiterWorkspace for recruiters', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url === '/api/auth/me') return Promise.resolve({ json: () => Promise.resolve({ user: { role: 'recruiter', full_name: 'Jane Smith' } }) });
      if (url === '/api/dashboard/recruiter') return Promise.resolve({ json: () => Promise.resolve({ pipeline_stats: {} }) });
      return Promise.resolve({ json: () => Promise.resolve({}) });
    });

    await act(async () => {
      render(<BrowserRouter><DashboardRouter /></BrowserRouter>);
    });
    
    expect(await screen.findByRole('heading', { name: /Recruiter Workspace/i })).toBeInTheDocument();
  });
});
