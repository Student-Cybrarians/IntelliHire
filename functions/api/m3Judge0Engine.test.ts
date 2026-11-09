// functions/api/m3Judge0Engine.test.ts
import { describe, it, expect } from 'vitest';
import {
  executeJudge0Sandbox,
  evaluateVerbalExplanation,
  computeShapleyAttribution,
  evaluateTechnicalSubmission,
  TechnicalProblem
} from './m3Judge0Engine';

describe('Module 3: Technical Coding Simulator (Judge0 & STT Rubric)', () => {
  const sampleProblem: TechnicalProblem = {
    id: 'prob-two-sum',
    title: 'Two Sum Optimal',
    description: 'Given an array of integers and a target, return indices of two numbers such that they add up to target.',
    domain: 'software',
    difficulty: 'medium',
    expected_time_complexity: 'O(N)',
    expected_space_complexity: 'O(N)',
    test_cases: [
      { id: 'tc-1', input: '[2,7,11,15], target=9', expected_output: '[0,1]' },
      { id: 'tc-2', input: '[3,2,4], target=6', expected_output: '[1,2]' },
      { id: 'tc-3', input: '[], target=5', expected_output: '[]', is_hidden: true }
    ]
  };

  const sampleCode = `
    function twoSum(nums, target) {
      if (!nums || nums.length === 0) return [];
      const map = new Map();
      for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (map.has(complement)) {
          return [map.get(complement), i];
        }
        map.set(nums[i], i);
      }
      return [];
    }
  `;

  const sampleTranscript = `
    I solved this problem using a hash map to achieve O(N) linear time complexity and O(N) space complexity.
    Instead of the brute force quadratic approach with nested loops, we iterate once through the array,
    storing previously seen elements as keys. We also guard against null or empty input at the boundary.
  `;

  it('executes code in the sandbox within 5000ms CPU and 256MB memory cap', async () => {
    const result = await executeJudge0Sandbox(sampleCode, 63, sampleProblem);
    expect(result.status).toBe('Accepted');
    expect(result.passed_test_cases).toBe(3);
    expect(result.execution_time_ms).toBeLessThan(5000);
    expect(result.memory_kb).toBeLessThan(256 * 1024);
  });

  it('evaluates verbal speech-to-text explanation for Big-O complexity and trade-offs', () => {
    const evalResult = evaluateVerbalExplanation(sampleTranscript, sampleProblem);
    expect(evalResult.complexity_score).toBeGreaterThanOrEqual(80);
    expect(evalResult.verbal_score).toBeGreaterThanOrEqual(80);
    expect(evalResult.key_observations.length).toBeGreaterThan(1);
  });

  it('evaluates technical submission against 4-tier rubric with paper weights (0.40, 0.20, 0.20, 0.20)', async () => {
    const sandboxResult = await executeJudge0Sandbox(sampleCode, 63, sampleProblem);
    const rubric = evaluateTechnicalSubmission(sandboxResult, sampleTranscript, sampleProblem, sampleCode);

    expect(rubric.execution_correctness).toBe(100);
    expect(rubric.complexity_analysis).toBeGreaterThanOrEqual(80);
    expect(rubric.boundary_defense).toBeGreaterThanOrEqual(80);
    expect(rubric.verbal_explanation).toBeGreaterThanOrEqual(80);
    expect(rubric.composite_score).toBeGreaterThanOrEqual(85);

    // Shapley attribution checks
    expect(rubric.shapley_attribution.execution_contribution).toBeGreaterThan(0);
    expect(rubric.shapley_attribution.complexity_contribution).toBeGreaterThan(0);
  });

  it('penalizes incorrect solutions or missing verbal explanations', async () => {
    const badCode = 'const x = 5;';
    const badTranscript = '';
    const sandboxResult = await executeJudge0Sandbox(badCode, 63, sampleProblem);
    const rubric = evaluateTechnicalSubmission(sandboxResult, badTranscript, sampleProblem, badCode);

    expect(rubric.execution_correctness).toBeLessThan(50);
    expect(rubric.composite_score).toBeLessThan(50);
    expect(rubric.shapley_attribution.execution_contribution).toBeLessThan(0);
  });
});
