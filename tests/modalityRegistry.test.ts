import { describe, it, expect } from 'vitest';
import {
  ModalityRegistry,
  globalModalityRegistry,
  MODALITY_REGISTRY_VERSION,
  ALL_MODALITY_DEFINITIONS,
  CanonicalModalityId,
} from '../src/shared/modalityRegistry';

describe('Prompt 12 — Modality Registry', () => {
  it('exposes version 2.0.0', () => {
    expect(globalModalityRegistry.version).toBe('2.0.0');
    expect(MODALITY_REGISTRY_VERSION).toBe('2.0.0');
  });

  it('supports the architecture for all 13 canonical evidence modalities', () => {
    const expectedModalities: CanonicalModalityId[] = [
      'knowledge_question',
      'reasoning',
      'scenario',
      'simulation',
      'structured_response',
      'writing',
      'coding',
      'spreadsheet_data',
      'document_analysis',
      'planning',
      'presentation',
      'domain_work_sample',
      'role_play',
    ];

    expect(ALL_MODALITY_DEFINITIONS.length).toBe(13);

    for (const modId of expectedModalities) {
      const def = globalModalityRegistry.get(modId);
      expect(def, `Expected modality ${modId} to be registered`).toBeDefined();
      expect(def?.id).toBe(modId);
      expect(def?.capabilities).toBeDefined();
      expect(def?.supportedInputTypes.length).toBeGreaterThan(0);
      expect(def?.evaluationMethods.length).toBeGreaterThan(0);
      expect(def?.accessibilityAccommodations).toBeDefined();
      expect(def?.fairnessConstraints).toBeDefined();
      expect(def?.renderContract).toBeDefined();
    }
  });

  it('enforces the invariant: only modalities with live implementation are enabled', () => {
    const liveExpected = [
      'knowledge_question',
      'reasoning',
      'scenario',
      'coding',
      'structured_response',
    ];

    const plannedExpected = [
      'simulation',
      'writing',
      'spreadsheet_data',
      'document_analysis',
      'planning',
      'presentation',
      'domain_work_sample',
      'role_play',
    ];

    const enabledModalities = globalModalityRegistry.getEnabled();
    const plannedModalities = globalModalityRegistry.getPlanned();

    expect(enabledModalities.map((m) => m.id)).toEqual(
      expect.arrayContaining(liveExpected)
    );
    expect(enabledModalities.length).toBe(5);

    expect(plannedModalities.map((m) => m.id)).toEqual(
      expect.arrayContaining(plannedExpected)
    );
    expect(plannedModalities.length).toBe(8);

    for (const id of liveExpected) {
      expect(globalModalityRegistry.isEnabled(id)).toBe(true);
      expect(globalModalityRegistry.get(id)?.status).toBe('active');
    }

    for (const id of plannedExpected) {
      expect(globalModalityRegistry.isEnabled(id)).toBe(false);
      expect(globalModalityRegistry.get(id)?.status).toBe('planned');
    }
  });

  it('resolves aliases and legacy identifiers correctly', () => {
    expect(globalModalityRegistry.resolveCanonicalId('knowledge_inquiry')).toBe('knowledge_question');
    expect(globalModalityRegistry.resolveCanonicalId('mcq')).toBe('knowledge_question');
    expect(globalModalityRegistry.resolveCanonicalId('structured_reasoning')).toBe('reasoning');
    expect(globalModalityRegistry.resolveCanonicalId('dynamic_scenario')).toBe('scenario');
    expect(globalModalityRegistry.resolveCanonicalId('practical_execution')).toBe('coding');
    expect(globalModalityRegistry.resolveCanonicalId('code')).toBe('coding');
    expect(globalModalityRegistry.resolveCanonicalId('domain_simulation')).toBe('simulation');
    expect(globalModalityRegistry.resolveCanonicalId('data_analysis_sample')).toBe('spreadsheet_data');
    expect(globalModalityRegistry.resolveCanonicalId('written_work_sample')).toBe('writing');
    expect(globalModalityRegistry.resolveCanonicalId('presentation_defense')).toBe('presentation');

    // Case insensitivity
    expect(globalModalityRegistry.resolveCanonicalId('PRACTICAL_EXECUTION')).toBe('coding');
    expect(globalModalityRegistry.resolveCanonicalId('KNOWLEDGE_INQUIRY')).toBe('knowledge_question');
  });

  describe('Response Validation and Submission Gates', () => {
    it('strictly blocks responses submitted for disabled / planned modalities', () => {
      const result = globalModalityRegistry.validateResponse('simulation', { action: 'start' });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('not yet enabled for live assessments');
    });

    it('blocks responses for unknown modalities', () => {
      const result = globalModalityRegistry.validateResponse('quantum_telepathy', { answer: 42 });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Unknown evidence modality');
    });

    it('validates knowledge questions requiring chosen options', () => {
      const invalid = globalModalityRegistry.validateResponse('knowledge_question', {});
      expect(invalid.valid).toBe(false);
      expect(invalid.errors[0]).toContain('requires a valid selected option');

      const validString = globalModalityRegistry.validateResponse('knowledge_question', 'option_b');
      expect(validString.valid).toBe(true);

      const validObj = globalModalityRegistry.validateResponse('knowledge_question', { selected_option: 'A' });
      expect(validObj.valid).toBe(true);
    });

    it('validates reasoning requiring minimum length and rejects too-short responses', () => {
      const tooShort = globalModalityRegistry.validateResponse('reasoning', 'too short');
      expect(tooShort.valid).toBe(false);
      expect(tooShort.errors[0]).toContain('at least 20 characters');

      const valid = globalModalityRegistry.validateResponse(
        'reasoning',
        'We selected a distributed cache architecture because the write-heavy throughput required sub-5ms latency.'
      );
      expect(valid.valid).toBe(true);
    });

    it('validates code submissions requiring actual code', () => {
      const invalid = globalModalityRegistry.validateResponse('coding', 'x');
      expect(invalid.valid).toBe(false);
      expect(invalid.errors[0]).toContain('at least 10 characters');

      const valid = globalModalityRegistry.validateResponse(
        'coding',
        'function binarySearch(arr, target) { return -1; }'
      );
      expect(valid.valid).toBe(true);
    });

    it('validates scenario decisions requiring explicit actions', () => {
      const invalid = globalModalityRegistry.validateResponse('scenario', {});
      expect(invalid.valid).toBe(false);
      expect(invalid.errors[0]).toContain('explicit decision or chosen action');

      const valid = globalModalityRegistry.validateResponse('scenario', {
        action: 'escalate_to_security_team',
        notes: 'Potential unauthorized data access pattern observed.',
      });
      expect(valid.valid).toBe(true);
    });
  });

  describe('Isolated Registry Instantiation', () => {
    it('allows creating custom registries with specialized definitions', () => {
      const customRegistry = new ModalityRegistry([
        {
          id: 'knowledge_question',
          aliases: [],
          name: 'Custom MCQ',
          version: '1.0.0',
          description: 'Specialized test',
          status: 'active',
          enabled: true,
          implementationPhase: 'Phase 2',
          capabilities: {
            supportsAutomatedEvaluation: true,
            supportsRubricEvaluation: false,
            supportsHumanEvaluation: false,
            supportsAdaptiveTesting: true,
            supportsAsynchronousSubmission: false,
            requiresBrowserEnvironment: false,
            requiresRuntimeSandbox: false,
            preservesProvenance: true,
          },
          supportedInputTypes: ['single_choice'],
          evaluationMethods: ['objective'],
          validationRules: {},
          accessibilityAccommodations: {
            screenReaderFriendly: true,
            keyboardNavigable: true,
            extendedTimeSupport: true,
            textToSpeechSupport: true,
            sensoryComplexity: 'low',
            alternativeInputTypes: [],
          },
          fairnessConstraints: {
            cultureFairnessTested: true,
            languageIndependenceLevel: 'high',
            dialectRobustness: true,
          },
          renderContract: {
            componentType: 'CustomView',
            hasInteractiveControls: true,
            supportsRealtimeFeedback: false,
          },
        },
      ]);

      expect(customRegistry.getAll().length).toBe(1);
      expect(customRegistry.get('knowledge_question')?.name).toBe('Custom MCQ');
    });
  });
});
