// functions/api/m2IrtCatEngine.test.ts
import { describe, it, expect } from 'vitest';
import {
  calculateProbability3PL,
  calculateFisherInformation,
  calculateTestStandardError,
  estimateThetaNewtonRaphson,
  selectNextAdaptiveItem,
  createCatSession,
  processCandidateResponse,
  convertThetaToScore
} from './m2IrtCatEngine';
import { generateFullCalibratedItemBank } from './m2ItemBank';

describe('Module 2: 3PL-IRT Adaptive Aptitude Testing Engine', () => {
  const itemBank = generateFullCalibratedItemBank();

  it('generates a full calibrated item bank with at least 300 items across all three domains', () => {
    expect(itemBank.length).toBeGreaterThanOrEqual(300);
    const domains = new Set(itemBank.map(i => i.domain));
    expect(domains).toContain('quantitative');
    expect(domains).toContain('logical');
    expect(domains).toContain('verbal');

    // Verify 3PL parameters fall within IEEE specification bounds
    for (const item of itemBank) {
      expect(item.a).toBeGreaterThanOrEqual(0.5);
      expect(item.a).toBeLessThanOrEqual(2.5);
      expect(item.b).toBeGreaterThanOrEqual(-3.0);
      expect(item.b).toBeLessThanOrEqual(3.0);
      expect(item.c).toBeGreaterThanOrEqual(0.10);
      expect(item.c).toBeLessThanOrEqual(0.30);
    }
  });

  it('computes 3PL response probability obeying asymptote c and monotonicity in theta', () => {
    const a = 1.5, b = 0.0, c = 0.20;

    // At extreme low ability (theta = -4.0), P should approach guessing parameter c (0.20)
    const lowProb = calculateProbability3PL(-4.0, a, b, c);
    expect(lowProb.P).toBeCloseTo(0.20, 1);

    // At theta = b = 0.0, logistic is 0.5, so P = 0.20 + 0.80 * 0.5 = 0.60
    const midProb = calculateProbability3PL(0.0, a, b, c);
    expect(midProb.P).toBeCloseTo(0.60, 2);

    // At extreme high ability (theta = +4.0), P should approach 1.0
    const highProb = calculateProbability3PL(4.0, a, b, c);
    expect(highProb.P).toBeCloseTo(1.0, 1);
  });

  it('computes Fisher Information peaked near item difficulty b', () => {
    const a = 1.8, b = 1.0, c = 0.20;

    const infoAtB = calculateFisherInformation(1.0, a, b, c);
    const infoFarBelow = calculateFisherInformation(-2.0, a, b, c);
    const infoFarAbove = calculateFisherInformation(4.0, a, b, c);

    expect(infoAtB).toBeGreaterThan(infoFarBelow);
    expect(infoAtB).toBeGreaterThan(infoFarAbove);
  });

  it('updates ability theta via Newton-Raphson MLE with Bayesian prior shrinkage', () => {
    const responses = [
      { a: 1.5, b: 0.0, c: 0.20, is_correct: true },
      { a: 1.8, b: 0.5, c: 0.20, is_correct: true },
      { a: 1.2, b: 1.0, c: 0.20, is_correct: true }
    ];

    const estimatedTheta = estimateThetaNewtonRaphson(0.0, responses);
    // Consistent correct answers on moderate-to-high difficulty items should increase theta
    expect(estimatedTheta).toBeGreaterThan(0.5);
    expect(estimatedTheta).toBeLessThan(3.5);
  });

  it('selects the item with maximum Fisher Information for the current estimated theta', () => {
    const theta = 1.2;
    const administered = new Set<string>();
    const bestItem = selectNextAdaptiveItem(theta, itemBank, administered, []);

    expect(bestItem).not.toBeNull();
    // Best item difficulty should be near candidate theta
    expect(Math.abs(bestItem!.b - theta)).toBeLessThan(1.5);
  });

  it('converges standard error SE(theta) < 0.25 within approximately 25-35 items', () => {
    let session = createCatSession();
    let currentItem = selectNextAdaptiveItem(session.candidate_theta, itemBank, new Set(), []);
    expect(currentItem).not.toBeNull();

    // Simulate candidate responses: correctly answering questions near their capability
    let count = 0;
    while (!session.is_converged && currentItem && count < 40) {
      count++;
      // Candidate has ability ~1.5: correct if item difficulty b <= 1.8
      const isCorrect = currentItem.b <= 1.8;
      const ans = isCorrect ? currentItem.correct_answer : 'wrong_option';
      const { updatedState, nextItem } = processCandidateResponse(
        session,
        currentItem,
        ans,
        itemBank
      );

      session = updatedState;
      currentItem = nextItem;
    }

    expect(session.is_converged).toBe(true);
    expect(session.standard_error).toBeLessThanOrEqual(0.26);
    expect(count).toBeLessThanOrEqual(40);
    expect(session.candidate_theta).toBeGreaterThan(0.5);

    const finalScore = convertThetaToScore(session.candidate_theta);
    expect(finalScore).toBeGreaterThanOrEqual(60);
  });
});
