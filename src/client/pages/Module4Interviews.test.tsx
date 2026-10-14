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
            governance_notice: 'M04 outputs structured evidence and calibrated ratings for human decision support. Automated hiring decisions are strictly prohibited.',
            evidence_audit_trail: [
              {
                turn_number: 1,
                interviewer_role: 'Principal Systems Architect',
                question_text: 'Describe consensus failover between US-East and EU-Central under fiber severance.',
                observed_answer: 'We isolate network partitions using Raft consensus and local sequence tokens.',
                extracted_evidence: ['Cited Raft consensus with local sequence tokens'],
                model_interpretation: {
                  strengths: 'Demonstrated solid partition tolerance',
                  gaps: null,
                  rubric_score: 85
                },
                uncertainty: { follow_ups_count: 0, has_unresolved_gaps: false },
                human_judgment: { rating: 5, notes: null, status: 'verified' }
              }
            ]
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

    // Verify completed synthesis renders with ethical governance notice and evidence audit trail
    expect(await screen.findByText('M05 Calibrated Evidence Package')).toBeInTheDocument();
    expect(await screen.findByText('85%')).toBeInTheDocument();
    expect(await screen.findByText(/Automated hiring decisions are strictly prohibited/i)).toBeInTheDocument();
    expect(await screen.findByText('Turn-by-Turn Evidence & Interpretation Audit')).toBeInTheDocument();
    expect(await screen.findByText(/1 Turns Evaluated/i)).toBeInTheDocument();
    expect(await screen.findByText(/Cited Raft consensus with local sequence tokens/i)).toBeInTheDocument();
  });

  it('displays candidate 10-question sequential roadmap, camera readiness check, and ethical invariant', async () => {
    render(<BrowserRouter><Module4Interviews /></BrowserRouter>);

    expect(await screen.findByText(/10-Question Sequential Interview Structure/i)).toBeInTheDocument();
    expect(await screen.findByText(/Deep Technical Execution/i)).toBeInTheDocument();
    expect(await screen.findByText(/Conflict & Stakeholder Alignment/i)).toBeInTheDocument();
    expect(await screen.findByText(/Judgment Under Ambiguity/i)).toBeInTheDocument();
    expect(await screen.findByText(/Privacy & Fairness Invariant/i)).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /Begin 10-Question Personalized Interview/i })).toBeInTheDocument();
  });

  it('resumes active in-progress session with exact turn progress and questions on refresh', async () => {
    // Override fetch to return an active session on question 4 of 10
    const originalFetch = global.fetch;
    vi.stubGlobal('fetch', vi.fn((url: string, opts?: any) => {
      if (url === '/api/m4/interviews/sessions/active') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            active_session: {
              id: 'session-m4-resumed-4',
              status: 'in_progress',
              current_turn: 4,
              total_questions: 10,
              active_panel_role: 'Principal Systems Architect',
              active_question: {
                turn: 4,
                panel_role: 'Principal Systems Architect',
                competency: 'Decision Making Under Incomplete Information',
                question: 'Tell us about a time when you made a critical decision with ambiguous requirements.',
                probe_intent: 'Examine risk assessment heuristics and staging gates.',
                anchored_rubric: {
                  unsatisfactory: 'Paralyzed by ambiguity.',
                  competent: 'Documented core assumptions and staging gates.',
                  exceptional: 'Probabilistic bounds and continuous telemetry.'
                }
              },
              observations: [
                { turn_number: 1, interviewer_role: 'Hiring Manager', question: 'Q1', candidate_response: 'Ans 1' },
                { turn_number: 2, interviewer_role: 'Architect', question: 'Q2', candidate_response: 'Ans 2' },
                { turn_number: 3, interviewer_role: 'Partner', question: 'Q3', candidate_response: 'Ans 3' }
              ]
            }
          })
        });
      }
      return (originalFetch as any)(url, opts);
    }));

    render(<BrowserRouter><Module4Interviews /></BrowserRouter>);

    // Verify session resumption
    expect(await screen.findByText(/Question 4 of 10/i)).toBeInTheDocument();
    expect((await screen.findAllByText(/Decision Making Under Incomplete Information/i)).length).toBeGreaterThan(0);
    expect(await screen.findByText(/Tell us about a time when you made a critical decision with ambiguous requirements/i)).toBeInTheDocument();
    expect(await screen.findByText(/3 turns completed/i)).toBeInTheDocument();
  });

  it('renders Answer Coaching Card with tabs, structure outline, and model answer upon candidate turn submission', async () => {
    // Mock candidate user auth
    const originalFetch = global.fetch;
    vi.stubGlobal('fetch', vi.fn((url: string, opts?: any) => {
      if (url === '/api/auth/me') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ user: { id: 'c1', role: 'candidate', full_name: 'Alex Mercer' } })
        });
      }
      if (url === '/api/m4/interviews/sessions' && opts?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            session_id: 'session-candidate-1',
            active_panel_role: 'Principal Systems Architect',
            current_turn: 1,
            total_questions: 10,
            first_question: mockProtocols.protocols[0].question_sequence[0]
          })
        });
      }
      if (url === '/api/m4/interviews/sessions/session-candidate-1/turn' && opts?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            observation_id: 'obs-c-1',
            turn_completed: 1,
            is_retry: false,
            evaluation: {
              score: 78,
              observable_evidence: ['Detailed consensus architecture']
            },
            coaching: {
              what_worked: ['Directly addressed partition trade-offs'],
              what_to_improve: ['Quantify network heartbeat timeouts'],
              why_it_matters: 'Engineering panels evaluate concrete operational safety bounds.',
              how_to_improve: 'Use Claim-Execution-Impact model.',
              suggested_structure_type: 'CLAIM_EXECUTION_IMPACT',
              suggested_structure_outline: [
                { step: 'Claim', label: 'Technical Thesis', prompt: 'State thesis' },
                { step: 'Execution', label: 'Implementation', prompt: 'Walk through implementation' },
                { step: 'Impact', label: 'Verification', prompt: 'Provide telemetry' }
              ],
              illustrative_improved_answer: '[Claim]: In-memory quorum is ideal. [Execution]: We deployed 3 nodes. [Impact]: 99.99% uptime.',
              anti_hallucination_guarantee: true
            },
            attempts: [{ attempt_number: 1, score: 78 }]
          })
        });
      }
      return (originalFetch as any)(url, opts);
    }));

    render(<BrowserRouter><Module4Interviews /></BrowserRouter>);

    // Launch candidate interview
    const launchBtn = await screen.findByRole('button', { name: /Begin 10-Question Personalized Interview/i });
    fireEvent.click(launchBtn);

    // Enter answer
    const textarea = await screen.findByPlaceholderText(/Transcribe candidate's response/i);
    fireEvent.change(textarea, { target: { value: 'We use Raft with heartbeat leases to isolate partitions.' } });

    // Submit answer
    const submitBtn = screen.getByRole('button', { name: /Submit Response & Receive Coaching/i });
    fireEvent.click(submitBtn);

    // Assert Coaching Card appears
    expect(await screen.findByText('Answer Coaching & Presentation Guidance')).toBeInTheDocument();
    expect(await screen.findByText('Score: 78%')).toBeInTheDocument();
    expect(await screen.findByText('Directly addressed partition trade-offs')).toBeInTheDocument();
    expect(await screen.findByText('Quantify network heartbeat timeouts')).toBeInTheDocument();
    expect(await screen.findByText('Engineering panels evaluate concrete operational safety bounds.')).toBeInTheDocument();

    // Switch to Structure Blueprint Tab
    const blueprintTab = screen.getByRole('button', { name: /Structure Blueprint/i });
    fireEvent.click(blueprintTab);
    expect(await screen.findByText(/Claim: Technical Thesis/i)).toBeInTheDocument();
    expect(await screen.findByText(/Execution: Implementation/i)).toBeInTheDocument();

    // Switch to Model Answer Tab
    const modelTab = screen.getByRole('button', { name: /Model Improved Answer/i });
    fireEvent.click(modelTab);
    expect(await screen.findByText(/Anti-Hallucination Safe Harbor/i)).toBeInTheDocument();
    expect(await screen.findByText(/\[Claim\]: In-memory quorum is ideal/i)).toBeInTheDocument();

    // Verify Continue button is present
    expect(screen.getByRole('button', { name: /Continue to Next Question/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Retry This Question/i })).toBeInTheDocument();
  });

  it('allows candidate to retry answer and renders Retry Comparison Delta banner', async () => {
    const originalFetch = global.fetch;
    vi.stubGlobal('fetch', vi.fn((url: string, opts?: any) => {
      if (url === '/api/auth/me') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ user: { id: 'c1', role: 'candidate', full_name: 'Alex Mercer' } })
        });
      }
      if (url === '/api/m4/interviews/sessions/active') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            active_session: {
              id: 'session-retry-test-1',
              status: 'in_progress',
              current_turn: 1,
              total_questions: 10,
              active_panel_role: 'Principal Systems Architect',
              active_question: mockProtocols.protocols[0].question_sequence[0],
              pending_advance: true,
              active_turn_score: 75,
              active_turn_observation: { candidate_response: 'Initial draft' },
              active_turn_coaching: {
                what_worked: ['Initial attempt'],
                what_to_improve: ['Need telemetry'],
                why_it_matters: 'Telemetry validates architecture.',
                how_to_improve: 'Add metrics.',
                suggested_structure_type: 'STAR',
                suggested_structure_outline: [],
                illustrative_improved_answer: 'Exemplar...'
              },
              active_turn_attempts: [{ attempt_number: 1, score: 75 }]
            }
          })
        });
      }
      if (url === '/api/m4/interviews/sessions/session-retry-test-1/retry' && opts?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            observation_id: 'obs-retry-1',
            turn_completed: 1,
            is_retry: true,
            evaluation: { score: 92, observable_evidence: ['Added 99.99% metric'] },
            coaching: {
              what_worked: ['Excellent quantitative grounding'],
              what_to_improve: ['Minor edge cases'],
              why_it_matters: 'Confidence.',
              how_to_improve: 'Ready.',
              suggested_structure_type: 'STAR',
              suggested_structure_outline: [],
              illustrative_improved_answer: 'Model answer...'
            },
            retry_comparison: {
              attempt_number: 2,
              previous_score: 75,
              current_score: 92,
              score_delta: 17,
              delta_summary: 'Revised attempt improved competency demonstration by +17% points.',
              improvements_noted: ['Included 99.99% availability metric', 'Clear mitigation sequence'],
              remaining_gaps: ['Elaborate on disaster recovery sync'],
              calibration_notice: 'Formative practice metric reflects rubric-aligned presentation guidance and heuristic scoring, not a psychometrically standardized clinical measurement.'
            },
            attempts: [{ attempt_number: 1, score: 75 }, { attempt_number: 2, score: 92 }]
          })
        });
      }
      return (originalFetch as any)(url, opts);
    }));

    render(<BrowserRouter><Module4Interviews /></BrowserRouter>);

    // Candidate clicks Retry This Question
    const retryBtn = await screen.findByRole('button', { name: /Retry This Question/i });
    fireEvent.click(retryBtn);

    // Assert retry editor appears
    expect(await screen.findByText(/Retry Attempt 2/i)).toBeInTheDocument();
    const retryTextarea = screen.getByPlaceholderText(/Draft your refined answer/i);
    fireEvent.change(retryTextarea, { target: { value: 'Revised answer with full 99.99% metrics and quorum details.' } });

    // Submit revised answer
    const submitRetryBtn = screen.getByRole('button', { name: /Submit Revised Answer/i });
    fireEvent.click(submitRetryBtn);

    // Verify Retry Comparison Delta banner appears
    expect(await screen.findByText('Revised Attempt Delta')).toBeInTheDocument();
    expect(await screen.findByText(/75% → 92% \(\+17%\)/i)).toBeInTheDocument();
    expect(await screen.findByText(/Revised attempt improved competency demonstration by \+17% points/i)).toBeInTheDocument();
    expect(await screen.findByText('Included 99.99% availability metric')).toBeInTheDocument();
    expect(await screen.findByText(/Formative practice metric reflects rubric-aligned presentation guidance/i)).toBeInTheDocument();
  });

  it('presents adaptive follow-up probe card when evidence gaps detected and consolidates answered probe into coaching', async () => {
    const originalFetch = global.fetch;
    vi.stubGlobal('fetch', vi.fn((url: string, opts?: any) => {
      if (url === '/api/auth/me') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ user: { id: 'c1', role: 'candidate', full_name: 'Alex Mercer' } })
        });
      }
      if (url === '/api/m4/interviews/sessions' && opts?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            session_id: 'session-candidate-fu',
            active_panel_role: 'Principal Systems Architect',
            current_turn: 1,
            total_questions: 10,
            first_question: mockProtocols.protocols[0].question_sequence[0]
          })
        });
      }
      if (url === '/api/m4/interviews/sessions/session-candidate-fu/turn' && opts?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            observation_id: 'obs-fu-1',
            turn_completed: 1,
            is_retry: false,
            follow_up_required: true,
            follow_up: {
              follow_up_number: 1,
              max_follow_ups: 2,
              practice_objective: 'Practice articulating fault-tolerant failover bounds under partitioned networks.',
              targeted_criterion: 'Architectural trade-offs & fault tolerance',
              candidate_context_referenced: 'We configure consensus replicas.',
              question: 'What heartbeat interval and election timeout do you configure to prevent split-brain?'
            },
            active_follow_up: {
              follow_up_number: 1,
              max_follow_ups: 2,
              practice_objective: 'Practice articulating fault-tolerant failover bounds under partitioned networks.',
              targeted_criterion: 'Architectural trade-offs & fault tolerance',
              candidate_context_referenced: 'We configure consensus replicas.',
              question: 'What heartbeat interval and election timeout do you configure to prevent split-brain?'
            },
            follow_up_decision: {
              warranted: true,
              follow_up_number: 1,
              max_follow_ups: 2,
              targeted_criterion: 'Architectural trade-offs & fault tolerance',
              uncertainty: 'missing_tradeoffs',
              practice_objective: 'Practice articulating fault-tolerant failover bounds under partitioned networks.',
              question: 'What heartbeat interval and election timeout do you configure to prevent split-brain?'
            },
            follow_ups: []
          })
        });
      }
      if (url === '/api/m4/interviews/sessions/session-candidate-fu/follow-up' && opts?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            observation_id: 'obs-fu-1',
            ready_to_advance: true,
            follow_up_required: false,
            active_follow_up: null,
            evaluation: { score: 86, observable_evidence: ['Configured 250ms heartbeat interval and 1000ms election timeouts'] },
            coaching: {
              what_worked: ['Crisp parameter configuration', 'Prevented split-brain with clear bounds'],
              what_to_improve: ['Discuss network jitter handling'],
              why_it_matters: 'Operational resiliency requires bounded timeout heuristics.',
              how_to_improve: 'Reference latency distributions.',
              suggested_structure_type: 'STAR',
              suggested_structure_outline: [],
              illustrative_improved_answer: 'Detailed walkthrough...'
            },
            follow_ups: [
              {
                follow_up_number: 1,
                question: 'What heartbeat interval and election timeout do you configure to prevent split-brain?',
                targeted_criterion: 'Architectural trade-offs & fault tolerance',
                candidate_response: 'We set 250ms heartbeat intervals and 1000ms randomized election timeouts.',
                skipped: false
              }
            ],
            attempts: [{ attempt_number: 1, score: 86 }]
          })
        });
      }
      return (originalFetch as any)(url, opts);
    }));

    render(<BrowserRouter><Module4Interviews /></BrowserRouter>);

    // Launch candidate interview
    const launchBtn = await screen.findByRole('button', { name: /Begin 10-Question Personalized Interview/i });
    fireEvent.click(launchBtn);

    // Enter answer
    const textarea = await screen.findByPlaceholderText(/Transcribe candidate's response/i);
    fireEvent.change(textarea, { target: { value: 'We configure consensus replicas.' } });

    // Submit answer
    const submitBtn = screen.getByRole('button', { name: /Submit Response & Receive Coaching/i });
    fireEvent.click(submitBtn);

    // Assert Adaptive Follow-Up Probe Card appears
    expect(await screen.findByText(/Adaptive Follow-Up Probe \(1 of 2\)/i)).toBeInTheDocument();
    expect(await screen.findByText(/Subordinate to Q1 of 10/i)).toBeInTheDocument();
    expect(await screen.findByText(/Practice articulating fault-tolerant failover bounds/i)).toBeInTheDocument();
    expect(await screen.findByText(/Architectural trade-offs & fault tolerance/i)).toBeInTheDocument();
    expect(await screen.findByText(/What heartbeat interval and election timeout do you configure to prevent split-brain\?/i)).toBeInTheDocument();

    // Fill follow-up response
    const probeInput = screen.getByPlaceholderText(/Address this specific probe with concrete operational actions/i);
    fireEvent.change(probeInput, { target: { value: 'We set 250ms heartbeat intervals and 1000ms randomized election timeouts.' } });

    // Submit follow-up response
    const submitProbeBtn = screen.getByRole('button', { name: /Submit Follow-Up Response/i });
    fireEvent.click(submitProbeBtn);

    // Verify consolidated Answer Coaching and probe history renders
    expect(await screen.findByText('Answer Coaching & Presentation Guidance')).toBeInTheDocument();
    expect(await screen.findByText('Adaptive Probing Evidence Consolidated')).toBeInTheDocument();
    expect(await screen.findByText(/Probe #1: Architectural trade-offs & fault tolerance/i)).toBeInTheDocument();
    expect(await screen.findByText(/Answered \(\+8% Impact\)/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continue to Next Question/i })).toBeInTheDocument();
  });

  it('allows candidate to skip adaptive follow-up probe and proceeds immediately to diagnostic coaching', async () => {
    const originalFetch = global.fetch;
    vi.stubGlobal('fetch', vi.fn((url: string, opts?: any) => {
      if (url === '/api/auth/me') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ user: { id: 'c1', role: 'candidate', full_name: 'Alex Mercer' } })
        });
      }
      if (url === '/api/m4/interviews/sessions/active') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            active_session: {
              id: 'session-skip-1',
              status: 'in_progress',
              current_turn: 2,
              total_questions: 10,
              active_panel_role: 'Engineering Director',
              active_question: {
                turn: 2,
                panel_role: 'Engineering Director',
                competency: 'Conflict & Alignment',
                question: 'Describe navigating technical disagreement.',
                probe_intent: 'Examine constructive resolution.',
                anchored_rubric: { unsatisfactory: '...', competent: '...', exceptional: '...' }
              },
              active_follow_up: {
                follow_up_number: 1,
                max_follow_ups: 2,
                practice_objective: 'Deepen demonstration of personal mediation actions.',
                targeted_criterion: 'Personal agency vs team consensus',
                candidate_context_referenced: 'We had a debate on schema versioning.',
                question: 'What specific steps did you personally take to reconcile differing viewpoints?'
              },
              candidate_response: 'We had a debate on schema versioning.'
            }
          })
        });
      }
      if (url === '/api/m4/interviews/sessions/session-skip-1/follow-up' && opts?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            observation_id: 'obs-skip-1',
            ready_to_advance: true,
            follow_up_required: false,
            active_follow_up: null,
            evaluation: { score: 72 },
            coaching: {
              what_worked: ['Identified architectural disagreement'],
              what_to_improve: ['Highlight personal leadership steps'],
              why_it_matters: 'Directors evaluate leadership agency.',
              how_to_improve: 'Focus on consensus framework.',
              suggested_structure_type: 'CAR',
              suggested_structure_outline: [],
              illustrative_improved_answer: 'Model CAR answer...'
            },
            follow_ups: [
              {
                follow_up_number: 1,
                question: 'What specific steps did you personally take to reconcile differing viewpoints?',
                targeted_criterion: 'Personal agency vs team consensus',
                candidate_response: null,
                skipped: true
              }
            ],
            attempts: [{ attempt_number: 1, score: 72 }]
          })
        });
      }
      return (originalFetch as any)(url, opts);
    }));

    render(<BrowserRouter><Module4Interviews /></BrowserRouter>);

    // Verify follow-up probe card rendered from active session
    expect(await screen.findByText(/Adaptive Follow-Up Probe \(1 of 2\)/i)).toBeInTheDocument();
    expect(await screen.findByText(/What specific steps did you personally take to reconcile differing viewpoints\?/i)).toBeInTheDocument();

    // Click skip button
    const skipBtn = screen.getByRole('button', { name: /Skip Follow-Up & View Coaching →/i });
    fireEvent.click(skipBtn);

    // Verify coaching is shown with skipped probe logged
    expect(await screen.findByText('Answer Coaching & Presentation Guidance')).toBeInTheDocument();
    expect(await screen.findByText('Adaptive Probing Evidence Consolidated')).toBeInTheDocument();
    expect(await screen.findByText(/Probe #1: Personal agency vs team consensus/i)).toBeInTheDocument();
    expect(await screen.findByText('Skipped')).toBeInTheDocument();
  });

  it('restores pending follow-up state seamlessly on page refresh without dropping candidate context', async () => {
    const originalFetch = global.fetch;
    vi.stubGlobal('fetch', vi.fn((url: string, opts?: any) => {
      if (url === '/api/auth/me') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ user: { id: 'c1', role: 'candidate', full_name: 'Alex Mercer' } })
        });
      }
      if (url === '/api/m4/interviews/sessions/active') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            active_session: {
              id: 'session-resume-probe-2',
              status: 'in_progress',
              current_turn: 3,
              total_questions: 10,
              active_panel_role: 'Principal Systems Architect',
              active_question: mockProtocols.protocols[0].question_sequence[0],
              active_follow_up: {
                follow_up_number: 2,
                max_follow_ups: 2,
                practice_objective: 'Practice quantifying degradation metrics under network partition.',
                targeted_criterion: 'Quantifiable metrics & observability',
                candidate_context_referenced: 'We configured heartbeat leases.',
                question: 'How do you measure and alert on failover latency across regions?'
              },
              follow_ups: [
                {
                  follow_up_number: 1,
                  question: 'What heartbeat interval do you use?',
                  targeted_criterion: 'Architectural trade-offs',
                  candidate_response: '250ms interval',
                  skipped: false
                }
              ]
            }
          })
        });
      }
      return (originalFetch as any)(url, opts);
    }));

    render(<BrowserRouter><Module4Interviews /></BrowserRouter>);

    // Assert probe 2 of 2 is rendered immediately
    expect(await screen.findByText(/Adaptive Follow-Up Probe \(2 of 2\)/i)).toBeInTheDocument();
    expect(await screen.findByText(/Subordinate to Q3 of 10/i)).toBeInTheDocument();
    expect(await screen.findByText(/How do you measure and alert on failover latency across regions\?/i)).toBeInTheDocument();
    expect(await screen.findByText(/Practice quantifying degradation metrics under network partition/i)).toBeInTheDocument();
  });

  it('displays an accessible error alert banner when starting an interview session fails', async () => {
    const originalFetch = global.fetch;
    vi.stubGlobal('fetch', vi.fn((url: string, opts?: any) => {
      if (url === '/api/auth/me') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ user: { id: 'c1', role: 'candidate', full_name: 'Alex Mercer' } })
        });
      }
      if (url === '/api/m4/interviews/sessions' && opts?.method === 'POST') {
        return Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({
            success: false,
            error: 'Failed to start interview session. Please try again.'
          })
        });
      }
      return (originalFetch as any)(url, opts);
    }));

    render(<BrowserRouter><Module4Interviews /></BrowserRouter>);

    const launchBtn = await screen.findByRole('button', { name: /Begin 10-Question Personalized Interview/i });
    fireEvent.click(launchBtn);

    const alertBanner = await screen.findByRole('alert');
    expect(alertBanner).toBeInTheDocument();
    expect(alertBanner).toHaveTextContent('Failed to start interview session. Please try again.');
  });

  it('renders Pre-Interview Evidence Grounding Card with candidate skills, target role customization, and interaction mode selection', async () => {
    render(<BrowserRouter><Module4Interviews /></BrowserRouter>);

    // Verify Evidence Grounding Card headers
    expect(await screen.findByText(/Personalized 10-Question Voice AI Mock Interview/i)).toBeInTheDocument();
    expect(await screen.findByText(/Candidate Evidence Grounding & Protocol Calibration/i)).toBeInTheDocument();
    expect(await screen.findByText(/Target Job Role & Interview Focus/i)).toBeInTheDocument();
    expect(await screen.findByText(/Verified Competencies \(M01 \/ M02\)/i)).toBeInTheDocument();

    // Verify Ethical AI Invariant
    expect(await screen.findByText(/Zero biometric profiling, emotion inference, or facial scoring/i)).toBeInTheDocument();

    // Verify Interaction Modes
    expect(await screen.findByText(/Real-Time Voice AI \(Recommended\)/i)).toBeInTheDocument();
    expect(await screen.findByText(/Accessible Text Mode/i)).toBeInTheDocument();

    // Verify customize target role button
    const customizeBtn = await screen.findByRole('button', { name: /Customize Role \/ JD/i });
    expect(customizeBtn).toBeInTheDocument();
    fireEvent.click(customizeBtn);

    const roleInput = await screen.findByPlaceholderText(/e\.g\. Lead Cloud Security Engineer/i);
    expect(roleInput).toBeInTheDocument();
    fireEvent.change(roleInput, { target: { value: 'Principal Cybersecurity Architect' } });
    expect(roleInput).toHaveValue('Principal Cybersecurity Architect');
  });

  it('renders Voice AI Status Bar, microphone controls, and speech synthesis buttons during active question turn', async () => {
    let sentPayload: any = null;
    const originalFetch = global.fetch;
    vi.stubGlobal('fetch', vi.fn((url: string, opts?: any) => {
      if (url === '/api/m4/interviews/sessions' && opts?.method === 'POST') {
        sentPayload = JSON.parse(opts.body);
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            session_id: 'session-voice-test-1',
            protocol: mockProtocols.protocols[0],
            active_panel_role: 'Principal Systems Architect',
            current_turn: 1,
            first_question: mockProtocols.protocols[0].question_sequence[0]
          })
        });
      }
      return (originalFetch as any)(url, opts);
    }));

    render(<BrowserRouter><Module4Interviews /></BrowserRouter>);

    const launchBtn = await screen.findByRole('button', { name: /Launch 10-Question Personalized Interview/i });
    fireEvent.click(launchBtn);

    // Assert session was started with personalized flag
    await waitFor(() => {
      expect(sentPayload).toBeDefined();
      expect(sentPayload.personalized).toBe(true);
    });

    // Assert Voice Status Bar is rendered
    expect(await screen.findByText(/Your Turn to Respond/i)).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /Start Speaking \(Microphone\)/i })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /Replay Question Aloud/i })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /Switch to Text Mode/i })).toBeInTheDocument();

    // Switch to Text Mode
    const switchBtn = await screen.findByRole('button', { name: /Switch to Text Mode/i });
    fireEvent.click(switchBtn);
    expect(await screen.findByText(/Switch to Voice AI Mode/i)).toBeInTheDocument();
  });

  it('navigates to Live Human HR Interview tab and renders scheduling card with invitation list', async () => {
    const originalFetch = global.fetch;
    vi.stubGlobal('fetch', vi.fn((url: string, opts?: any) => {
      if (url === '/api/auth/me') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ user: { id: 'recruiter-1', role: 'recruiter', full_name: 'Lead Recruiter' } })
        });
      }
      if (url === '/api/m4/human-interviews/invitations') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            invitations: [
              {
                id: 'inv-1',
                room_id: 'room-1',
                target_role: 'Senior Cloud & Systems Architect',
                candidate_name: 'Alex Mercer',
                candidate_email: 'alex@intellihire.test',
                scheduled_start_time: '2026-10-25T14:00:00Z',
                status: 'scheduled',
                interview_type: 'technical_and_behavioral',
                interviewer_token: 'tok-intv-1',
                interviewer_join_url: '/interviews?room=room-1&token=tok-intv-1'
              }
            ]
          })
        });
      }
      if (url === '/api/m4/interviews/candidates') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            candidates: [
              { user_id: 'c1', full_name: 'Alex Mercer', email: 'alex@intellihire.test', target_role: 'Cloud Architect' }
            ]
          })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, protocols: [] })
      });
    }));

    render(<BrowserRouter><Module4Interviews /></BrowserRouter>);

    // Click Live Human HR Interview tab
    const humanTab = await screen.findByRole('button', { name: /Live Human HR Interview/i });
    fireEvent.click(humanTab);

    // Verify Scheduling Card renders
    expect(await screen.findByText(/Real Human HR Interview Scheduling & Live Video Rooms/i)).toBeInTheDocument();
    expect(await screen.findByText(/Scheduled & Active Human Interviews \(1\)/i)).toBeInTheDocument();
    expect(await screen.findByText(/Senior Cloud & Systems Architect/i)).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /Schedule Human Interview/i })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /Enter Live Room/i })).toBeInTheDocument();
  });

  it('enters Live Room with WebRTC controls and grounded interviewer workspace', async () => {
    // Mock navigator.mediaDevices.getUserMedia
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [
            { stop: vi.fn(), enabled: true },
            { stop: vi.fn(), enabled: true }
          ],
          getAudioTracks: () => [{ enabled: true }],
          getVideoTracks: () => [{ enabled: true }]
        }),
        enumerateDevices: vi.fn().mockResolvedValue([])
      },
      writable: true,
      configurable: true
    });

    // Mock RTCPeerConnection
    global.RTCPeerConnection = vi.fn().mockImplementation(() => ({
      addTrack: vi.fn(),
      createOffer: vi.fn().mockResolvedValue({ type: 'offer', sdp: 'dummy-sdp' }),
      setLocalDescription: vi.fn().mockResolvedValue(undefined),
      setRemoteDescription: vi.fn().mockResolvedValue(undefined),
      createAnswer: vi.fn().mockResolvedValue({ type: 'answer', sdp: 'dummy-sdp' }),
      addIceCandidate: vi.fn().mockResolvedValue(undefined),
      close: vi.fn(),
      iceConnectionState: 'connected'
    })) as any;

    const originalFetch = global.fetch;
    vi.stubGlobal('fetch', vi.fn((url: string, opts?: any) => {
      if (url === '/api/auth/me') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ user: { id: 'recruiter-1', role: 'recruiter', full_name: 'Lead Recruiter' } })
        });
      }
      if (url === '/api/m4/human-interviews/rooms/join') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            room_id: 'room-1',
            participant_role: 'interviewer',
            room_status: 'in_progress',
            recording_enabled: false,
            candidate_recording_consent: false,
            interviewer_recording_consent: false,
            invitation: {
              id: 'inv-1',
              target_role: 'Senior Cloud & Systems Architect',
              interview_type: 'technical_and_behavioral',
              scheduled_start_time: '2026-10-25T14:00:00Z'
            },
            candidate_context: {
              name: 'Alex Mercer',
              profile: { experience_level: 'Senior' },
              resume_data: { skills: ['Distributed Systems', 'Cloud Security'] }
            },
            workspace_state: {
              questions: [
                {
                  id: 'q-1',
                  category: 'technical_execution',
                  competency: 'Distributed Systems Architecture',
                  question: 'How do you handle split-brain partitions in multi-region clusters?',
                  provenance_note: 'Grounded in candidate verified skills',
                  status: 'suggested'
                }
              ]
            }
          })
        });
      }
      if (url.includes('/api/m4/human-interviews/rooms/room-1/signals')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, signals: [] })
        });
      }
      if (url.includes('/api/m4/human-interviews/invitations')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            invitations: [
              {
                id: 'inv-1',
                room_id: 'room-1',
                target_role: 'Senior Cloud & Systems Architect',
                candidate_name: 'Alex Mercer',
                candidate_email: 'alex@intellihire.test',
                scheduled_start_time: '2026-10-25T14:00:00Z',
                status: 'scheduled',
                interview_type: 'technical_and_behavioral',
                interviewer_token: 'tok-intv-1',
                interviewer_join_url: '/interviews?room=room-1&token=tok-intv-1'
              }
            ]
          })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, invitations: [] })
      });
    }));

    render(<BrowserRouter><Module4Interviews /></BrowserRouter>);

    // Click Live Human HR Interview tab
    const humanTab = await screen.findByRole('button', { name: /Live Human HR Interview/i });
    fireEvent.click(humanTab);

    // Click Enter Live Room
    const enterRoomBtn = await screen.findByRole('button', { name: /Enter Live Room/i });
    fireEvent.click(enterRoomBtn);

    // Verify Live Room & Workspace components are mounted
    expect(await screen.findByText(/Live Human Interview/i)).toBeInTheDocument();
    expect(await screen.findByText(/Interviewer Evaluation Workspace/i)).toBeInTheDocument();
    expect(await screen.findByText(/How do you handle split-brain partitions in multi-region clusters\?/i)).toBeInTheDocument();
    expect(await screen.findByPlaceholderText(/Record confidential notes, technical depth observations/i)).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /Conclude & Evaluate/i })).toBeInTheDocument();
  });
});



