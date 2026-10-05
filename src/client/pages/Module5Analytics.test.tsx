import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Module5Analytics from './Module5Analytics';

describe('Priority 17: M05 Candidate Readiness + Evidence Synthesis + Governance UI & Flow Tests', () => {

  const mockCandidate = {
    id: 'cand-test-1',
    name: 'Elena Rostova',
    email: 'elena@example.com',
    target_role: 'Senior Distributed Architect',
    domain: 'software',
    experience_level: 'senior',
    overall_readiness_index: 0.88,
    uncertainty_index: 0.12,
    evidence_count: 8,
    decision_status: 'pending',
    last_synthesized_at: '2026-10-06T00:00:00Z'
  };

  const mockDossier = {
    candidate: mockCandidate,
    readiness_profile: {
      target_role: 'Senior Distributed Architect',
      domain: 'software',
      seniority_level: 'senior',
      overall_readiness_index: 0.88,
      uncertainty_index: 0.12,
      composition: {
        competency_coverage: 85,
        evidence_strength: 90,
        assessment_proficiency: 84,
        simulation_performance: 89,
        interview_alignment: 85,
        consistency_rating: 92
      },
      triangulation: {
        'Distributed Resiliency': {
          m02_score: 88,
          m03_score: 92,
          m04_rating: 4.5,
          status: 'CONVERGENT',
          notes: 'High concordance across theoretical item validation and chaos mesh failure handling.'
        }
      },
      strengths: [
        'High architectural fault tolerance demonstrated in M03 split-brain simulation',
        'Consistent theoretical theta estimate on distributed consensus in M02'
      ],
      gaps: [
        'Limited documented experience with capital expenditure ROI tradeoffs'
      ],
      remediation_loop: [
        {
          gap: 'Capital Allocation Models',
          action_type: 'M03 Practical Sandbox',
          description: 'Run FP&A Capital Allocation simulation with interest rate shock constraints.',
          target_reassessment: 'Priority 15 Simulation Catalog: Corporate Finance'
        }
      ],
      last_synthesized_at: '2026-10-06T00:00:00Z'
    },
    evidence_ledger: [
      {
        id: 'leg-1',
        source_module: 'm03_simulation',
        source_record_id: 'sim-1',
        competency_name: 'Distributed Consensus',
        skill_name: 'Split-Brain Recovery',
        evidence_type: 'work_artifact',
        observed_fact: 'Executed split-brain recovery without transaction loss.',
        model_interpretation: 'Exceptional resilience handling.',
        confidence_score: 0.94,
        uncertainty_score: 0.06,
        provenance: { source: 'm03_simulation' },
        human_review_status: 'verified',
        reviewed_by_user_id: null,
        created_at: '2026-10-06T00:00:00Z'
      }
    ],
    decision_records: []
  };

  const mockAdverseImpact = {
    eeoc_compliance: {
      four_fifths_threshold: 0.80,
      current_air_ratio: 0.94,
      status: 'COMPLIANT_EXCEEDS_THRESHOLD',
      methodology: 'Aggregated selection rate ratio between focal subgroup and benchmark subgroup.',
      data_collection_boundary: 'Demographic attributes are strictly segregated and NEVER used in assessment, simulation, or interview evaluation models.',
      inference_ban_verified: true
    }
  };

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (url: string) => {
      if (url === '/api/auth/me') {
        return { ok: true, json: async () => ({ id: 'recruiter-1', role: 'recruiter', full_name: 'Lead Committee Assessor' }) };
      }
      if (url === '/api/m5/readiness/candidates') {
        return { ok: true, json: async () => ({ success: true, candidates: [mockCandidate] }) };
      }
      if (url.includes('/api/m5/readiness/candidate/')) {
        return { ok: true, json: async () => mockDossier };
      }
      if (url === '/api/m5/governance/adverse-impact') {
        return { ok: true, json: async () => mockAdverseImpact };
      }
      if (url === '/api/m5/governance/audit-logs') {
        return { ok: true, json: async () => ({ success: true, logs: [] }) };
      }
      if (url === '/api/m5/decision/review') {
        return {
          ok: true,
          json: async () => ({
            success: true,
            decision_record: {
              id: 'dec-1',
              candidate_id: 'cand-test-1',
              human_decision_status: 'endorse_hire',
              decision_stage: 'committee_review'
            }
          })
        };
      }
      return { ok: true, json: async () => ({}) };
    }));
  });

  it('1. Renders Cockpit with Human Authority banner, candidate selector, and readiness calibration', async () => {
    render(
      <BrowserRouter>
        <Module5Analytics />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Evidence Synthesis & Human Decision Cockpit')).toBeInTheDocument();
      expect(screen.getByText('The Human Authority Invariant')).toBeInTheDocument();
      expect(screen.getByText(/Final employment decisions are the sole authority of human reviewers/)).toBeInTheDocument();
      expect(screen.getByText(/Elena Rostova/)).toBeInTheDocument();
      expect(screen.getByText('88%')).toBeInTheDocument();
    });
  });

  it('2. Navigates to 5-Layer Evidence Ledger and displays triangulation concordance', async () => {
    render(
      <BrowserRouter>
        <Module5Analytics />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('5-Layer Evidence Ledger & Triangulation')).toBeInTheDocument();
    });

    const ledgerTabBtn = screen.getByText('5-Layer Evidence Ledger & Triangulation');
    fireEvent.click(ledgerTabBtn);

    await waitFor(() => {
      expect(screen.getByText(/Evidence Triangulation/)).toBeInTheDocument();
      expect(screen.getByText('CONVERGENT')).toBeInTheDocument();
      expect(screen.getByText(/Executed split-brain recovery without transaction loss/)).toBeInTheDocument();
    });
  });

  it('3. Submits human committee review decision with rationale and rating sliders', async () => {
    render(
      <BrowserRouter>
        <Module5Analytics />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Record Human Decision')).toBeInTheDocument();
    });

    const rationaleInput = screen.getByPlaceholderText(/Explain the human decision rationale based on verified work samples/);
    fireEvent.change(rationaleInput, {
      target: { value: 'Candidate demonstrated verified distributed resilience in M03 and solid theoretical consensus depth in M02.' }
    });

    const submitBtn = screen.getByText('Commit Human Sign-off');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Human committee evaluation logged to immutable governance ledger/)).toBeInTheDocument();
    });
  });

  it('4. Navigates to Closed-Loop Action & Remediation Pathways tab', async () => {
    render(
      <BrowserRouter>
        <Module5Analytics />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Readiness Model & Action Loop')).toBeInTheDocument();
    });

    const remediationTab = screen.getByText('Readiness Model & Action Loop');
    fireEvent.click(remediationTab);

    await waitFor(() => {
      expect(screen.getByText('Substantiated Strengths')).toBeInTheDocument();
      expect(screen.getByText('Diagnosed Gaps & Uncertainty Points')).toBeInTheDocument();
      expect(screen.getByText(/Closed-Loop Action & Remediation Pathways/)).toBeInTheDocument();
      expect(screen.getByText('Capital Allocation Models')).toBeInTheDocument();
    });
  });

});
