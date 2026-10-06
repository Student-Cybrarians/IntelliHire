import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CandidateWorkspace from './CandidateWorkspace';

describe('Candidate Dashboard Stale Data & Source-of-Truth Reconciliation', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('1. Renders canonical current active resume version and active claims instead of stale history', async () => {
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url === '/api/dashboard/candidate') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            profile: {
              target_role: 'AI / Machine Learning Engineer',
              primary_domain: 'Artificial Intelligence',
              experience_level: 'entry',
              skills_json: '["Prompt Engineering", "NLP", "Python"]',
              readiness_score: 0.70
            },
            modules: {
              resume_uploaded: true,
              data_state: 'current',
              source_version: 12,
              source_filename: 'MOKSHITH_AIML-Resume.pdf'
            }
          })
        });
      }
      if (url === '/api/resume/status') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            status: 'processed',
            data_state: 'current',
            source_version: 12,
            source_filename: 'MOKSHITH_AIML-Resume.pdf',
            claims: [
              { claim_type: 'skill', claim_value: 'Prompt Engineering', verification_state: 'extracted', confidence_score: 0.95 },
              { claim_type: 'skill', claim_value: 'Natural Language Processing', verification_state: 'extracted', confidence_score: 0.92 }
            ]
          })
        });
      }
      if (url === '/api/requisitions') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            requisitions: [
              {
                id: 'req-1',
                title: 'AI Prompt Engineer & Evaluator',
                department: 'Applied AI',
                status: 'open',
                description: 'Evaluate prompt outputs and context engineering',
                application_status: null
              }
            ]
          })
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, pathways: [] }) });
    }));

    await act(async () => {
      render(
        <MemoryRouter>
          <CandidateWorkspace profileName="Mokshith Y" />
        </MemoryRouter>
      );
    });

    // Freshness badge
    expect(screen.getByText('CANONICAL CURRENT')).toBeInTheDocument();
    
    // Target Role and Domain
    expect(screen.getByText('AI / Machine Learning Engineer')).toBeInTheDocument();
    expect(screen.getByText('Artificial Intelligence')).toBeInTheDocument();
    
    // Active Source & Version (v12, not historical)
    expect(screen.getAllByText(/MOKSHITH_AIML-Resume\.pdf/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/2 verified claims/i)).toBeInTheDocument();
    expect(screen.getByText('Prompt Engineering')).toBeInTheDocument();
    expect(screen.getByText('Natural Language Processing')).toBeInTheDocument();

    // Requisition
    expect(screen.getByText('AI Prompt Engineer & Evaluator')).toBeInTheDocument();
  });

  it('2. Correctly renders UPDATING state when multi-pass extraction is pending', async () => {
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url === '/api/dashboard/candidate') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            profile: { target_role: 'Data Scientist' },
            modules: { resume_uploaded: true, data_state: 'updating', source_version: 13 }
          })
        });
      }
      if (url === '/api/resume/status') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            status: 'processing',
            data_state: 'updating',
            source_version: 13,
            source_filename: 'New_Resume_v13.pdf',
            claims: []
          })
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, requisitions: [], pathways: [] }) });
    }));

    await act(async () => {
      render(
        <MemoryRouter>
          <CandidateWorkspace profileName="Mokshith Y" />
        </MemoryRouter>
      );
    });

    expect(screen.getAllByText('UPDATING').length).toBeGreaterThan(0);
    expect(screen.getByText(/Updating Evidence from Resume v13/i)).toBeInTheDocument();
  });

  it('3. Opens Edit Profile modal and submits PUT /api/profile', async () => {
    let putPayload: any = null;
    vi.stubGlobal('fetch', vi.fn((url: string, opts?: any) => {
      if (url === '/api/profile' && opts?.method === 'PUT') {
        putPayload = JSON.parse(opts.body);
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });
      }
      if (url === '/api/dashboard/candidate') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            profile: {
              target_role: putPayload ? putPayload.target_role : 'Initial Role',
              primary_domain: putPayload ? putPayload.primary_domain : 'Initial Domain',
              experience_level: 'mid'
            },
            modules: { resume_uploaded: true }
          })
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, claims: [], requisitions: [], pathways: [] }) });
    }));

    await act(async () => {
      render(
        <MemoryRouter>
          <CandidateWorkspace profileName="Mokshith Y" />
        </MemoryRouter>
      );
    });

    // Click Edit Profile button
    const editBtn = screen.getByText('Edit Profile');
    await act(async () => {
      fireEvent.click(editBtn);
    });

    expect(screen.getByText('Edit Candidate Profile')).toBeInTheDocument();

    // Modify Target Role input
    const roleInput = screen.getByPlaceholderText(/e\.g\. AI \/ Machine Learning Engineer/i);
    await act(async () => {
      fireEvent.change(roleInput, { target: { value: 'Senior AI System Architect' } });
    });

    // Save
    const saveBtn = screen.getByText('Save Changes');
    await act(async () => {
      fireEvent.click(saveBtn);
    });

    await waitFor(() => {
      expect(putPayload).not.toBeNull();
      expect(putPayload.target_role).toBe('Senior AI System Architect');
    });
  });

  it('4. Handles applied requisition with match score display', async () => {
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url === '/api/requisitions') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            requisitions: [
              {
                id: 'req-ai-1',
                title: 'AI Prompt Engineer & Evaluator',
                department: 'Applied AI Research',
                status: 'open',
                application_status: 'submitted',
                match_score: 92,
                match_reasoning: 'Strong prompt engineering and NLP evidence aligned.'
              }
            ]
          })
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, profile: {}, modules: {}, claims: [], pathways: [] }) });
    }));

    await act(async () => {
      render(
        <MemoryRouter>
          <CandidateWorkspace profileName="Mokshith Y" />
        </MemoryRouter>
      );
    });

    expect(screen.getByText('AI Prompt Engineer & Evaluator')).toBeInTheDocument();
    expect(screen.getByText('92%')).toBeInTheDocument();
    expect(screen.getByText(/Strong prompt engineering and NLP evidence aligned/i)).toBeInTheDocument();
    expect(screen.getByText('Applied with Evidence Portfolio')).toBeInTheDocument();
  });
});
