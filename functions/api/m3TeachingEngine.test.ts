import { describe, it, expect } from 'vitest';
import {
  generateTeachingPayload,
  executeDeterministicEvaluation,
  classifyAlternativeValidity,
  validateTeachingPayload,
  SEED_SIMULATIONS
} from './simulationEngine';

describe('IntelliHire M03 Phase 7: Teaching, Explanation & Misconception Engine', () => {
  const sqlDef = SEED_SIMULATIONS.find(s => s.id === 'sim-tech-api-relational-indexing')!;
  const clinicalDef = SEED_SIMULATIONS.find(s => s.id === 'sim-ops-hospital-triage')!;

  describe('1. Correct Response Pedagogical Generation (All 8 Dimensions)', () => {
    it('produces complete 8-dimension correct explanation for optimal SQL solution', () => {
      const correctSql = `
        CREATE INDEX CONCURRENTLY idx_active_tenant_orders 
        ON orders (tenant_id, status, created_at DESC) 
        INCLUDE (total_amount) 
        WHERE deleted_at IS NULL;
      `;
      const detResult = executeDeterministicEvaluation(sqlDef, correctSql, [{ action_type: 'run_tests' }]);
      const validity = classifyAlternativeValidity(detResult, 'Used concurrent migration with covering index', false, 5, correctSql);

      const teaching = generateTeachingPayload(sqlDef, correctSql, detResult, validity.validity, 'Full non-blocking solution');

      expect(teaching.isCorrectOrAlternative).toBe(true);
      expect(validateTeachingPayload(teaching)).toBe(true);

      const why = teaching.whyCorrectReasoning;
      expect(why).toBeDefined();

      // Dimension 1: Why the response is correct
      expect(why!.whyCorrect).toContain('successfully fulfilled');
      // Dimension 2: Reasoning path
      expect(why!.reasoningPath).toBeDefined();
      expect(why!.reasoningPath.length).toBeGreaterThan(20);
      // Dimension 3: Requirements satisfied
      expect(why!.requirementsSatisfied.length).toBeGreaterThanOrEqual(1);
      // Dimension 4: Valid assumptions
      expect(why!.validAssumptions.length).toBeGreaterThanOrEqual(2);
      // Dimension 5: Important trade-offs
      expect(why!.importantTradeOffs.length).toBeGreaterThanOrEqual(2);
      // Dimension 6: Alternative valid approaches
      expect(why!.alternativeValidApproaches.length).toBeGreaterThanOrEqual(1);
      expect(why!.alternativeValidApproaches[0].approachName).toBeDefined();
      // Dimension 7: Why flawed alternatives fail
      expect(why!.whyFlawedAlternativesFail.length).toBeGreaterThanOrEqual(1);
      // Dimension 8: Potential improvements
      expect(why!.potentialImprovements.length).toBeGreaterThanOrEqual(1);

      // Verify interactive structures
      expect(teaching.whyChain.length).toBeGreaterThanOrEqual(2);
      expect(teaching.howChain.length).toBeGreaterThanOrEqual(3);
      expect(teaching.whatIfScenarios.length).toBeGreaterThanOrEqual(2);
      expect(teaching.followUpCheck.question).toBeDefined();
      expect(teaching.followUpCheck.options?.length).toBe(4);
      expect(teaching.followUpCheck.correctAnswer).toBeDefined();
    });
  });

  describe('2. Incorrect & Partial Response Logic Gap Analysis (All 10 Dimensions)', () => {
    it('produces complete 10-dimension logic gap analysis and counterexample for blocking DDL', () => {
      const flawedSql = 'CREATE INDEX idx_orders ON orders (created_at);';
      const detResult = executeDeterministicEvaluation(sqlDef, flawedSql, [{ action_type: 'run_tests' }]);
      const validity = classifyAlternativeValidity(detResult, '', false, 1, flawedSql);

      const teaching = generateTeachingPayload(sqlDef, flawedSql, detResult, validity.validity, '');

      expect(teaching.isCorrectOrAlternative).toBe(false);
      expect(validateTeachingPayload(teaching)).toBe(true);

      const gap = teaching.logicGapAnalysis;
      expect(gap).toBeDefined();

      // Dimension 1: What candidate did correctly
      expect(gap!.whatCandidateDidCorrectly.length).toBeGreaterThanOrEqual(1);
      // Dimension 2: Where reasoning breaks
      expect(gap!.whereReasoningBreaks).toBeDefined();
      // Dimension 3: Why it breaks
      expect(gap!.whyItBreaks).toBeDefined();
      // Dimension 4: Missing concept or logic
      expect(gap!.missingConceptOrLogic).toBeDefined();
      // Dimension 5: Invalid assumption
      expect(gap!.invalidAssumption).toBeDefined();
      // Dimension 6: Missing requirement
      expect(gap!.missingRequirement).toBeDefined();
      // Dimension 7: Correct reasoning path
      expect(gap!.correctReasoningPath).toBeDefined();
      // Dimension 8: How to approach logically
      expect(gap!.howToApproachLogically).toBeDefined();
      // Dimension 9: How to avoid repeating
      expect(gap!.howToAvoidRepeating).toBeDefined();
      // Dimension 10: Practical counterexample
      expect(gap!.practicalExampleOrCounterexample).toBeDefined();

      // Strict product requirement: DO NOT simply say "Your answer is wrong. Correct answer: X"
      expect(gap!.whyItBreaks).not.toMatch(/^Your answer is wrong/i);
      expect(gap!.whereReasoningBreaks).not.toMatch(/^Your answer is wrong/i);

      // Misconception taxonomy check
      expect(teaching.misconceptions.length).toBeGreaterThanOrEqual(1);
      const misc = teaching.misconceptions[0];
      expect(misc.category).toBe('trade_off_blindspot');
      expect(misc.severity).toBe('critical');
      expect(misc.m02ReassessFocus).toBe('Relational Indexing & Concurrency Safety');
    });

    it('diagnoses clinical triage FIFO misconception into conceptual category', () => {
      const flawedTriage = {
        strategy: 'First come first served patient queueing'
      };
      const detResult = executeDeterministicEvaluation(clinicalDef, flawedTriage, []);
      const validity = classifyAlternativeValidity(detResult, 'first come first served', false, 1, flawedTriage);

      const teaching = generateTeachingPayload(clinicalDef, flawedTriage, detResult, validity.validity, 'Allocated by FIFO');

      expect(teaching.misconceptions.length).toBeGreaterThanOrEqual(1);
      const misc = teaching.misconceptions[0];
      expect(misc.category).toBe('conceptual');
      expect(misc.diagnosedMisconception).toContain('FIFO');
      expect(misc.m02ReassessFocus).toContain('Emergency Severity Index');
    });
  });

  describe('3. Validation & Contract Integrity', () => {
    it('validates a well-formed teaching payload', () => {
      const detResult = executeDeterministicEvaluation(sqlDef, 'SELECT 1;', []);
      const payload = generateTeachingPayload(sqlDef, 'SELECT 1;', detResult, 'partially_correct');
      expect(validateTeachingPayload(payload)).toBe(true);
    });

    it('rejects malformed or empty payloads', () => {
      expect(validateTeachingPayload(null)).toBe(false);
      expect(validateTeachingPayload({})).toBe(false);
      expect(validateTeachingPayload({ isCorrectOrAlternative: true })).toBe(false);
      expect(validateTeachingPayload({
        isCorrectOrAlternative: true,
        summaryGuidance: 'Good job',
        whyChain: [],
        howChain: []
        // missing compareContrast, alternativeSolutions, etc.
      })).toBe(false);
    });
  });
});
