// functions/api/criEngine.ts
/**
 * Candidate Readiness Index (CRI) Engine
 * Implements IEEE Paper Specifications (Section III-G & Equation 3):
 * - CRI = w1 * S_ATS + w2 * S_apt + w3 * S_tech + w4 * S_HR + w5 * BCI
 * - Default weights: (w1, ..., w5) = (0.20, 0.20, 0.25, 0.20, 0.15)
 * - Configurable weights support for institution/placement coordinator tuning
 * - Normative T-Score normalization: T_m = 50 + 10 * ((S_m - mu_m) / sigma_m)
 * - Dynamic redistribution when modules are pending
 */

export interface CriWeightProfile {
  name: string;
  w_ats: number;       // w1: default 0.20
  w_apt: number;       // w2: default 0.20
  w_tech: number;      // w3: default 0.25
  w_hr: number;        // w4: default 0.20
  w_bci: number;       // w5: default 0.15
}

export const PAPER_DEFAULT_CRI_WEIGHTS: CriWeightProfile = {
  name: 'IEEE Paper Default',
  w_ats: 0.20,
  w_apt: 0.20,
  w_tech: 0.25,
  w_hr: 0.20,
  w_bci: 0.15
};

export interface CohortNormativeBaseline {
  mu: number;
  sigma: number;
}

// Empirical population norm baselines across modules
export const DEFAULT_COHORT_NORMS: Record<string, CohortNormativeBaseline> = {
  ats: { mu: 68.5, sigma: 12.4 },
  apt: { mu: 62.0, sigma: 14.8 },
  tech: { mu: 58.0, sigma: 16.5 },
  hr: { mu: 71.0, sigma: 11.2 },
  bci: { mu: 76.0, sigma: 9.8 }
};

export interface ModuleScoresInput {
  s_ats?: number | null;
  s_apt?: number | null;
  s_tech?: number | null;
  s_hr?: number | null;
  s_bci?: number | null;
}

export interface CriEvaluationReport {
  raw_scores: {
    ats: number;
    apt: number;
    tech: number;
    hr: number;
    bci: number;
  };
  t_scores: {
    ats_t: number;
    apt_t: number;
    tech_t: number;
    hr_t: number;
    bci_t: number;
  };
  composite_cri: number;          // 0 to 100
  composite_cri_t_score: number;  // Normative T-Score (mean 50, sd 10)
  weights_applied: CriWeightProfile;
  readiness_tier: 'Ready for Placement' | 'Conditional / Remediation' | 'Foundational Development';
  module_status: {
    ats: 'completed' | 'pending';
    apt: 'completed' | 'pending';
    tech: 'completed' | 'pending';
    hr: 'completed' | 'pending';
    bci: 'completed' | 'pending';
  };
}

/**
 * Calculates Normative T-Score:
 * T_m = 50 + 10 * ((S_m - mu_m) / sigma_m)
 */
export function calculateNormativeTScore(rawScore: number, mu: number, sigma: number): number {
  if (sigma <= 0) return 50.0;
  const z = (rawScore - mu) / sigma;
  const t = 50.0 + 10.0 * z;
  return Math.round(t * 10) / 10;
}

/**
 * Paper Equation 3: Composite Candidate Readiness Index (CRI)
 * CRI = w1 * S_ATS + w2 * S_apt + w3 * S_tech + w4 * S_HR + w5 * BCI
 * Dynamically re-normalizes weights if some modules are yet to be completed
 */
