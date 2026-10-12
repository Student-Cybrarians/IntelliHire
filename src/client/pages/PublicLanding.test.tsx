import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import PublicLanding from './PublicLanding';

global.fetch = vi.fn();

describe('PublicLanding Homepage Transformation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockImplementation((url: string) => {
      if (url === '/api/auth/me') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ authenticated: false })
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
  });

  it('renders the hero section with core product positioning and working CTAs', async () => {
    render(
      <BrowserRouter>
        <PublicLanding />
      </BrowserRouter>
    );

    expect(screen.getByText(/Your potential deserves more than a résumé\./i)).toBeInTheDocument();
    expect(screen.getByText(/Build the skills, practise the situations, and develop the evidence/i)).toBeInTheDocument();

    const startWorkspaceLink = screen.getByRole('link', { name: /Start Building Your Readiness/i });
    expect(startWorkspaceLink).toHaveAttribute('href', '/register');

    const exploreModulesLink = screen.getByRole('link', { name: /Explore the 5 Modules/i });
    expect(exploreModulesLink).toHaveAttribute('href', '#modules');

    const walkthroughLink = screen.getByRole('link', { name: /See How It Works/i });
    expect(walkthroughLink).toHaveAttribute('href', '#walkthrough');
  });

  it('switches hero primary CTA to Continue in Your Workspace when user is authenticated', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url === '/api/auth/me') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            authenticated: true,
            user: { id: 'u1', email: 'test@example.com', role: 'candidate' }
          })
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(
      <BrowserRouter>
        <PublicLanding />
      </BrowserRouter>
    );

    await waitFor(() => {
      const continueWorkspaceLink = screen.getByRole('link', { name: /Continue in Your Workspace/i });
      expect(continueWorkspaceLink).toHaveAttribute('href', '/dashboard');
    });
  });

  it('renders the Problem section, Founder Mission & Design Philosophy without fabricated biographies', () => {
    render(
      <BrowserRouter>
        <PublicLanding />
      </BrowserRouter>
    );

    expect(
      screen.getByText(/Looking qualified on paper is not the same as being ready for the work\./i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Why we are building IntelliHire/i)).toBeInTheDocument();
    expect(screen.getByText(/Beyond Résumé Presentation/i)).toBeInTheDocument();
    expect(screen.getByText(/AI as a Coach, Never a Fabricator/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Accountable Human Oversight/i).length).toBeGreaterThanOrEqual(1);
  });

  it('renders all 14 stages of the IntelliHire lifecycle and supports phase filtering', () => {
    render(
      <BrowserRouter>
        <PublicLanding />
      </BrowserRouter>
    );

    const expectedStages = [
      'Discover',
      'Profile',
      'Resume',
      'Match',
      'Gap Analysis',
      'Learn',
      'Practice',
      'Simulate',
      'Evidence',
      'Prepare',
      'Assess',
      'Readiness',
      'Opportunity',
      'Improve'
    ];

    for (const stage of expectedStages) {
      expect(screen.getAllByText(stage).length).toBeGreaterThan(0);
    }

    // Filter to Demonstrate & Verify phase
    const phase3Btn = screen.getByRole('button', { name: 'Demonstrate & Verify' });
    fireEvent.click(phase3Btn);

    // Stage 09 Evidence summary should remain visible while Stage 01 Discover summary is filtered out
    expect(
      screen.getByText(/Capture observable work artifacts, rubric evaluations, and provenance records\./i)
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Explore occupational domains and target roles grounded in O\*NET and ESCO taxonomies\./i)
    ).not.toBeInTheDocument();

    // Reset back to All stages
    fireEvent.click(screen.getByRole('button', { name: 'All' }));
    expect(
      screen.getByText(/Explore occupational domains and target roles grounded in O\*NET and ESCO taxonomies\./i)
    ).toBeInTheDocument();
  });

  it('renders all five modules (M01–M05) with accurate capabilities and route links', () => {
    render(
      <BrowserRouter>
        <PublicLanding />
      </BrowserRouter>
    );

    expect(screen.getByText(/Resume Intelligence, Claim Provenance & Hybrid ATS Alignment/i)).toBeInTheDocument();
    expect(screen.getByText(/Adaptive Learning, Bayesian Assessment & Interview Preparation/i)).toBeInTheDocument();
    expect(screen.getByText(/Technical, Domain & Professional Work-Surface Simulation/i)).toBeInTheDocument();
    expect(screen.getByText(/Behavioral, Communication & Professional Interaction Simulation/i)).toBeInTheDocument();
    expect(screen.getByText(/Candidate Readiness Synthesis & Human Decision Support/i)).toBeInTheDocument();

    expect(screen.getByRole('link', { name: /Explore Module 1 · Resume Intelligence/i })).toHaveAttribute(
      'href',
      '/resume'
    );
    expect(screen.getByRole('link', { name: /Explore M02 Adaptive Assessment/i })).toHaveAttribute('href', '/assess');
    expect(screen.getByRole('link', { name: /Launch M03 Simulation Workspace/i })).toHaveAttribute(
      'href',
      '/simulation'
    );
    expect(screen.getByRole('link', { name: /Explore Module 4 · Structured Interviews/i })).toHaveAttribute(
      'href',
      '/interviews'
    );
    expect(screen.getByRole('link', { name: /Explore Module 5 · Readiness & Governance/i })).toHaveAttribute(
      'href',
      '/results'
    );
  });

  it('supports switching tabs in the Interactive Product Walkthrough and labels synthetic data clearly', () => {
    render(
      <BrowserRouter>
        <PublicLanding />
      </BrowserRouter>
    );

    expect(screen.getByText(/ILLUSTRATIVE SAMPLE/i)).toBeInTheDocument();
    expect(screen.getByText(/Step 1 · Target Role & Gap Identification \(M01\)/i)).toBeInTheDocument();

    const step4Tab = screen.getByRole('tab', { name: /STEP 04/i });
    fireEvent.click(step4Tab);

    expect(screen.getByText(/Step 4 · Sequential AI Interview & Coaching \(M04\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Question 3 of 10 \(Sequential\)/i)).toBeInTheDocument();

    const step5Tab = screen.getByRole('tab', { name: /STEP 05/i });
    fireEvent.click(step5Tab);

    expect(screen.getByText(/Step 5 · 5-Layer Evidence Ledger & Next Steps \(M05\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Reserved Exclusively for Humans/i)).toBeInTheDocument();
  });

  it('presents transparent pricing, schema-backed quotas, and responsible AI safeguards honestly', () => {
    render(
      <BrowserRouter>
        <PublicLanding />
      </BrowserRouter>
    );

    // Pricing & Quotas
    expect(
      screen.getByText(/Start for free in the Public Sandbox\. Honest disclosure on plans and limits\./i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Public Sandbox \/ Explore/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Pricing Not Yet Established/i).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/5 MB per file/i)).toBeInTheDocument();
    expect(screen.getByText(/100 daily AI calls/i)).toBeInTheDocument();

    // Responsible AI & Privacy
    expect(screen.getByText(/Engineered with verifiable guardrails, not marketing promises/i)).toBeInTheDocument();
    expect(screen.getByText(/Zero Fabrication of Candidate Facts/i)).toBeInTheDocument();
    expect(screen.getByText(/Optional Camera & Zero Video Storage/i)).toBeInTheDocument();
    expect(screen.getByText(/No Biometric, Emotion, or Voice Inference/i)).toBeInTheDocument();
    expect(screen.getByText(/PII Redaction & Human Decision Control/i)).toBeInTheDocument();
  });

  it('expands and collapses FAQ accordion items cleanly', () => {
    render(
      <BrowserRouter>
        <PublicLanding />
      </BrowserRouter>
    );

    const cameraFaqQuestion = screen.getByRole('button', {
      name: /Is camera use required during M04 interview practice\?/i
    });
    expect(cameraFaqQuestion).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(cameraFaqQuestion);
    expect(cameraFaqQuestion).toHaveAttribute('aria-expanded', 'true');
    expect(
      screen.getByText(/No\. Camera use in M04 is 100% optional and disabled by default\./i)
    ).toBeInTheDocument();
  });
});
