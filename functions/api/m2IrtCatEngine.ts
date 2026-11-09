// functions/api/m2IrtCatEngine.ts
/**
 * Module 2: Adaptive Aptitude Testing Engine (3PL-IRT CAT)
 * Implements IEEE Paper Specifications:
 * - Equation 7: Three-Parameter Logistic (3PL) IRT probability model
 * - Equations 8 & 9: Newton-Raphson ability estimation with Bayesian MAP damping
 * - Equation 10: Fisher Information item selection
 * - Stopping criteria: SE(theta) < 0.25 (or Section III-C threshold < 0.30) or maximum 40 items
 */

export interface Item3PL {
  id: string;
  question_text: string;
  domain: 'quantitative' | 'logical' | 'verbal';
  options: string[];
  correct_answer: string;
  a: number; // Discrimination parameter: a in [0.5, 2.5]
  b: number; // Difficulty parameter: b in [-3.0, 3.0]
  c: number; // Pseudo-guessing parameter: c in [0.10, 0.30]
}

export interface CandidateResponseRecord {
  item_id: string;
  domain: 'quantitative' | 'logical' | 'verbal';
  is_correct: boolean;
  a: number;
  b: number;
  c: number;
  theta_before: number;
}

export interface CatSessionState {
  candidate_theta: number;        // Latent ability estimate theta
  standard_error: number;         // Asymptotic SE(theta) = 1 / sqrt(sum(I_i))
  responses: CandidateResponseRecord[];
  administered_item_ids: string[];
  is_converged: boolean;
  termination_reason?: 'se_threshold' | 'max_items' | 'item_exhaustion';
}

/**
 * Equation 7: 3PL Item Response Theory probability model
 * P_i(theta) = c_i + (1 - c_i) / (1 + e^(-a_i * (theta - b_i)))
 * Q_i(theta) = 1 - P_i(theta)
 */
export function calculateProbability3PL(theta: number, a: number, b: number, c: number): { P: number; Q: number } {
  const boundedA = Math.max(0.5, Math.min(2.5, a));
  const boundedB = Math.max(-3.0, Math.min(3.0, b));
  const boundedC = Math.max(0.1, Math.min(0.3, c));

  const exponent = -boundedA * (theta - boundedB);
  // Prevent numerical overflow
  const logistic = exponent > 30 ? 0 : (exponent < -30 ? 1 : 1 / (1 + Math.exp(exponent)));
  const P = boundedC + (1 - boundedC) * logistic;
  const Q = 1 - P;

  return { P, Q };
}

/**
 * Equation 10: Fisher Information for Item i at theta
 * I_i(theta) = (a_i^2 * (P_i(theta) - c_i)^2 * Q_i(theta)) / ((1 - c_i)^2 * P_i(theta))
 * (Birnbaum standard formula derived from (P'_i)^2 / (P_i * Q_i))
 */
export function calculateFisherInformation(theta: number, a: number, b: number, c: number): number {
  const boundedA = Math.max(0.5, Math.min(2.5, a));
  const boundedC = Math.max(0.1, Math.min(0.3, c));

  const { P, Q } = calculateProbability3PL(theta, a, b, c);

  if (P <= boundedC || P >= 0.999 || Q <= 0.001) return 0.001;

  const numerator = (boundedA * boundedA) * Math.pow(P - boundedC, 2) * Q;
  const denominator = Math.pow(1 - boundedC, 2) * P;

  if (denominator <= 0) return 0.001;
  return Math.max(0.001, numerator / denominator);
}

/**
 * Calculates Test Information Function: TIF(theta) = sum(I_i(theta))
 * And Asymptotic Standard Error: SE(theta) = 1 / sqrt(sum(I_i(theta)) + 1/sigma_0^2)
 */
export function calculateTestStandardError(theta: number, administeredItems: Array<{ a: number; b: number; c: number }>): number {
  if (administeredItems.length === 0) return 1.0;

  let totalInfo = 0;
  for (const item of administeredItems) {
    totalInfo += calculateFisherInformation(theta, item.a, item.b, item.c);
  }

  // Regularize test information with standard Gaussian prior variance sigma_0^2 = 1.0
  const posteriorInfo = totalInfo + 1.0;
  return 1 / Math.sqrt(posteriorInfo);
}

/**
 * Equations 8 & 9: Newton-Raphson Maximum A Posteriori (MAP) Ability Estimation
 * With Gaussian prior theta ~ N(0, 1) and Levenberg-Marquardt damping
 * P'_i(theta) = a_i * (P_i - c_i) * Q_i / (1 - c_i)
 * ell'(theta) = sum( (u_i - P_i)/(P_i * Q_i) * P'_i ) - theta
 * ell''(theta) = - sum( (P'_i)^2 / (P_i * Q_i) ) - 1 = - sum( I_i(theta) ) - 1
 */
