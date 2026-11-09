// functions/api/m1AtsEngine.test.ts
import { describe, it, expect } from 'vitest';
import {
  extractNGrams,
  computeTfIdfVectors,
  calculateCosineSimilarity,
  computeBM25Score,
  computeConvexFusedMatch,
  evaluateAtsResume,
  PAPER_DEFAULT_WEIGHTS,
  AHP_WEIGHTS
} from './m1AtsEngine';

describe('Module 1: ATS Resume Engine (IEEE Paper Compliance)', () => {
  const sampleResume = `
    Alex Mercer
    alex.mercer@example.com | +1 (555) 019-2834
    
    Professional Summary:
    Results-driven Software Engineer with 5+ years of experience designing scalable microservices.
    Led distributed cloud migrations that improved throughput by 45% and reduced latency by $200k/year.
    
    Technical Skills:
    TypeScript, Node.js, Python, PostgreSQL, Docker, Kubernetes, AWS, GraphQL, CI/CD, React.
    
    Work Experience:
    Senior Software Engineer - CloudScale Systems (2021 - Present)
    - Architected event-driven distributed pipeline processing 25M transactions daily using Node.js and Kafka.
    - Optimized PostgreSQL query execution plans, reducing p99 database latency from 450ms to 22ms.
    - Spearheaded zero-downtime database migrations with automated rollbacks.
    
    Education:
    B.S. in Computer Science - University of Technology (2017 - 2021)
    
    Certifications:
    AWS Certified Solutions Architect
  `;

  const sampleJd = `
    Role: Senior Backend Engineer
    We are looking for a Senior Backend Engineer proficient in TypeScript, Node.js, and PostgreSQL.
    Key Responsibilities:
    - Build and scale distributed microservices handling high transaction volumes.
    - Optimize database performance and implement fault-tolerant architectures.
    - Lead cloud deployments using Docker, Kubernetes, and AWS.
    Requirements:
    - 4+ years of professional backend engineering experience.
    - Strong expertise in SQL, query optimization, and event-driven architectures.
    - Proven leadership in delivering robust production software with measurable business impact.
  `;

  it('correctly extracts unigrams and bigrams filtering out standard stopwords', () => {
    const text = 'Architected event-driven distributed pipeline processing transactions';
    const ngrams = extractNGrams(text);
    expect(ngrams).toContain('architected');
    expect(ngrams).toContain('pipeline');
    expect(ngrams).toContain('architected_event-driven');
    expect(ngrams).not.toContain('the');
    expect(ngrams).not.toContain('and');
  });

  it('computes TF-IDF vectors and non-zero cosine similarity for aligned resume and JD', () => {
    const { vectorA, vectorB } = computeTfIdfVectors(sampleResume, sampleJd);
    expect(Object.keys(vectorA).length).toBeGreaterThan(10);
    expect(Object.keys(vectorB).length).toBeGreaterThan(10);

    const cosineSim = calculateCosineSimilarity(vectorA, vectorB);
    expect(cosineSim).toBeGreaterThan(0.12);
    expect(cosineSim).toBeLessThanOrEqual(1.0);
  });

  it('calculates BM25 retrieval score between query and document', () => {
    const bm25 = computeBM25Score(sampleResume, sampleJd);
    expect(bm25).toBeGreaterThan(0.15);
    expect(bm25).toBeLessThanOrEqual(1.0);
  });

  it('computes dense-sparse convex fusion with lambda = 0.65', () => {
    const dense = 0.80;
    const sparse = 0.60;
    const fused = computeConvexFusedMatch(dense, sparse, 0.65);
    // 0.65 * 0.80 + 0.35 * 0.60 = 0.52 + 0.21 = 0.73
    expect(fused).toBeCloseTo(0.73, 2);
  });

  it('generates complete 6-component ATS scorecard under IEEE default weights', () => {
    const scorecard = evaluateAtsResume(sampleResume, sampleJd, PAPER_DEFAULT_WEIGHTS);
    
    expect(scorecard.overallAtsScore).toBeGreaterThanOrEqual(60);
    expect(scorecard.overallAtsScore).toBeLessThanOrEqual(100);
    expect(scorecard.weightsUsed.keywordAlignment).toBe(0.35);
    expect(scorecard.weightsUsed.sectionCompleteness).toBe(0.20);
    expect(scorecard.weightsUsed.skillsCoverage).toBe(0.20);
    expect(scorecard.weightsUsed.formattingCompliance).toBe(0.10);
    expect(scorecard.weightsUsed.atsParseability).toBe(0.10);
    expect(scorecard.weightsUsed.professionalSummary).toBe(0.05);

    // Verify individual component properties
    expect(scorecard.components.atsParseability.metrics.hasEmail).toBe(true);
    expect(scorecard.components.atsParseability.metrics.hasPhone).toBe(true);
    expect(scorecard.components.atsParseability.metrics.hasDates).toBe(true);
    expect(scorecard.components.sectionCompleteness.detectedSections).toContain('experience');
    expect(scorecard.components.sectionCompleteness.detectedSections).toContain('skills');
    expect(scorecard.components.professionalSummary.qualityIndicators.length).toBeGreaterThan(0);
  });

  it('supports AHP-calibrated weight profiles as specified in research notes', () => {
    const ahpScorecard = evaluateAtsResume(sampleResume, sampleJd, AHP_WEIGHTS);
    expect(ahpScorecard.weightsUsed.keywordAlignment).toBe(0.32);
    expect(ahpScorecard.weightsUsed.sectionCompleteness).toBe(0.22);
    expect(ahpScorecard.weightsUsed.skillsCoverage).toBe(0.18);
    expect(ahpScorecard.weightsUsed.formattingCompliance).toBe(0.12);
    expect(ahpScorecard.weightsUsed.atsParseability).toBe(0.10);
    expect(ahpScorecard.weightsUsed.professionalSummary).toBe(0.06);
    expect(ahpScorecard.overallAtsScore).toBeGreaterThanOrEqual(60);
  });

  it('penalizes empty or non-compliant resumes appropriately', () => {
    const badResume = 'Just a couple of words here.';
    const scorecard = evaluateAtsResume(badResume, sampleJd);
    expect(scorecard.overallAtsScore).toBeLessThan(50);
    expect(scorecard.components.formattingCompliance.issues.length).toBeGreaterThan(0);
    expect(scorecard.components.atsParseability.metrics.hasEmail).toBe(false);
  });
});
