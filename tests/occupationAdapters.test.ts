import { describe, it, expect } from 'vitest';
import {
  OccupationAdapterRegistry,
  globalOccupationRegistry,
  TechnicalOccupationAdapter,
  FinanceOccupationAdapter,
  HealthcareOccupationAdapter,
  EducationOccupationAdapter,
  SalesOccupationAdapter,
  OperationsOccupationAdapter,
  ProfessionalServicesOccupationAdapter,
  SkilledWorkOccupationAdapter,
  GeneralOccupationAdapter,
  OccupationAdapter,
} from '../src/shared/occupationAdapters';

describe('Prompt 16 — Pluggable Occupation Adapters', () => {
  it('registers all 8 required domain adapters', () => {
    const requiredDomains = [
      'technical',
      'finance',
      'healthcare',
      'education',
      'sales',
      'operations',
      'professional_services',
      'skilled_work',
    ];

    expect(globalOccupationRegistry.getAll().length).toBeGreaterThanOrEqual(8);

    for (const domain of requiredDomains) {
      const adapter = globalOccupationRegistry.get(domain);
      expect(adapter, `Expected adapter for domain "${domain}"`).toBeDefined();
      expect(adapter?.domainId).toBe(domain);
      expect(adapter?.displayName).toBeTruthy();
      expect(adapter?.description).toBeTruthy();
      expect(adapter?.standardTaxonomies.length).toBeGreaterThan(0);
      expect(adapter?.regulatoryFrameworks.length).toBeGreaterThan(0);
    }
  });

  describe('Polymorphic Context Matching (Zero Giant Conditionals)', () => {
    it('resolves software engineering contexts to TechnicalOccupationAdapter', () => {
      const adapter = globalOccupationRegistry.resolveAdapter({
        role_title: 'Fullstack TypeScript Developer',
        occupation_name: 'Software Engineer',
      });
      expect(adapter).toBeInstanceOf(TechnicalOccupationAdapter);
      expect(adapter.domainId).toBe('technical');
      expect(adapter.regulatoryFrameworks).toContain('SOC 2');
    });

    it('resolves auditing/accounting contexts to FinanceOccupationAdapter', () => {
      const adapter = globalOccupationRegistry.resolveAdapter({
        role_title: 'Senior SOX Compliance Auditor',
        occupation_name: 'Accounting and Finance',
      });
      expect(adapter).toBeInstanceOf(FinanceOccupationAdapter);
      expect(adapter.domainId).toBe('finance');
      expect(adapter.regulatoryFrameworks).toContain('SOX');
    });

    it('resolves clinical nursing contexts to HealthcareOccupationAdapter', () => {
      const adapter = globalOccupationRegistry.resolveAdapter({
        role_title: 'ICU Critical Care Nurse',
        occupation_name: 'Healthcare Practitioner',
      });
      expect(adapter).toBeInstanceOf(HealthcareOccupationAdapter);
      expect(adapter.domainId).toBe('healthcare');
      expect(adapter.regulatoryFrameworks).toContain('HIPAA');
    });

    it('resolves teaching contexts to EducationOccupationAdapter', () => {
      const adapter = globalOccupationRegistry.resolveAdapter({
        role_title: 'High School Curriculum Instructor',
        occupation_name: 'Secondary Education Teacher',
      });
      expect(adapter).toBeInstanceOf(EducationOccupationAdapter);
      expect(adapter.domainId).toBe('education');
      expect(adapter.regulatoryFrameworks).toContain('FERPA');
    });

    it('resolves sales and revenue contexts to SalesOccupationAdapter', () => {
      const adapter = globalOccupationRegistry.resolveAdapter({
        role_title: 'Enterprise Account Executive',
        occupation_name: 'B2B Commercial Sales',
      });
      expect(adapter).toBeInstanceOf(SalesOccupationAdapter);
      expect(adapter.domainId).toBe('sales');
      expect(adapter.regulatoryFrameworks).toContain('FCPA Anti-Bribery');
    });

    it('resolves supply chain contexts to OperationsOccupationAdapter', () => {
      const adapter = globalOccupationRegistry.resolveAdapter({
        role_title: 'Warehouse Logistics Supervisor',
        occupation_name: 'Supply Chain Operations',
      });
      expect(adapter).toBeInstanceOf(OperationsOccupationAdapter);
      expect(adapter.domainId).toBe('operations');
      expect(adapter.regulatoryFrameworks).toContain('OSHA');
    });

    it('resolves advisory and legal contexts to ProfessionalServicesOccupationAdapter', () => {
      const adapter = globalOccupationRegistry.resolveAdapter({
        role_title: 'Senior Corporate Strategy Consultant',
        occupation_name: 'Management Consulting',
      });
      expect(adapter).toBeInstanceOf(ProfessionalServicesOccupationAdapter);
      expect(adapter.domainId).toBe('professional_services');
    });

    it('resolves trade and repair contexts to SkilledWorkOccupationAdapter', () => {
      const adapter = globalOccupationRegistry.resolveAdapter({
        role_title: 'Industrial Maintenance Electrician',
        occupation_name: 'Electrical Trades',
      });
      expect(adapter).toBeInstanceOf(SkilledWorkOccupationAdapter);
      expect(adapter.domainId).toBe('skilled_work');
      expect(adapter.regulatoryFrameworks).toContain('National Electrical Code (NEC)');
    });

    it('falls back safely to GeneralOccupationAdapter for unrecognized contexts', () => {
      const adapter = globalOccupationRegistry.resolveAdapter({
        role_title: 'Acrobatic Performer',
        occupation_name: 'Circus Arts',
      });
      expect(adapter).toBeInstanceOf(GeneralOccupationAdapter);
      expect(adapter.domainId).toBe('general');
    });
  });

  describe('Domain-Specific Evidence Requirements', () => {
    it('produces clinical patient-safety evidence requirements in healthcare', () => {
      const adapter = new HealthcareOccupationAdapter();
      const req = adapter.getDomainEvidenceRequirement('Emergency Triage Protocol', 'senior');
      expect(req.evaluationCriteria).toContain('Patient safety primacy');
      expect(req.antiPatterns).toContain('Premature diagnostic closure');
      expect(req.criticalTradeOffs).toContain('Immediate stabilization vs definitive root-cause diagnosis');
    });

    it('produces electrical code and lockout/tagout evidence requirements in skilled work', () => {
      const adapter = new SkilledWorkOccupationAdapter();
      const req = adapter.getDomainEvidenceRequirement('High Voltage Circuit Isolation', 'mid');
      expect(req.evaluationCriteria).toContain('OSHA/NEC safety compliance primacy');
      expect(req.antiPatterns).toContain('Bypassing safety interlocks');
    });
  });

  describe('Extensibility and Custom Adapter Injection', () => {
    it('allows registering custom enterprise domain adapters dynamically without modifying core codebase', () => {
      const customRegistry = new OccupationAdapterRegistry();

      class AerospaceFlightAdapter implements OccupationAdapter {
        readonly domainId = 'aerospace';
        readonly displayName = 'Aerospace & Avionics Engineering';
        readonly description = 'Flight control systems and orbital trajectory avionics.';
        readonly standardTaxonomies = ['FAA DO-178C'];
        readonly regulatoryFrameworks = ['FAA Part 25', 'NASA-STD-8739'];

        matches(ctx: any): boolean {
          return /avionics|flight controller|aerospace/i.test(ctx.role_title || '');
        }

        getPreferredModalities(): any {
          return { primary: 'scenario', alternatives: ['coding'], rationale: 'Flight safety critical' };
        }

        getDomainEvidenceRequirement(): any {
          return { requiredEvidence: 'DO-178C Level A artifact trace', evaluationCriteria: ['Zero fatal defect tolerance'], criticalTradeOffs: [], antiPatterns: [] };
        }

        getAccessibilityAccommodations(): string[] {
          return ['accessible_telemetry'];
        }
      }

      customRegistry.register(new AerospaceFlightAdapter());

      const resolved = customRegistry.resolveAdapter({ role_title: 'Avionics Flight Software Lead' });
      expect(resolved.domainId).toBe('aerospace');
      expect(resolved.displayName).toBe('Aerospace & Avionics Engineering');
    });
  });
});