export function estimateThetaNewtonRaphson(
  currentTheta: number,
  responses: Array<{ a: number; b: number; c: number; is_correct: boolean }>,
  maxIterations: number = 30,
  convergenceThreshold: number = 1e-4
): number {
  if (responses.length === 0) return 0.0;

  let theta = currentTheta;

  for (let iter = 0; iter < maxIterations; iter++) {
    let firstDerivative = 0;
    let expectedHessian = 0;

    for (const r of responses) {
      const a = Math.max(0.5, Math.min(2.5, r.a));
      const c = Math.max(0.1, Math.min(0.3, r.c));
      const { P, Q } = calculateProbability3PL(theta, a, r.b, c);

      const u = r.is_correct ? 1 : 0;
      const oneMinusC = 1 - c;

      if (P > 0 && Q > 0 && oneMinusC > 0) {
        const pPrime = (a * (P - c) * Q) / oneMinusC;
        firstDerivative += ((u - P) / (P * Q)) * pPrime;
        expectedHessian += (pPrime * pPrime) / (P * Q);
      }
    }

    // Bayesian prior: theta ~ N(0, 1)
    firstDerivative -= theta;
    const totalHessian = expectedHessian + 1.0; // second derivative is -totalHessian

    const deltaTheta = firstDerivative / totalHessian;
    const nextTheta = Math.max(-4.0, Math.min(4.0, theta + deltaTheta));

    if (Math.abs(nextTheta - theta) < convergenceThreshold) {
      return nextTheta;
    }

    theta = nextTheta;
  }

  return theta;
}

/**
 * Fisher Information item selection subject to domain balance
 * Returns the item from the candidate pool that maximizes I_i(theta)
 */
export function selectNextAdaptiveItem(
  theta: number,
  itemPool: Item3PL[],
  administeredItemIds: Set<string>,
  responses: CandidateResponseRecord[]
): Item3PL | null {
  const availableItems = itemPool.filter(i => !administeredItemIds.has(i.id));
  if (availableItems.length === 0) return null;

  // Track domain coverage for balance across quantitative, logical, verbal
  const domainCounts = { quantitative: 0, logical: 0, verbal: 0 };
  for (const r of responses) {
    if (r.domain in domainCounts) {
      domainCounts[r.domain]++;
    }
  }

  // Find least sampled domain to maintain curriculum balance
  const minCount = Math.min(...Object.values(domainCounts));
  const prioritizedDomains = (['quantitative', 'logical', 'verbal'] as const).filter(
    d => domainCounts[d] === minCount
  );

  // Filter available items for under-represented domains first
  let targetItems = availableItems.filter(i => prioritizedDomains.includes(i.domain));
  if (targetItems.length === 0) targetItems = availableItems;

  // Maximize Fisher Information I_i(theta)
  let bestItem: Item3PL = targetItems[0];
  let maxInfo = -1;

  for (const item of targetItems) {
    const info = calculateFisherInformation(theta, item.a, item.b, item.c);
    if (info > maxInfo) {
      maxInfo = info;
      bestItem = item;
    }
  }

  return bestItem;
}

/**
 * Initializes a new 3PL-IRT Computerized Adaptive Testing session
 */
export function createCatSession(): CatSessionState {
  return {
    candidate_theta: 0.0, // Initial prior mean theta_0 = 0.0
    standard_error: 1.0,  // Initial standard error
    responses: [],
    administered_item_ids: [],
    is_converged: false
  };
}

/**
 * Records a response, updates theta via Newton-Raphson, and checks stopping conditions
 * Stopping rule: SE(theta) < 0.25 (or paper Sec III-C 0.30) or administered_items >= 40
 */
export function processCandidateResponse(
  state: CatSessionState,
  item: Item3PL,
  responseAnswer: string,
  allItemPool: Item3PL[]
): {
  updatedState: CatSessionState;
  nextItem: Item3PL | null;
  stoppingReason?: 'se_threshold' | 'max_items' | 'item_exhaustion';
} {
  const isCorrect = item.correct_answer.trim().toLowerCase() === responseAnswer.trim().toLowerCase();
  
  const responseRecord: CandidateResponseRecord = {
    item_id: item.id,
    domain: item.domain,
    is_correct: isCorrect,
    a: item.a,
    b: item.b,
    c: item.c,
    theta_before: state.candidate_theta
  };

  const newResponses = [...state.responses, responseRecord];
  const newAdministeredIds = [...state.administered_item_ids, item.id];

  // Newton-Raphson update
  const newTheta = estimateThetaNewtonRaphson(state.candidate_theta, newResponses);
  const newSE = calculateTestStandardError(newTheta, newResponses);

  const itemCount = newResponses.length;
  let isConverged = false;
  let stoppingReason: 'se_threshold' | 'max_items' | 'item_exhaustion' | undefined = undefined;

  // Stopping conditions specified in paper
  if (newSE < 0.25) {
    isConverged = true;
    stoppingReason = 'se_threshold';
  } else if (itemCount >= 40) {
    isConverged = true;
    stoppingReason = 'max_items';
  }

  const updatedState: CatSessionState = {
    candidate_theta: Math.round(newTheta * 1000) / 1000,
    standard_error: Math.round(newSE * 1000) / 1000,
    responses: newResponses,
    administered_item_ids: newAdministeredIds,
    is_converged: isConverged,
    termination_reason: stoppingReason
  };

  if (isConverged) {
    return { updatedState, nextItem: null, stoppingReason };
  }

  // Select next optimal item using Fisher Information
  const nextItem = selectNextAdaptiveItem(
    newTheta,
    allItemPool,
    new Set(newAdministeredIds),
    newResponses
  );

  if (!nextItem) {
    updatedState.is_converged = true;
    updatedState.termination_reason = 'item_exhaustion';
    return { updatedState, nextItem: null, stoppingReason: 'item_exhaustion' };
  }

  return { updatedState, nextItem };
}

/**
 * Standardizes a latent ability theta [-3.0, +3.0] to an interpretable 0-100 aptitude score
 */
export function convertThetaToScore(theta: number): number {
  const t = theta / 1.702;
  const p = 1 / (1 + Math.exp(-t));
  return Math.min(100, Math.max(0, Math.round(p * 100)));
}
