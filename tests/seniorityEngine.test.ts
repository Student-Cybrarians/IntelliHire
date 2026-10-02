import { describe, it, expect } from 'vitest';
import {
  getSeniorityProfile,
  getAllSeniorityProfiles,
  generateSeniorityGuidancePrompt,
  validateSeniorityEvidenceFit,
  SENIORITY_ENGINE_VERSION,
  CANONICAL_SENIORITY_PROFILES,
} from '../src/shared/seniorityEngine';
import { SeniorityLevel } from '../src/shared/evidenceStrategy';

describe('Prompt 15 — Seniority Engine (Multi-Axial Adaptation)', () => {
  it('exposes version 2.0.0', () => {
    expect(SENIORITY_ENGINE_VERSION).toBe('2.0.0');
  });

  it('supports all 7 canonical seniority levels', () => {
    const expectedLevels: SeniorityLevel[] = [
      'foundation',
      'junior',
      'mid',
      'senior',
      'lead',
      'manager',
      'executive',
    ];

    expect(Object.keys(CANONICAL_SENIORITY_PROFILES).length).toBe(7);

    for (const level of expectedLevels) {
      const profile = getSeniorityProfile(level);
      expect(profile.seniority_level).toBe(level);
      expect(profile.display_title).toBeTruthy();
      expect(profile.summary).toBeTruthy();

      // Verify all 9 multi-axial dimensions are present
      expect(profile.axes.scope).toBeDefined();
      expect(profile.axes.ambiguity).toBeDefined();
      expect(profile.axes.independence).toBeDefined();
      expect(profile.axes.decision_making).toBeDefined();
      expect(profile.axes.ownership).toBeDefined();
      expect(profile.axes.risk).toBeDefined();
      expect(profile.axes.trade_offs.length).toBeGreaterThan(0);
      expect(profile.axes.stakeholder_impact.length).toBeGreaterThan(0);
      expect(profile.axes.mentoring).toBeDefined();

      // Verify adaptive parameters
      expect(profile.adaptive_parameters.target_confidence).toBeGreaterThan(0.60);
      expect(profile.adaptive_parameters.max_uncertainty).toBeLessThan(0.40);
      expect(profile.adaptive_parameters.min_evidence_items).toBeGreaterThanOrEqual(3);
    }
  });

  describe('Multi-Axial Differentiation (Not Merely Difficulty)', () => {
    it('adapts scope from individual task to enterprise ecosystem', () => {
      const foundation = getSeniorityProfile('foundation');
      const senior = getSeniorityProfile('senior');
      const executive = getSeniorityProfile('executive');

      expect(foundation.axes.scope).toBe('task');
      expect(senior.axes.scope).toBe('system');
      expect(executive.axes.scope).toBe('enterprise');
    });

    it('adapts ambiguity handling from structured procedural instructions to unconstrained contexts', () => {
      const foundation = getSeniorityProfile('foundation');
      const mid = getSeniorityProfile('mid');
      const executive = getSeniorityProfile('executive');

      expect(foundation.axes.ambiguity).toBe('structured');
      expect(mid.axes.ambiguity).toBe('moderate');
      expect(executive.axes.ambiguity).toBe('unconstrained');
    });

    it('adapts mentoring expectations from receiving guidance to peer review and coaching', () => {
      const junior = getSeniorityProfile('junior');
      const mid = getSeniorityProfile('mid');
      const lead = getSeniorityProfile('lead');
      const exec = getSeniorityProfile('executive');

      expect(junior.axes.mentoring).toBe('receiving');
      expect(mid.axes.mentoring).toBe('peer_review');
      expect(lead.axes.mentoring).toBe('mentoring_coaching');
      expect(exec.axes.mentoring).toBe('executive_sponsorship');
    });

    it('adapts risk exposure from negligible local risk to existential enterprise risk', () => {
      const junior = getSeniorityProfile('junior');
      const senior = getSeniorityProfile('senior');
      const exec = getSeniorityProfile('executive');

      expect(junior.axes.risk).toBe('operational');
      expect(senior.axes.risk).toBe('systemic');
      expect(exec.axes.risk).toBe('existential');
    });

    it('adapts trade-offs beyond simple time/space complexity', () => {
      const junior = getSeniorityProfile('junior');
      const senior = getSeniorityProfile('senior');
      const manager = getSeniorityProfile('manager');

      expect(junior.axes.trade_offs).toContain('code readability vs local optimization');
      expect(senior.axes.trade_offs).toContain('consistency vs availability (CAP theorem)');
      expect(manager.axes.trade_offs).toContain('team capacity vs aggressive roadmap commitments');
    });
  });

  describe('Seniority Guidance Prompt Generation', () => {
    it('generates rich calibration guidance for evaluation models', () => {
      const prompt = generateSeniorityGuidancePrompt('senior');

      expect(prompt).toContain('SENIORITY CALIBRATION GUIDANCE');
      expect(prompt).toContain('SYSTEM');
      expect(prompt).toContain('HIGH');
      expect(prompt).toContain('Do NOT merely expect harder terminology');
      expect(prompt).toContain('Critical Trade-Offs to Evaluate');
    });
  });

  describe('Evidence Fit Verification', () => {
    it('detects when candidate evidence is insufficient in scope for senior/lead roles', () => {
      const result = validateSeniorityEvidenceFit('senior', {
        demonstrated_scope: 'task', // Expected 'system'
        handled_ambiguity: 'structured', // Expected 'high'
      });

      expect(result.fits).toBe(false);
      expect(result.deviations.length).toBe(2);
      expect(result.deviations[0]).toContain('falls short of expected "system"');
      expect(result.deviations[1]).toContain('significantly below the expected "high" level');
    });

    it('validates good evidence fit when candidate scope and ambiguity match expectations', () => {
      const result = validateSeniorityEvidenceFit('mid', {
        demonstrated_scope: 'subsystem',
        handled_ambiguity: 'moderate',
      });

      expect(result.fits).toBe(true);
      expect(result.deviations.length).toBe(0);
    });
  });
});
