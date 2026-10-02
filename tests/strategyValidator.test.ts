import { describe, it, expect } from 'vitest';
import {
  validateStrategy,
  assertStrategyValid,
  REJECTION_CODES,
  StrategyValidationError,
} from '../src/shared/strategyValidator';

describe('Prompt 18 — Strategy Validation Engine', () => {
  const validBaseInput = {
    organization_id: 'org_test_123',
    target_role: 'Fullstack TypeScript Engineer',
    occupation: { name: 'Software Engineer', code: '15-1252.00' },
    seniority_level: 'mid',
    assessment_purpose: 'recruitment',
    primary_modality: 'coding',
    evaluation_method: 'hybrid',
    rubric_id: 'rubric_algo_01',
    required_evidence: 'Synthesized, syntactically verified code solution with unit tests.',
  };

  it('accepts fully compliant valid strategies', () => {
    const result = validateStrategy(validBaseInput);
    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
    expect(result.rejection_codes.length).toBe(0);

    expect(() => assertStrategyValid(validBaseInput)).not.toThrow();
  });

  describe('Strict Rejection Gates', () => {
    it('1. Rejects missing rubric when evaluation method requires one', () => {
      const input = {
        ...validBaseInput,
        evaluation_method: 'rubric',
        rubric_id: undefined,
        rubric_criteria: undefined,
      };

      const result = validateStrategy(input);
      expect(result.valid).toBe(false);
      expect(result.rejection_codes).toContain(REJECTION_CODES.MISSING_RUBRIC);
      expect(result.errors[0]).toContain('Missing rubric');
    });

    it('2. Rejects unsupported modality not in canonical registry', () => {
      const input = {
        ...validBaseInput,
        primary_modality: 'quantum_telepathy',
      };

      const result = validateStrategy(input);
      expect(result.valid).toBe(false);
      expect(result.rejection_codes).toContain(REJECTION_CODES.UNSUPPORTED_MODALITY);
      expect(result.errors[0]).toContain('Unsupported evidence modality');
    });

    it('3. Rejects unavailable modality (planned for future phases)', () => {
      const input = {
        ...validBaseInput,
        primary_modality: 'simulation', // Planned for Phase 3, enabled: false
      };

      const result = validateStrategy(input);
      expect(result.valid).toBe(false);
      expect(result.rejection_codes).toContain(REJECTION_CODES.UNAVAILABLE_MODALITY);
      expect(result.errors[0]).toContain('is not available for live execution');
    });

    it('4. Rejects incompatible accessibility accommodation', () => {
      const input = {
        ...validBaseInput,
        primary_modality: 'coding', // Not screen-reader friendly without specialized editor
        requires_screen_reader: true,
      };

      const result = validateStrategy(input);
      expect(result.valid).toBe(false);
      expect(result.rejection_codes).toContain(REJECTION_CODES.INCOMPATIBLE_ACCOMMODATION);
      expect(result.errors[0]).toContain('not screen-reader accessible');
    });

    it('5. Rejects unsupported / missing occupation context', () => {
      const input = {
        ...validBaseInput,
        target_role: '',
        occupation: undefined,
      };

      const result = validateStrategy(input);
      expect(result.valid).toBe(false);
      expect(result.rejection_codes).toContain(REJECTION_CODES.UNSUPPORTED_OCCUPATION);
      expect(result.errors[0]).toContain('Unsupported occupation');
    });

    it('6. Rejects missing or insufficient evidence requirement', () => {
      const input = {
        ...validBaseInput,
        required_evidence: 'short', // Under 10 chars
      };

      const result = validateStrategy(input);
      expect(result.valid).toBe(false);
      expect(result.rejection_codes).toContain(REJECTION_CODES.MISSING_EVIDENCE_REQUIREMENT);
      expect(result.errors[0]).toContain('Missing or insufficient evidence requirement');
    });

    it('7. Rejects invalid seniority level', () => {
      const input = {
        ...validBaseInput,
        seniority_level: 'super_grandmaster',
      };

      const result = validateStrategy(input);
      expect(result.valid).toBe(false);
      expect(result.rejection_codes).toContain(REJECTION_CODES.INVALID_SENIORITY);
      expect(result.errors[0]).toContain('Invalid seniority level');
    });

    it('8. Rejects invalid purpose / modality combinations (e.g. unrubriced MCQ for certification)', () => {
      const input = {
        ...validBaseInput,
        assessment_purpose: 'certification',
        primary_modality: 'knowledge_question',
        evaluation_method: 'objective',
        rubric_id: undefined,
        rubric_criteria: undefined,
      };

      const result = validateStrategy(input);
      expect(result.valid).toBe(false);
      expect(result.rejection_codes).toContain(REJECTION_CODES.INVALID_PURPOSE_MODALITY_COMBINATION);
      expect(result.errors[0]).toContain('Formal certification cannot rely solely on unrubriced multiple choice questions');
    });
  });

  describe('Typed Error Assertion', () => {
    it('throws StrategyValidationError containing all rejection codes', () => {
      try {
        assertStrategyValid({
          seniority_level: 'wizard',
          required_evidence: '',
          primary_modality: 'fake_modality',
        });
        expect.fail('Should have thrown StrategyValidationError');
      } catch (err: any) {
        expect(err).toBeInstanceOf(StrategyValidationError);
        expect(err.rejectionCodes).toContain(REJECTION_CODES.INVALID_SENIORITY);
        expect(err.rejectionCodes).toContain(REJECTION_CODES.MISSING_EVIDENCE_REQUIREMENT);
        expect(err.rejectionCodes).toContain(REJECTION_CODES.UNSUPPORTED_MODALITY);
      }
    });
  });
});
