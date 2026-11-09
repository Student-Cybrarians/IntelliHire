// functions/api/m4HrSentimentEngine.test.ts
import { describe, it, expect } from 'vitest';
import {
  calculateVaderSentiment,
  calculateLexicalRichness,
  calculateProfessionalAffectScore,
  evaluateStarComponents,
  evaluateHrResponse
} from './m4HrSentimentEngine';

describe('Module 4: HR Interview Simulator Engine (VADER & STAR)', () => {
  const perfectStarResponse = `
    In my role as Lead Architect during a major database latency crisis, our team needed to reduce checkout query times.
    My responsibility was to diagnose the root bottlenecks and orchestrate a zero-downtime fix.
    I designed and coordinated a non-blocking index migration concurrently on the orders table and refactored the caching tier.
    As a result, we successfully delivered a 65% reduction in p99 latency, achieved zero transaction failures, and improved customer throughput.
  `;

  it('calculates VADER compound sentiment adhering to Equation 11 with alpha = 15', () => {
    const text = 'In my role, I coordinated with engineers to optimize response times and delivered on schedule.';
    const result = calculateVaderSentiment(text, 15);

    expect(result.compound).toBeGreaterThan(0.05);
    expect(result.is_positive).toBe(true);
    expect(result.compound).toBeLessThanOrEqual(1.0);
    // Professional sentiment target is [0.10, 0.85]
    expect(result.compound).toBeGreaterThanOrEqual(0.10);
    expect(result.is_professional).toBe(true);
  });

  it('calculates lexical richness Type-Token Ratio (TTR = |V| / N)', () => {
    const text = 'The quick brown fox jumps over the lazy dog';
    const lexical = calculateLexicalRichness(text);

    expect(lexical.total_tokens).toBe(9);
    expect(lexical.unique_tokens).toBe(8); // 'the' repeated twice
    expect(lexical.type_token_ratio).toBeCloseTo(8 / 9, 2);
  });

  it('computes Gaussian professional affect score peaking at mu_prof = 0.35', () => {
    const idealCompound = 0.35;
    const peakScore = calculateProfessionalAffectScore(idealCompound, 0.35, 0.35);
    expect(peakScore).toBe(100);

    const moderateScore = calculateProfessionalAffectScore(0.10, 0.35, 0.35);
    expect(moderateScore).toBeGreaterThan(50);
    expect(moderateScore).toBeLessThan(100);

    const extremeScore = calculateProfessionalAffectScore(-0.80, 0.35, 0.35);
    expect(extremeScore).toBeLessThan(10);
  });

  it('detects all four STAR components with a score of 4/4', () => {
    const star = evaluateStarComponents(perfectStarResponse);
    expect(star.situation).toBe(true);
    expect(star.task).toBe(true);
    expect(star.action).toBe(true);
    expect(star.result).toBe(true);
    expect(star.star_score).toBe(4);
  });

  it('evaluates overall HR response across all four dimensions (STAR, VADER, Relevance, TTR)', () => {
    const evalResult = evaluateHrResponse(perfectStarResponse, 'Describe a time you handled a technical database crisis.');
    expect(evalResult.star.star_score).toBe(4);
    expect(evalResult.vader.is_positive).toBe(true);
    expect(evalResult.relevance_score).toBeGreaterThanOrEqual(50);
    expect(evalResult.lexical.type_token_ratio).toBeGreaterThan(0.40);
    expect(evalResult.overall_hr_score).toBeGreaterThanOrEqual(75);
    expect(evalResult.feedback_summary).toContain('Complete STAR structure');
  });
});
