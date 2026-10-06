import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TrainingCurriculum from './TrainingCurriculum';

describe('Priority 18: Training Curriculum & Learning Pathway Engine Tests', () => {

  let currentRole = 'candidate';

  const mockPathway = {
    id: 'pathway-dist-1',
    learner_id: 'cand-1',
    learner_name: 'Elena Rostova',
    title: 'Distributed Resiliency & Consensus Remediation Pathway',
    target_role: 'Senior Distributed Systems Architect',
    domain: 'software',
    occupation_code: '15-1252.00',
    pathway_type: 'evidence_remediation',
    status: 'in_progress',
    overall_progress: 35,
    mastery_score: 25,
    evidence_sources: [
      'M02 Assessment: Misconception on 2PC vs Paxos/Raft consensus',
      'M03 Simulation: Split-brain recovery degradation under chaos mesh'
    ],
    modules: [
      {
        id: 'mod-foundations',
        sequence_order: 1,
        competency_name: 'Distributed Systems',
        skill_name: 'CAP Theorem & Quorums',
        title: 'Foundations of Distributed Agreement',
        description: 'Understand quorum intersections and partition boundaries.',
        target_capability: 'Architect quorum-safe storage clusters',
        current_capability: 'Understands basic replication only',
        evidence_gap_summary: 'Diagnosed baseline understanding of quorum intersections.',
        prerequisites: [],
        status: 'completed',
        mastery_status: 'mastered',
        units: [
          {
            id: 'unit-quorum-concept',
            unit_order: 1,
            unit_type: 'micro_concept',
            title: 'Quorum Intersection Principles',
            content_markdown: '# Quorum Intersection\nRead-quorum plus write-quorum strictly exceeding node count guarantees visibility.',
            interactive_exercise: {
              question: 'Why does R + W > N guarantee fresh reads in a quorum cluster?',
              options: [
                'The read set and write set must overlap on at least one node containing the latest timestamp.',
                'The leader always responds first before followers.',
                'Network latencies are eliminated by quorum arithmetic.',
                'All nodes receive the write concurrently.'
              ],
              correct_index: 0,
              explanation_why: 'Pigeonhole principle guarantees set intersection on the most updated replica.',
              explanation_how: 'Read repair or highest-timestamp resolution returns the fresh write.',
              misconception_warning: 'Quorum does not guarantee total order without consensus timestamps.'
            },
            provenance: { author: 'System' },
            completion_status: 'completed',
            demonstrated_score: 1.0,
            completed_at: '2026-10-06T00:00:00Z'
          }
        ]
      },
      {
        id: 'mod-consensus',
        sequence_order: 2,
        competency_name: 'Distributed Consensus',
        skill_name: 'Raft & Viewstamped Replication',
        title: 'Consensus State Machines & Partition Tolerance',
        description: 'Remediate leader election timeouts and term inflation during asymmetric partitions.',
        target_capability: 'Implement robust partition-tolerant leader elections',
        current_capability: 'Conflates 2PC coordinator with Raft leader election',
        evidence_gap_summary: 'Confusion regarding leader election timeouts during asymmetric partitions.',
        prerequisites: ['mod-foundations'],
        status: 'available',
        mastery_status: 'in_progress',
        units: [
          {
            id: 'unit-asymmetric-partitions',
            unit_order: 1,
            unit_type: 'misconception_deepdive',
            title: 'Remediating Asymmetric Partitions in Raft',
            content_markdown: '# Asymmetric Partitions\nWhen candidate nodes receive heartbeats from an isolated node, pre-vote phases prevent term inflation.',
            interactive_exercise: {
              question: 'How does the Raft Pre-Vote protocol prevent disrupted nodes from forcing unnecessary elections?',
              options: [
                'Candidate probes leader liveness across peers before incrementing term numbers.',
                'Followers immediately drop all messages from disconnected nodes.',
                'A single designated backup server decides election validity.',
                'Heartbeat timers are permanently doubled during partitions.'
              ],
              correct_index: 0,
              explanation_why: 'Correctly identifies that Pre-Vote checks connectivity before advancing term numbers.',
              explanation_how: 'Maintains leader election stability under asymmetric network latency.',
              misconception_warning: 'Pre-Vote does not eliminate the election phase; it guards term increments.'
            },
            provenance: { author: 'System' },
            completion_status: 'not_started',
            demonstrated_score: null,
            completed_at: null
          },
          {
            id: 'unit-consensus-gate',
            unit_order: 2,
            unit_type: 'reassessment_gate',
            title: 'Consensus Reassessment Gate',
            content_markdown: '# Checkpoint Gate\nSynthesize partition recovery mechanisms to unlock chaos simulation.',
            provenance: { author: 'System' },
            completion_status: 'not_started',
            demonstrated_score: null,
            completed_at: null
          }
        ]
      },
      {
        id: 'mod-chaos',
        sequence_order: 3,
        competency_name: 'Resilience Engineering',
        skill_name: 'Chaos Mesh & Partition Recovery',
        title: 'Applied Chaos Engineering & Split-Brain Mitigation',
        description: 'Verify dynamic split-brain isolation and partition healing.',
        target_capability: 'Execute autonomous cluster partition healing',
        current_capability: 'Untested under network chaos',
        evidence_gap_summary: 'Handling split-brain partition recovery under dynamic constraint shifts.',
        prerequisites: ['mod-consensus'],
        status: 'locked',
        mastery_status: 'unassessed',
        units: []
      }
    ]
  };

  const mockCohortAnalytics = {
    total_learners_enrolled: 42,
    avg_completion_progress: 54,
    avg_verified_mastery: 42,
    completed_pathways_count: 6,
    top_diagnosed_gaps: [
      { competency: 'Fault-Tolerant Consensus', affected_learners: 42, remediation_completion: '78%' },
      { competency: 'Capital Allocation Under Rate Shocks', affected_learners: 28, remediation_completion: '65%' },
      { competency: 'Emergency Clinical Surge Triage', affected_learners: 19, remediation_completion: '92%' }
    ]
  };

  beforeEach(() => {
    currentRole = 'candidate';
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (url: string, options?: any) => {
      if (url === '/api/auth/me') {
        return {
          ok: true,
          json: async () => ({ id: 'cand-1', role: currentRole, full_name: 'Elena Rostova' })
        };
      }

      if (url === '/api/training/pathways') {
        return {
          ok: true,
          json: async () => ({
            success: true,
            pathways: [
              {
                id: 'pathway-dist-1',
                title: 'Distributed Resiliency & Consensus Remediation Pathway',
                domain: 'software',
                target_role: 'Senior Distributed Systems Architect',
                overall_progress: 0.35,
                mastery_score: 0.25,
                status: 'in_progress',
                created_at: '2026-10-06T00:00:00Z'
              }
            ]
          })
        };
      }

      if (url.startsWith('/api/training/pathway/')) {
        return {
          ok: true,
          json: async () => ({ success: true, pathway: mockPathway })
        };
      }

      if (url === '/api/training/cohort/analytics') {
        return {
          ok: true,
          json: async () => ({ success: true, cohort_metrics: mockCohortAnalytics })
        };
      }

      if (url === '/api/training/generate' && options?.method === 'POST') {
        return {
          ok: true,
          json: async () => ({
            success: true,
            pathway_id: 'pathway-dist-1'
          })
        };
      }

      if (url.includes('/progress') && options?.method === 'POST') {
        return {
          ok: true,
          json: async () => ({
            success: true,
            unit_id: 'unit-asymmetric-partitions',
            status: 'completed',
            overall_progress: 0.50,
            mastery_score: 0.25
          })
        };
      }

      if (url.includes('/submit-exercise') && options?.method === 'POST') {
        return {
          ok: true,
          json: async () => ({
            success: true,
            is_correct: true,
            score: 1.0,
            explanation_why: 'Correctly identifies that Pre-Vote checks connectivity before advancing term numbers.',
            explanation_how: 'Maintains leader election stability under asymmetric network latency.',
            misconception_warning: 'Pre-Vote does not eliminate the election phase; it guards term increments.'
          })
        };
      }

      if (url.includes('/reassess') && options?.method === 'POST') {
        return {
          ok: true,
          json: async () => ({
            success: true,
            passed: true,
            demonstrated_score: 90,
            message: 'Module reassessment passed with verified mastery. Next module unlocked.',
            updated_proficiency: {
              skill_name: 'Raft & Viewstamped Replication',
              previous_theta: 0.42,
              new_theta: 0.78,
              uncertainty: 0.15
            },
            evidence_ledger_id: 'ledger-audit-rec-1'
          })
        };
      }

      return {
        ok: false,
        status: 404,
        json: async () => ({ error: 'Not found' })
      };
    }));
  });

  it('renders the Learning Pathway catalog and enforces the Completion vs Mastery distinction', async () => {
    render(
      <BrowserRouter>
        <TrainingCurriculum />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Distributed Resiliency & Consensus Remediation Pathway')).toBeInTheDocument();
    });

    // Check evidence attribution from M02 and M03
    expect(screen.getByText(/M02 Assessment: Misconception/i)).toBeInTheDocument();
    expect(screen.getByText(/M03 Simulation: Split-brain/i)).toBeInTheDocument();

    // Check Completion vs Mastery metrics
    expect(screen.getByText('35%')).toBeInTheDocument(); // Completion progress
    expect(screen.getByText('25%')).toBeInTheDocument(); // Verified mastery
    expect(screen.getByText(/Completion ≠ Mastery/i)).toBeInTheDocument();
  });

  it('displays prerequisite module hierarchy and respects module lock status', async () => {
    render(
      <BrowserRouter>
        <TrainingCurriculum />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Foundations of Distributed Agreement')).toBeInTheDocument();
    });

    expect(screen.getByText('Consensus State Machines & Partition Tolerance')).toBeInTheDocument();
    expect(screen.getByText('Applied Chaos Engineering & Split-Brain Mitigation')).toBeInTheDocument();

    // Status badges
    expect(screen.getByText(/mastered/i)).toBeInTheDocument();
    expect(screen.getByText(/available/i)).toBeInTheDocument();
    expect(screen.getByText(/locked/i)).toBeInTheDocument();
  });

  it('evaluates interactive formative exercise with Explain Why & Explain How feedback', async () => {
    render(
      <BrowserRouter>
        <TrainingCurriculum />
      </BrowserRouter>
    );

    // Click module 2
    await waitFor(() => {
      expect(screen.getByText('Consensus State Machines & Partition Tolerance')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Consensus State Machines & Partition Tolerance'));

    await waitFor(() => {
      expect(screen.getByText(/How does the Raft Pre-Vote protocol prevent/i)).toBeInTheDocument();
    });

    // Select the correct radio option
    const radioOption = screen.getByText(/Candidate probes leader liveness across peers before incrementing term numbers/i);
    fireEvent.click(radioOption);

    const submitBtn = screen.getByRole('button', { name: /Submit Answer/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Correct! Demonstrates solid conceptual grasp/i)).toBeInTheDocument();
      expect(screen.getByText(/Correctly identifies that Pre-Vote checks connectivity/i)).toBeInTheDocument();
      expect(screen.getByText(/Maintains leader election stability/i)).toBeInTheDocument();
    });
  });

  it('executes module reassessment gate to verify mastery and update proficiency', async () => {
    render(
      <BrowserRouter>
        <TrainingCurriculum />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Consensus State Machines & Partition Tolerance')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Consensus State Machines & Partition Tolerance'));

    // Click the reassessment gate unit sub-tab
    await waitFor(() => {
      expect(screen.getByText('Consensus Reassessment Gate')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Consensus Reassessment Gate'));

    await waitFor(() => {
      expect(screen.getByText(/Module Reassessment Checkpoint Gate/i)).toBeInTheDocument();
    });

    const notesInput = screen.getByPlaceholderText(/Record candidate practical demonstration notes/i);
    fireEvent.change(notesInput, {
      target: { value: 'Demonstrated split-brain isolation and validated Raft pre-vote timeout configuration.' }
    });

    const verifyBtn = screen.getByRole('button', { name: /Execute Reassessment Gate/i });
    fireEvent.click(verifyBtn);

    await waitFor(() => {
      expect(screen.getByText(/Demonstrated Mastery Confirmed: 90%/i)).toBeInTheDocument();
      expect(screen.getByText(/Bayesian θ updated in M02 and verified entry recorded in M05 Evidence Ledger/i)).toBeInTheDocument();
    });
  });

  it('allows compiling new evidence-driven remediation pathways', async () => {
    render(
      <BrowserRouter>
        <TrainingCurriculum />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Generate Personalized Pathway/i })).toBeInTheDocument();
    });

    const generateBtn = screen.getByRole('button', { name: /Generate Personalized Pathway/i });
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(screen.getByText('Distributed Resiliency & Consensus Remediation Pathway')).toBeInTheDocument();
    });
  });

  it('renders institutional cohort analytics for trainers and recruiters', async () => {
    currentRole = 'recruiter';

    render(
      <BrowserRouter>
        <TrainingCurriculum />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Cohort & Institutional Analytics/i })).toBeInTheDocument();
    });

    const analyticsTab = screen.getByRole('button', { name: /Cohort & Institutional Analytics/i });
    fireEvent.click(analyticsTab);

    await waitFor(() => {
      expect(screen.getByText('42')).toBeInTheDocument(); // total enrolled
      expect(screen.getByText('54%')).toBeInTheDocument(); // avg completion
      expect(screen.getByText('42%')).toBeInTheDocument(); // avg mastery
      expect(screen.getByText('Fault-Tolerant Consensus')).toBeInTheDocument();
      expect(screen.getByText('Capital Allocation Under Rate Shocks')).toBeInTheDocument();
      expect(screen.getByText('Emergency Clinical Surge Triage')).toBeInTheDocument();
    });
  });

});
