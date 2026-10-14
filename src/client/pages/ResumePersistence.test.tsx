import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Resume from './Resume';

describe('M01 State Persistence & Stuck Loading Reliability Frontend Integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('1. Restores canonical active resume, claims, target requirements, and match analysis on initial mount', async () => {
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url === '/api/auth/me') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ user: { id: 'cand-1', role: 'candidate', email: 'mokshith@test.com' } })
        });
      }
      if (url === '/api/m1/state') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            has_resume: true,
            resume: { id: 'res-v12', version: 12, filename: 'MOKSHITH_AIML.pdf', file_format: 'pdf' },
            resume_data: { skills: ['Prompt Engineering', 'Context Optimization', 'Python'] },
            claims: [
              { claim_type: 'skill', claim_value: 'Prompt Engineering', verification_state: 'extracted' }
            ],
            has_jd: true,
            jd: { id: 'jd-1', raw_text: 'Lead AI Engineer specializing in LLMs' },
            jd_data: {
              requirements: [
                { requirement: 'Prompt Engineering', importance: 'MANDATORY' },
                { requirement: 'Evaluation Benchmarks', importance: 'PREFERRED' }
              ]
            },
            has_match: true,
            match_data: {
              ats_score: 92,
              gap_analysis: [
                { requirement: 'Prompt Engineering', status: 'DEMONSTRATED' }
              ],
              improvement_suggestions: [
                { text: 'Add quantified throughput metrics' }
              ]
            },
            match_stale: false,
            freshness: 'current'
          })
        });
      }
      return Promise.reject(new Error(`Unhandled fetch url: ${url}`));
    }));

    render(
      <MemoryRouter>
        <Resume />
      </MemoryRouter>
    );

    // Initial loading indicator should resolve
    await waitFor(() => {
      expect(screen.queryByText(/Restoring candidate intelligence workspace/i)).not.toBeInTheDocument();
    });

    // Verify restored resume document & skills
    expect(screen.getByText(/MOKSHITH_AIML.pdf/i)).toBeInTheDocument();
    expect(screen.getByText(/v12/i)).toBeInTheDocument();
    expect(screen.getAllByText('Prompt Engineering').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Context Optimization')).toBeInTheDocument();

    // Verify restored JD requirements
    expect(screen.getByText('Evaluation Benchmarks')).toBeInTheDocument();

    // Verify restored match analysis & ATS score
    expect(screen.getByText(/ATS & Match Analysis/i)).toBeInTheDocument();
    expect(screen.getByText(/92/)).toBeInTheDocument();
    expect(screen.getByText(/Saved/i)).toBeInTheDocument();
  });

  it('2. Candidate draft is saved to candidate-scoped sessionStorage and restored on return', async () => {
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url === '/api/auth/me') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ user: { id: 'cand-42', role: 'candidate' } })
        });
      }
      if (url === '/api/m1/state') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            has_resume: true,
            resume: { id: 'res-v1', version: 1, filename: 'Candidate_Resume.pdf' },
            resume_data: { skills: ['TypeScript'] },
            claims: [],
            has_jd: false,
            jd: null,
            jd_data: null,
            has_match: false,
            match_data: null
          })
        });
      }
      return Promise.reject(new Error(`Unhandled fetch url: ${url}`));
    }));

    // Seed candidate-scoped draft in sessionStorage
    sessionStorage.setItem('intellihire_m1_draft_cand-42', JSON.stringify({
      jdTextDraft: 'Seeking a Staff Software Engineer with Cloudflare Workers expertise.',
      acceptedSuggestions: []
    }));

    render(
      <MemoryRouter>
        <Resume />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText(/Restoring candidate intelligence workspace/i)).not.toBeInTheDocument();
    });

    // Check that draft text is populated in textarea
    const textarea = screen.getByPlaceholderText(/Paste Job Description here/i) as HTMLTextAreaElement;
    expect(textarea.value).toBe('Seeking a Staff Software Engineer with Cloudflare Workers expertise.');
  });

  it('3. Stuck loading reliability: stops polling, clears spinner, displays error with in-place retry button', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    let pollCount = 0;
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url === '/api/auth/me') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ user: { id: 'cand-1', role: 'candidate' } })
        });
      }
      if (url === '/api/m1/state') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            has_resume: true,
            resume: { id: 'res-1', version: 1, filename: 'Test.pdf' },
            resume_data: { skills: ['React'] },
            claims: [],
            has_jd: true,
            jd: { id: 'jd-1', raw_text: 'Job description' },
            jd_data: { requirements: [{ requirement: 'React' }] },
            has_match: false,
            match_data: null
          })
        });
      }
      if (url === '/api/match/run') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, job_id: 'job-stuck-99' })
        });
      }
      if (url.startsWith('/api/match/status/job-stuck-99')) {
        pollCount++;
        // Always return PENDING to simulate hung worker/provider
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, status: 'PENDING', progress: 20 })
        });
      }
      return Promise.reject(new Error(`Unhandled fetch url: ${url}`));
    }));

    render(
      <MemoryRouter>
        <Resume />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Run Intelligence Match/i)).toBeInTheDocument();
    });

    const matchBtn = screen.getByText(/Run Intelligence Match/i);
    await act(async () => {
      fireEvent.click(matchBtn);
    });

    // Verify spinner starts
    expect(screen.getByText(/Correlating evidence against requirements/i)).toBeInTheDocument();

    // Advance through the bounded polling intervals (15 attempts * 2000ms = 30s)
    for (let i = 0; i < 16; i++) {
      await act(async () => {
        vi.advanceTimersByTime(2100);
      });
    }

    // Verify that the spinner is STOPPED and error notice with retry is shown
    await waitFor(() => {
      expect(screen.queryByText(/Correlating evidence against requirements/i)).not.toBeInTheDocument();
      expect(screen.getByText(/Attention Required/i)).toBeInTheDocument();
      expect(screen.getByText(/longer than expected/i)).toBeInTheDocument();
      expect(screen.getByText(/Retry Match Analysis/i)).toBeInTheDocument();
    });

    vi.useRealTimers();
  });

  it('4. Reset Module 1 workflow: confirmation modal, calls /api/m1/reset, clears working state, preserves resume', async () => {
    let resetCalled = false;
    vi.stubGlobal('fetch', vi.fn((url: string, opts?: any) => {
      if (url === '/api/auth/me') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ user: { id: 'cand-1', role: 'candidate' } })
        });
      }
      if (url === '/api/m1/state') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            has_resume: true,
            resume: { id: 'res-v12', version: 12, filename: 'MOKSHITH_AIML.pdf' },
            resume_data: { skills: ['Prompt Engineering'] },
            claims: [],
            has_jd: true,
            jd: { id: 'jd-1', raw_text: 'JD text' },
            jd_data: { requirements: [{ requirement: 'Prompt Engineering' }] },
            has_match: true,
            match_data: { ats_score: 90 },
            match_stale: false
          })
        });
      }
      if (url === '/api/m1/reset' && opts?.method === 'POST') {
        resetCalled = true;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, message: 'Module 1 working state reset.' })
        });
      }
      return Promise.reject(new Error(`Unhandled fetch url: ${url}`));
    }));

    // Seed draft in session storage
    sessionStorage.setItem('intellihire_m1_draft_cand-1', JSON.stringify({ jdTextDraft: 'Draft JD' }));

    render(
      <MemoryRouter>
        <Resume />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Reset Module 1/i)).toBeInTheDocument();
    });

    // Click Reset button to trigger confirmation modal
    fireEvent.click(screen.getByText(/Reset Module 1/i));

    // Modal should be visible
    expect(screen.getByText(/Reset Module 1\?/i)).toBeInTheDocument();
    expect(screen.getByText(/Your original uploaded evidence and parsed skills remain protected/i)).toBeInTheDocument();

    // Confirm reset
    const confirmBtn = screen.getByText(/Confirm Reset/i);
    await act(async () => {
      fireEvent.click(confirmBtn);
    });

    await waitFor(() => {
      expect(resetCalled).toBe(true);
      expect(screen.queryByText(/Reset Module 1\?/i)).not.toBeInTheDocument();
    });

    // Session storage draft should be removed
    expect(sessionStorage.getItem('intellihire_m1_draft_cand-1')).toBeNull();

    // Target requirements and match state should be cleared, but resume document stays
    expect(screen.getByText(/MOKSHITH_AIML.pdf/i)).toBeInTheDocument();
    expect(screen.queryByText(/ATS & Match Analysis/i)).not.toBeInTheDocument();
  });

  it('5. Candidate Isolation: prevents draft leakage between different candidates', async () => {
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url === '/api/auth/me') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ user: { id: 'cand-alice', role: 'candidate' } })
        });
      }
      if (url === '/api/m1/state') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            has_resume: true,
            resume: { id: 'res-alice', version: 1, filename: 'Alice.pdf' },
            resume_data: { skills: ['Rust'] },
            claims: [],
            has_jd: false,
            jd: null,
            jd_data: null,
            has_match: false,
            match_data: null
          })
        });
      }
      return Promise.reject(new Error(`Unhandled fetch url: ${url}`));
    }));

    // Bob has draft stored
    sessionStorage.setItem('intellihire_m1_draft_cand-bob', JSON.stringify({
      jdTextDraft: 'Bob confidential target job description',
      acceptedSuggestions: []
    }));

    render(
      <MemoryRouter>
        <Resume />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText(/Restoring candidate intelligence workspace/i)).not.toBeInTheDocument();
    });

    // Alice should NOT have Bob's draft text
    const textarea = screen.getByPlaceholderText(/Paste Job Description here/i) as HTMLTextAreaElement;
    expect(textarea.value).toBe('');
    expect(screen.queryByText(/Bob confidential target job description/i)).not.toBeInTheDocument();
  });

  it('6. Renders structured experience/education/quality analysis, supports candidate field editing, and applies edited optimization suggestions', async () => {
    let contextUpdatedBody: any = null;
    let optimizeSubmittedBody: any = null;

    vi.stubGlobal('fetch', vi.fn((url: string, opts?: any) => {
      if (url === '/api/auth/me') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ user: { id: 'cand-1', role: 'candidate' } })
        });
      }
      if (url === '/api/m1/state') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            has_resume: true,
            resume: { id: 'res-v15', version: 15, filename: 'MOKSHITH_AIML.pdf', file_format: 'pdf' },
            resume_data: {
              skills: ['Python', 'Java'],
              experience: [{ company: 'NeuralTech', title: 'AI Engineer', duration: '2024 - Present' }],
              education: ['B.Tech in Artificial Intelligence'],
              certifications: ['AWS Certified ML Specialty'],
              achievements: ['Reduced model latency by 42%'],
              quality_analysis: {
                overall_quality_score: 95,
                checks: [{ dimension: 'Skills Inventory', status: 'PASS', detail: '2 verified skills' }],
                missing_sections: []
              }
            },
            claims: [],
            has_jd: true,
            jd: { id: 'jd-1', raw_text: 'Senior AI Engineer' },
            jd_data: { requirements: [{ requirement: 'Python & FastAPI', importance: 'MANDATORY' }] },
            has_match: true,
            match_data: {
              ats_score: 78,
              gap_analysis: [
                { requirement: 'Python & FastAPI', status: 'UNCERTAIN', candidate_evidence: 'Python found; missing FastAPI', explanation: 'Partial match' }
              ],
              contradictions: [
                { claim: '10 years Kubernetes', evidence: 'Graduated in 2024', explanation: 'Timeline mismatch requires review' }
              ],
              improvement_suggestions: [
                { source_evidence: 'AI Engineer at NeuralTech', suggested_text: 'Built FastAPI & Python inference services at NeuralTech.', rationale: 'Highlights FastAPI experience.' }
              ]
            },
            match_stale: false
          })
        });
      }
      if (url === '/api/resume/res-v15/context' && opts?.method === 'PUT') {
        contextUpdatedBody = JSON.parse(opts.body);
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: {
              ...contextUpdatedBody,
              provenance: { confidence: 'candidate_verified' }
            }
          })
        });
      }
      if (url === '/api/resume/res-v15/optimize' && opts?.method === 'POST') {
        optimizeSubmittedBody = JSON.parse(opts.body);
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            new_resume_id: 'res-v16',
            version: 16,
            data: { skills: ['Python', 'Java', 'FastAPI'] }
          })
        });
      }
      return Promise.reject(new Error(`Unhandled fetch url: ${url}`));
    }));

    render(
      <MemoryRouter>
        <Resume />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Resume Quality & Completeness/i)).toBeInTheDocument();
    });

    // Verify structured fields and contradictions are displayed
    expect(screen.getByText('NeuralTech')).toBeInTheDocument();
    expect(screen.getByText('B.Tech in Artificial Intelligence')).toBeInTheDocument();
    expect(screen.getByText('AWS Certified ML Specialty')).toBeInTheDocument();
    expect(screen.getByText(/Flagged Contradictions & Review Alerts/i)).toBeInTheDocument();
    expect(screen.getByText(/UNCERTAIN \/ PARTIAL/i)).toBeInTheDocument();

    // Test candidate editing of extracted fields
    fireEvent.click(screen.getByText(/Edit Extracted Fields/i));
    const skillsInput = screen.getByLabelText(/Verified Skills \(comma-separated\)/i) as HTMLInputElement;
    fireEvent.change(skillsInput, { target: { value: 'Python, Java, FastAPI' } });
    await act(async () => {
      fireEvent.click(screen.getByText(/Save Verified Profile/i));
    });

    await waitFor(() => {
      expect(contextUpdatedBody?.skills).toEqual(['Python', 'Java', 'FastAPI']);
      expect(screen.getByText('FastAPI')).toBeInTheDocument();
    });

    // Test editing suggestion text and applying optimization
    const suggestionTextarea = screen.getByLabelText('Edit suggestion 1') as HTMLTextAreaElement;
    fireEvent.change(suggestionTextarea, { target: { value: 'Custom verified FastAPI & Python microservice architecture.' } });

    const checkbox = screen.getByLabelText('Accept suggestion 1');
    fireEvent.click(checkbox);

    const applyBtn = screen.getByText(/Apply 1 Optimizations/i);
    await act(async () => {
      fireEvent.click(applyBtn);
    });

    await waitFor(() => {
      expect(optimizeSubmittedBody?.accepted_suggestions?.[0]?.suggested_text).toBe('Custom verified FastAPI & Python microservice architecture.');
      expect(screen.getAllByText(/v16/i).length).toBeGreaterThanOrEqual(1);
    });
  });
});