export function calculateCandidateReadinessIndex(
  input: ModuleScoresInput,
  weights: CriWeightProfile = PAPER_DEFAULT_CRI_WEIGHTS,
  norms: Record<string, CohortNormativeBaseline> = DEFAULT_COHORT_NORMS
): CriEvaluationReport {
  const isAtsDone = typeof input.s_ats === 'number' && !isNaN(input.s_ats);
  const isAptDone = typeof input.s_apt === 'number' && !isNaN(input.s_apt);
  const isTechDone = typeof input.s_tech === 'number' && !isNaN(input.s_tech);
  const isHrDone = typeof input.s_hr === 'number' && !isNaN(input.s_hr);
  const isBciDone = typeof input.s_bci === 'number' && !isNaN(input.s_bci);

  const rawAts = isAtsDone ? Math.min(100, Math.max(0, input.s_ats!)) : 50;
  const rawApt = isAptDone ? Math.min(100, Math.max(0, input.s_apt!)) : 50;
  const rawTech = isTechDone ? Math.min(100, Math.max(0, input.s_tech!)) : 50;
  const rawHr = isHrDone ? Math.min(100, Math.max(0, input.s_hr!)) : 50;
  const rawBci = isBciDone ? Math.min(100, Math.max(0, input.s_bci!)) : 50;

  // Active module weights
  let activeWeightSum = 0;
  if (isAtsDone) activeWeightSum += weights.w_ats;
  if (isAptDone) activeWeightSum += weights.w_apt;
  if (isTechDone) activeWeightSum += weights.w_tech;
  if (isHrDone) activeWeightSum += weights.w_hr;
  if (isBciDone) activeWeightSum += weights.w_bci;

  const normalizeFactor = activeWeightSum > 0 ? (1.0 / activeWeightSum) : 1.0;

  const effW_ats = isAtsDone ? weights.w_ats * normalizeFactor : 0;
  const effW_apt = isAptDone ? weights.w_apt * normalizeFactor : 0;
  const effW_tech = isTechDone ? weights.w_tech * normalizeFactor : 0;
  const effW_hr = isHrDone ? weights.w_hr * normalizeFactor : 0;
  const effW_bci = isBciDone ? weights.w_bci * normalizeFactor : 0;

  const compositeCri = Math.round(
    effW_ats * rawAts +
    effW_apt * rawApt +
    effW_tech * rawTech +
    effW_hr * rawHr +
    effW_bci * rawBci
  );

  // Compute Normative T-Scores
  const normAts = norms.ats || DEFAULT_COHORT_NORMS.ats;
  const normApt = norms.apt || DEFAULT_COHORT_NORMS.apt;
  const normTech = norms.tech || DEFAULT_COHORT_NORMS.tech;
  const normHr = norms.hr || DEFAULT_COHORT_NORMS.hr;
  const normBci = norms.bci || DEFAULT_COHORT_NORMS.bci;

  const atsT = calculateNormativeTScore(rawAts, normAts.mu, normAts.sigma);
  const aptT = calculateNormativeTScore(rawApt, normApt.mu, normApt.sigma);
  const techT = calculateNormativeTScore(rawTech, normTech.mu, normTech.sigma);
  const hrT = calculateNormativeTScore(rawHr, normHr.mu, normHr.sigma);
  const bciT = calculateNormativeTScore(rawBci, normBci.mu, normBci.sigma);

  const compositeT = Math.round(
    effW_ats * atsT +
    effW_apt * aptT +
    effW_tech * techT +
    effW_hr * hrT +
    effW_bci * bciT
  );

  let readinessTier: 'Ready for Placement' | 'Conditional / Remediation' | 'Foundational Development' = 'Conditional / Remediation';
  if (compositeCri >= 75) {
    readinessTier = 'Ready for Placement';
  } else if (compositeCri < 55) {
    readinessTier = 'Foundational Development';
  }

  return {
    raw_scores: {
      ats: rawAts,
      apt: rawApt,
      tech: rawTech,
      hr: rawHr,
      bci: rawBci
    },
    t_scores: {
      ats_t: atsT,
      apt_t: aptT,
      tech_t: techT,
      hr_t: hrT,
      bci_t: bciT
    },
    composite_cri: compositeCri,
    composite_cri_t_score: compositeT,
    weights_applied: {
      name: weights.name,
      w_ats: Math.round(effW_ats * 100) / 100,
      w_apt: Math.round(effW_apt * 100) / 100,
      w_tech: Math.round(effW_tech * 100) / 100,
      w_hr: Math.round(effW_hr * 100) / 100,
      w_bci: Math.round(effW_bci * 100) / 100
    },
    readiness_tier: readinessTier,
    module_status: {
      ats: isAtsDone ? 'completed' : 'pending',
      apt: isAptDone ? 'completed' : 'pending',
      tech: isTechDone ? 'completed' : 'pending',
      hr: isHrDone ? 'completed' : 'pending',
      bci: isBciDone ? 'completed' : 'pending'
    }
  };
}
