// functions/api/criEngine.test.ts
import { describe, it, expect } from 'vitest';
import {
  calculateNormativeTScore,
  calculateCandidateReadinessIndex,
  PAPER_DEFAULT_CRI_WEIGHTS
} from './criEngine';

describe('CRI: Candidate Readiness Index Engine (Equation 3 Compliance)', () => {
  it('calculates Normative T-Scores correctly (mean 50, sd 10)', () => {
    // Score exactly equal to mean -> T = 50.0
    const tMean = calculateNormativeTScore(60.0, 60.0, 10.0);
    expect(tMean).toBe(50.0);

    // 1 SD above mean -> T = 60.0
    const tPlus1Sd = calculateNormativeTScore(70.0, 60.0, 10.0);
    expect(tPlus1Sd).toBe(60.0);

    // 2 SD below mean -> T = 30.0
    const tMinus2Sd = calculateNormativeTScore(40.0, 60.0, 10.0);
    expect(tMinus2Sd).toBe(30.0);
  });

  it('computes composite CRI with paper default weights (0.20, 0.20, 0.25, 0.20, 0.15)', () => {
    const input = {
      s_ats: 80,   // w1 = 0.20 -> 16
      s_apt: 85,   // w2 = 0.20 -> 17
      s_tech: 90,  // w3 = 0.25 -> 22.5
      s_hr: 75,    // w4 = 0.20 -> 15
      s_bci: 80    // w5 = 0.15 -> 12
    };

    // Expected CRI = 16 + 17 + 22.5 + 15 + 12 = 82.5 -> 83
    const report = calculateCandidateReadinessIndex(input, PAPER_DEFAULT_CRI_WEIGHTS);

    expect(report.composite_cri).toBe(83);
    expect(report.readiness_tier).toBe('Ready for Placement');
    expect(report.module_status.ats).toBe('completed');
    expect(report.module_status.tech).toBe('completed');
    expect(report.composite_cri_t_score).toBeGreaterThan(50);
  });

  it('dynamically redistributes active module weights when some modules are pending', () => {
    const partialInput = {
      s_ats: 80,
      s_apt: 80,
      s_tech: null,
      s_hr: null,
      s_bci: null
    };

    // Only ATS and Aptitude are completed (each was 0.20 weight, so normalized each becomes 0.50)
    const report = calculateCandidateReadinessIndex(partialInput, PAPER_DEFAULT_CRI_WEIGHTS);

    expect(report.composite_cri).toBe(80);
    expect(report.module_status.ats).toBe('completed');
    expect(report.module_status.tech).toBe('pending');
    expect(report.weights_applied.w_ats).toBe(0.5);
    expect(report.weights_applied.w_apt).toBe(0.5);
    expect(report.weights_applied.w_tech).toBe(0);
  });

  it('classifies low-scoring candidate into Foundational Development tier', () => {
    const lowInput = {
      s_ats: 45,
      s_apt: 40,
      s_tech: 42,
      s_hr: 50,
      s_bci: 55
    };

    const report = calculateCandidateReadinessIndex(lowInput, PAPER_DEFAULT_CRI_WEIGHTS);
    expect(report.composite_cri).toBeLessThan(55);
    expect(report.readiness_tier).toBe('Foundational Development');
    expect(report.composite_cri_t_score).toBeLessThan(45);
  });
});
