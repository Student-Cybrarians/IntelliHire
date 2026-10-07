import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Module3Simulation from './Module3Simulation';
import CandidateWorkspace from './dashboard/CandidateWorkspace';

const mockCatalog = {
  success: true,
  simulations: [
    {
      id: 'sim-tech-rate-limiter',
      title: 'Distributed Token Bucket Rate Limiter',
      domain: 'software',
      simulation_type: 'coding',
      target_role: 'Senior Backend Engineer',
      competency_name: 'System Architecture & Concurrency',
      skill_name: 'Distributed Systems & Concurrency',
      difficulty_level: 3,
      is_recommended_for_gap: true,
      scenario: {
        background: 'High-throughput API gateway under brownout conditions.',
        objective: 'Implement an in-memory sliding-window token bucket algorithm.',
        initial_requirements: ['Enforce limit of max 100 requests per 60s window'],
        constraints: ['Memory overhead < 2KB'],
        tools_available: ['TypeScript Code Editor', 'Test Case Runner'],
        expected_output_type: 'source_code',
        starting_data: { template_code: 'class TokenBucketRateLimiter {}' }
      },
      dynamic_injection: {
        trigger_step: 2,
        alert_title: 'EMERGENCY: Redis Cluster Partition',
        new_requirement: 'Implement degraded local fallback mode.',
        constraint_change: 'Global synchronization unavailable.'
      }
    },
    {
      id: 'sim-finance-capex',
      title: 'CapEx ROI & Capital Allocation',
      domain: 'finance',
      simulation_type: 'financial_analysis',
      target_role: 'Senior Financial Analyst',
      competency_name: 'Financial Planning',
      skill_name: 'Capital Budgeting',
      difficulty_level: 3,
      is_recommended_for_gap: false,
      scenario: {
        background: 'Evaluate $15M capex envelope under 8.5% WACC.',
        objective: 'Determine optimal portfolio combination.',
        initial_requirements: ['Calculate NPV and IRR for each project'],
        constraints: ['Spend cannot exceed $15M'],
        tools_available: ['DCF Calculator'],
        expected_output_type: 'financial_model_memo',
        starting_data: { projects: [{ name: 'Alpha', capex: 8000000, cash_flows_y1_5: [2000000] }] }
      },
      dynamic_injection: {
        trigger_step: 2,
        alert_title: 'RATE HIKE: WACC increases to 9.75%',
        new_requirement: 'Re-calculate NPV sensitivity.',
        constraint_change: 'Hurdle rate adjusted upwards.'
      }
    }
  ]
};

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn((url: string, opts?: any) => {
    if (url === '/api/m3/simulations/definitions') {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(mockCatalog) });
    }
    if (url === '/api/m3/simulations/sessions' && opts?.method === 'POST') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          session_id: 'test-session-456',
          session: {
            id: 'test-session-456',
            current_step: 1,
            candidate_work: { template_code: 'class TokenBucketRateLimiter {}' }
          }
        })
      });
    }
    if (url === '/api/m3/simulations/sessions/test-session-456/action' && opts?.method === 'POST') {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, total_actions: 2 }) });
    }
    if (url === '/api/m3/simulations/sessions/test-session-456/execute' && opts?.method === 'POST') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          total_actions: 3,
          execution_result: {
            success: true,
            execution_type: 'code_sandbox',
            status: 'passed',
            output: '✓ Test 1: Under limit (50 reqs) -> 200 OK\n✓ Test 2: Concurrency burst (120 reqs) -> 429 Rate Limited at 101st\n✓ Test 3: Rolling window expiration -> tokens refilled safely\n[Pass: 3/3 Tests]',
            duration_ms: 28,
            test_results: [
              { name: 'Test 1: Under limit (50 reqs) -> 200 OK', passed: true },
              { name: 'Test 2: Concurrency burst (120 reqs) -> 429 Rate Limited at 101st', passed: true },
              { name: 'Test 3: Rolling window expiration -> tokens refilled safely', passed: true }
            ]
          }
        })
      });
    }
    if (url === '/api/m3/simulations/sessions/test-session-456/inject' && opts?.method === 'POST') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          step: 2,
          injection: {
            alert_title: 'EMERGENCY: Redis Cluster Partition',
            new_requirement: 'Implement degraded local fallback mode.',
            constraint_change: 'Global synchronization unavailable.'
          }
        })
      });
    }
    if (url === '/api/m3/simulations/sessions/test-session-456/submit' && opts?.method === 'POST') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          session_id: 'test-session-456',
          evaluation_id: 'eval-789',
          overall_score: 88,
          dimension_scores: {
            correctness: 0.90,
            process: 0.85,
            decision_quality: 0.88,
            constraint_handling: 0.90,
            adaptability: 0.85
          },
          observable_evidence: {
            key_actions_identified: ['Executed 3 validation test suites', 'Handled degraded local mode']
          },
          model_interpretation: {
            strengths: 'Disciplined token calculation under concurrent load.',
            gaps: 'Consider tuning refill granularity.'
          },
          remediation_recommendations: [
            {
              recommended_study: 'Review lock-free concurrency primitives.',
              recommended_practice: 'Practice M02 concurrency scenarios.'
            }
          ]
        })
      });
    }
    // Candidate workspace mocks
    if (url === '/api/dashboard/candidate') {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ profile: { readiness_score: 0.70, target_role: 'Engineer' }, modules: {} }) });
    }
    if (url === '/api/resume/status') {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ claims: [] }) });
    }
    if (url === '/api/requisitions') {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, requisitions: [] }) });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
  }));
});

