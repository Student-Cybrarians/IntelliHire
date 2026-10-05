import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Module4Interviews from './Module4Interviews';

const mockProtocols = {
  success: true,
  protocols: [
    {
      id: 'proto-tech-arch-distributed',
      title: 'Distributed Architecture & Failure Domain Resilience',
      target_role: 'Senior Cloud & Systems Architect',
      domain: 'software',
      interview_type: 'structured_panel',
      seniority_level: 'senior',
      panel_roles: ['Engineering Director', 'Principal Systems Architect'],
      competency_targets: [{ name: 'Distributed Resilience', description: 'CAP theorem', weight: 0.5 }],
      question_sequence: [
        {
          turn: 1,
          panel_role: 'Principal Systems Architect',
          competency: 'Distributed Resilience Under Partition',
          question_type: 'situational',
          question: 'Describe consensus failover between US-East and EU-Central under fiber severance.',
          probe_intent: 'Examine CAP theorem trade-offs.',
          anchored_rubric: {
            unsatisfactory: 'Proposes synchronous 2PC.',
            competent: 'Articulates Raft with local sequence numbers.',
            exceptional: 'Dynamically balances consistency models.'
          }
        }
      ]
    }
  ]
};

const mockCandidate = {
  success: true,
  candidate: {
    id: 'cand-1',
    name: 'Alex Mercer',
    target_role: 'Senior Cloud Architect',
    domain: 'software',
    experience_level: 'senior',
    readiness_score: 78,
    m01_verified_claims_count: 6,
    m02_proficiencies: [{ skill: 'Distributed Systems', competency: 'Resilience', estimate: 82, uncertainty: 15 }],
    m02_diagnosed_misconceptions: ['Distributed Systems: Confusing 2PC with async saga'],
    m03_simulations_demonstrated: [
      {
        title: 'Distributed Token Bucket Rate Limiter',
        domain: 'software',
        type: 'coding',
        score: 88,
        evidence: { key_actions_identified: ['Implemented sliding-window in-memory fallback'] }
      }
    ]
  }
};

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn((url: string, opts?: any) => {
    if (url === '/api/m4/interviews/protocols') {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(mockProtocols) });
    }
    if (url === '/api/m4/interviews/candidates') {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(mockCandidate) });
    }
    if (url === '/api/m4/interviews/sessions' && opts?.method === 'POST') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          session_id: 'session-m4-test-1',
          protocol: mockProtocols.protocols[0],
          active_panel_role: 'Principal Systems Architect',
          current_turn: 1,
          first_question: mockProtocols.protocols[0].question_sequence[0]
        })
      });
    }
    if (url === '/api/m4/interviews/sessions/session-m4-test-1/turn' && opts?.method === 'POST') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          observation_id: 'obs-test-1',
          turn_completed: 1,
          evaluation: {
            score: 85,
            observable_evidence: ['Cited Raft consensus with local quorum'],
            ai_interpretation: { strengths: 'Solid partition tolerance understanding' },
            ai_recommended_probe: 'What is your maximum acceptable failover latency?'
          },
          next_turn: {
            turn_number: 2,
            active_panel_role: 'Engineering Director',
            next_question: null
          }
        })
      });
    }
    if (url === '/api/m4/interviews/sessions/session-m4-test-1/rate' && opts?.method === 'POST') {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) });
    }
    if (url === '/api/m4/interviews/sessions/session-m4-test-1/complete' && opts?.method === 'POST') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          synthesis_id: 'synth-test-1',
          overall_rating: 85,
          strengths: ['Disciplined trade-off reasoning'],
          gaps: ['Calculations under edge conditions'],
          m05_evidence_package: {
            protocol_title: 'Distributed Architecture',
            governance_notice: 'M04 outputs structured evidence and calibrated ratings for human decision support. Automated hiring decisions are strictly prohibited.'
          }
        })
      });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
  }));
});

describe('M04 Calibrated Structured Interview Cockpit UI & Flows', () => {
  it('renders Interview Cockpit with protocol and candidate dossier access', async () => {
    render(<BrowserRouter><Module4Interviews /></BrowserRouter>);

    expect(await screen.findByText('Calibrated Structured Interview Cockpit')).toBeInTheDocument();
    expect(await screen.findByText(/Distributed Architecture & Failure Domain Resilience/i)).toBeInTheDocument();

    // Switch to Dossier Tab
    const dossierTabBtn = screen.getByRole('button', { name: /Candidate M01–M03 Evidence Dossier/i });
    fireEvent.click(dossierTabBtn);

    expect(await screen.findByText('Alex Mercer')).toBeInTheDocument();
    expect(await screen.findByText(/Confusing 2PC with async saga/i)).toBeInTheDocument();
    expect(await screen.findByText('Distributed Token Bucket Rate Limiter')).toBeInTheDocument();
  });

  it('launches structured interview session and renders coordinated panel probe and anchored rubrics', async () => {
    render(<BrowserRouter><Module4Interviews /></BrowserRouter>);

    const launchBtn = await screen.findByRole('button', { name: /Launch Panel Interview/i });
    fireEvent.click(launchBtn);

    expect(await screen.findByText(/Turn 1 · Principal Systems Architect/i)).toBeInTheDocument();
    expect(await screen.findByText(/Describe consensus failover between US-East and EU-Central/i)).toBeInTheDocument();
    expect(await screen.findByText(/L1 · Unsatisfactory/i)).toBeInTheDocument();
    expect(await screen.findByText(/L3 · Competent Standard/i)).toBeInTheDocument();
    expect(await screen.findByText(/L5 · Exceptional Mastery/i)).toBeInTheDocument();
  });

  it('records candidate response, preserves separate human ratings, and completes interview into M05 package', async () => {
    render(<BrowserRouter><Module4Interviews /></BrowserRouter>);

    const launchBtn = await screen.findByRole('button', { name: /Launch Panel Interview/i });
    fireEvent.click(launchBtn);

    // Enter candidate response
    const textarea = await screen.findByPlaceholderText(/Transcribe candidate's response/i);
    fireEvent.change(textarea, { target: { value: 'We isolate network partitions using Raft consensus and local sequence tokens.' } });

    // Select human rating (5 stars)
    const star5 = screen.getByRole('button', { name: /★ 5/i });
    fireEvent.click(star5);

    // Submit turn
    const submitBtn = screen.getByRole('button', { name: /Submit Turn & Advance Panel/i });
    fireEvent.click(submitBtn);

    // Verify completed synthesis renders with ethical governance notice
    expect(await screen.findByText('M05 Calibrated Evidence Package')).toBeInTheDocument();
    expect(await screen.findByText('85%')).toBeInTheDocument();
    expect(await screen.findByText(/Automated hiring decisions are strictly prohibited/i)).toBeInTheDocument();
  });
});
