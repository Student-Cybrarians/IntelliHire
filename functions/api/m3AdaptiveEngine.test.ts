import { describe, it, expect } from 'vitest';
import {
  evaluateAdaptiveNextStep,
  SEED_SIMULATIONS
} from './simulationEngine';
import {
  validateAdaptationDecision,
  validateProgressionState,
  SimulationRoundRecord,
  SessionProgressionState
} from '../../src/shared/m3WorkRoundContracts';

describe('M03 Phase 8: Adaptive Continuous Work-Round Engine', () => {

  const jdCompetencies = [
    { name: 'System Architecture & Concurrency', skillName: 'Distributed Systems & Concurrency', domain: 'software' },
    { name: 'Database Architecture & Optimization', skillName: 'Relational Indexing & MVCC', domain: 'software' },
    { name: 'Financial Planning & Valuation', skillName: 'Capital Budgeting & Valuation', domain: 'finance' },
    { name: 'Clinical Emergency Triage', skillName: 'Emergency Triage & Patient Prioritization', domain: 'healthcare_admin' },
    { name: 'Data Engineering & Analytics', skillName: 'Real-Time Pipeline Engineering', domain: 'data' }
  ];

  it('elevates difficulty when candidate exhibits mastery with low uncertainty', () => {
    const previousRounds: SimulationRoundRecord[] = [
      {
        roundIndex: 1,
        definitionId: 'sim-tech-rate-limiter',
        taskTitle: 'Distributed Token Bucket Rate Limiter',
        modality: 'coding',
        difficulty: 3,
        competencyName: 'System Architecture & Concurrency',
        skillName: 'Distributed Systems & Concurrency',
        startedAt: new Date().toISOString(),
        overallScore: 92,
        alternativeValidity: 'correct',
        confidence: 0.95,
        uncertainty: 0.15,
        status: 'evaluated'
      }
    ];

    const latestEval = {
      overall_score: 92,
      alternative_validity: 'correct',
      confidence_score: 0.95,
      uncertainty_score: 0.15,
      teaching_payload: { misconceptions: [] }
    };

    const res = evaluateAdaptiveNextStep({
      candidateSeniority: 'senior',
      jobContext: { requiredCompetencies: jdCompetencies },
      previousRounds,
      latestEvaluation: latestEval,
      availableSimulations: SEED_SIMULATIONS
    });

    expect(validateAdaptationDecision(res.decision)).toBe(true);
    expect(res.decision.reasonType).toBe('increase_difficulty');
    expect(res.decision.targetDifficulty).toBeGreaterThanOrEqual(3);
    expect(res.selectedSimulation.id).not.toBe('sim-tech-rate-limiter');
    expect(res.decision.internalRationale).toContain('Strong performance');
    expect(res.decision.candidateFocusPreview).toContain('Elevated Complexity');
  });

  it('triggers immediate remediation policy when active misconception is diagnosed', () => {
    const previousRounds: SimulationRoundRecord[] = [
      {
        roundIndex: 1,
        definitionId: 'sim-tech-api-relational-indexing',
        taskTitle: 'PostgreSQL Index Optimization',
        modality: 'coding',
        difficulty: 3,
        competencyName: 'Database Architecture & Optimization',
        skillName: 'Relational Indexing & MVCC',
        startedAt: new Date().toISOString(),
        overallScore: 48,
        alternativeValidity: 'incomplete',
        confidence: 0.85,
        uncertainty: 0.35,
        misconceptionsDiagnosed: ['Locking Invariant Omission in Concurrent DDL'],
        status: 'evaluated'
      }
    ];

    const latestEval = {
      overall_score: 48,
      alternative_validity: 'incomplete',
      confidence_score: 0.85,
      uncertainty_score: 0.35,
      teaching_payload: {
        misconceptions: [
          { conceptName: 'Locking Invariant Omission in Concurrent DDL' }
        ]
      }
    };

    const res = evaluateAdaptiveNextStep({
      candidateSeniority: 'senior',
      jobContext: { requiredCompetencies: jdCompetencies },
      previousRounds,
      latestEvaluation: latestEval,
      availableSimulations: SEED_SIMULATIONS
    });

    expect(validateAdaptationDecision(res.decision)).toBe(true);
    expect(res.decision.reasonType).toBe('remediate_misconception');
    expect(res.decision.internalRationale).toContain('Diagnosed active misconception');
    expect(res.decision.candidateFocusPreview).toContain('Remediation Drill');
    expect(res.selectedSimulation.id).not.toBe('sim-tech-api-relational-indexing');
  });

  it('enforces Anti-Tunnel-Vision guardrail after 2 consecutive rounds on the same competency', () => {
    const previousRounds: SimulationRoundRecord[] = [
      {
        roundIndex: 1,
        definitionId: 'sim-tech-api-relational-indexing',
        taskTitle: 'PostgreSQL Index Optimization',
        modality: 'coding',
        difficulty: 3,
        competencyName: 'Database Architecture & Optimization',
        skillName: 'Relational Indexing & MVCC',
        startedAt: new Date().toISOString(),
        overallScore: 80,
        status: 'evaluated'
      },
      {
        roundIndex: 2,
        definitionId: 'sim-tech-relational-diff4',
        taskTitle: 'PostgreSQL Advanced Partitioning',
        modality: 'coding',
        difficulty: 4,
        competencyName: 'Database Architecture & Optimization',
        skillName: 'Relational Indexing & MVCC',
        startedAt: new Date().toISOString(),
        overallScore: 85,
        status: 'evaluated'
      }
    ];

    const latestEval = {
      overall_score: 85,
      alternative_validity: 'correct',
      confidence_score: 0.90,
      uncertainty_score: 0.20
    };

    const res = evaluateAdaptiveNextStep({
      candidateSeniority: 'senior',
      jobContext: { requiredCompetencies: jdCompetencies },
      previousRounds,
      latestEvaluation: latestEval,
      availableSimulations: SEED_SIMULATIONS
    });

    expect(res.decision.reasonType).toBe('broaden_coverage');
    expect(res.decision.internalRationale).toContain('Anti-Tunnel-Vision guardrail');
    expect(res.decision.targetCompetency).not.toBe('Database Architecture & Optimization');
  });

  it('strictly enforces zero-repetition across multiple work rounds', () => {
    const previousRounds: SimulationRoundRecord[] = [
      {
        roundIndex: 1,
        definitionId: 'sim-tech-rate-limiter',
        taskTitle: 'Rate Limiter',
        modality: 'coding',
        difficulty: 3,
        competencyName: 'System Architecture & Concurrency',
        skillName: 'Distributed Systems & Concurrency',
        startedAt: new Date().toISOString(),
        status: 'evaluated'
      },
      {
        roundIndex: 2,
        definitionId: 'sim-tech-api-relational-indexing',
        taskTitle: 'Index Optimization',
        modality: 'coding',
        difficulty: 3,
        competencyName: 'Database Architecture & Optimization',
        skillName: 'Relational Indexing & MVCC',
        startedAt: new Date().toISOString(),
        status: 'evaluated'
      }
    ];

    const res = evaluateAdaptiveNextStep({
      candidateSeniority: 'senior',
      jobContext: { requiredCompetencies: jdCompetencies },
      previousRounds,
      latestEvaluation: { overall_score: 75 },
      availableSimulations: SEED_SIMULATIONS
    });

    const previousIds = previousRounds.map(r => r.definitionId);
    expect(previousIds).not.toContain(res.selectedSimulation.id);
  });

  it('validates progression state contracts and progression metrics', () => {
    const progressionState: SessionProgressionState = {
      sessionId: 'sess_123',
      status: 'evaluated',
      currentRoundIndex: 2,
      rounds: [
        {
          roundIndex: 1,
          definitionId: 'sim-tech-rate-limiter',
          taskTitle: 'Distributed Token Bucket Rate Limiter',
          modality: 'coding',
          difficulty: 3,
          competencyName: 'System Architecture & Concurrency',
          skillName: 'Distributed Systems & Concurrency',
          startedAt: new Date().toISOString(),
          overallScore: 88,
          status: 'evaluated'
        }
      ],
      competencyCoverage: {
        totalRequired: 5,
        assessed: 1,
        remaining: ['Database Architecture & Optimization', 'Financial Planning & Valuation'],
        coverageRatio: 0.20
      },
      overallProficiencyMean: 88,
      cumulativeUncertainty: 0.15,
      canProceedToNextModule: true
    };

    expect(validateProgressionState(progressionState)).toBe(true);
  });
});