describe('M03 Simulation Workspace UI & Flow Tests', () => {
  it('loads simulation catalog and filters by discipline', async () => {
    render(<BrowserRouter><Module3Simulation /></BrowserRouter>);

    expect(await screen.findByText('Universal Practice & Simulation Sandbox')).toBeInTheDocument();
    expect(await screen.findByText('Distributed Token Bucket Rate Limiter')).toBeInTheDocument();
    expect(await screen.findByText('CapEx ROI & Capital Allocation')).toBeInTheDocument();

    // Filter to Finance
    const financePill = screen.getByRole('button', { name: /Finance & Accounting/i });
    fireEvent.click(financePill);

    expect(screen.getByText('CapEx ROI & Capital Allocation')).toBeInTheDocument();
    expect(screen.queryByText('Distributed Token Bucket Rate Limiter')).not.toBeInTheDocument();
  });

  it('launches a technical simulation and runs test cases', async () => {
    render(<BrowserRouter><Module3Simulation /></BrowserRouter>);

    const launchBtns = await screen.findAllByRole('button', { name: /Launch Simulation Workspace/i });
    fireEvent.click(launchBtns[0]); // Rate limiter

    expect(await screen.findByText('Scenario Objective')).toBeInTheDocument();
    expect(await screen.findByText(/Implement an in-memory sliding-window token bucket algorithm/i)).toBeInTheDocument();

    // Run test cases
    const runBtn = await screen.findByRole('button', { name: /Run Test Cases/i });
    fireEvent.click(runBtn);

    expect(await screen.findByText(/Pass: 3\/3 Tests/i)).toBeInTheDocument();
  });

  it('handles mid-scenario dynamic constraint shifts', async () => {
    render(<BrowserRouter><Module3Simulation /></BrowserRouter>);

    const launchBtns = await screen.findAllByRole('button', { name: /Launch Simulation Workspace/i });
    fireEvent.click(launchBtns[0]);

    const injectBtn = await screen.findByRole('button', { name: /Trigger Dynamic Constraint Shift/i });
    fireEvent.click(injectBtn);

    expect(await screen.findByText(/EMERGENCY: Redis Cluster Partition/i)).toBeInTheDocument();
    expect(await screen.findByText(/Implement degraded local fallback mode/i)).toBeInTheDocument();
  });

  it('submits simulation and renders multi-dimensional evaluation with M02 feedback loop', async () => {
    render(<BrowserRouter><Module3Simulation /></BrowserRouter>);

    const launchBtns = await screen.findAllByRole('button', { name: /Launch Simulation Workspace/i });
    fireEvent.click(launchBtns[0]);

    const submitBtn = await screen.findByRole('button', { name: /Submit Simulation for Evaluation/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Multi-Dimensional Performance Debrief')).toBeInTheDocument();
    expect((await screen.findAllByText('88%')).length).toBeGreaterThan(0);
    expect(await screen.findByText(/Executed 3 validation test suites/i)).toBeInTheDocument();
    expect(await screen.findByText(/M02 Learning & Practice Feedback Loop/i)).toBeInTheDocument();
  });

  it('verifies CandidateWorkspace has functional link to Simulation Sandbox', async () => {
    render(<BrowserRouter><CandidateWorkspace profileName="Alex Rivera" /></BrowserRouter>);

    const simCard = await screen.findByText('Simulation Sandbox');
    expect(simCard).toBeInTheDocument();
    expect(simCard.closest('a')).toHaveAttribute('href', '/simulation');
  });
});
