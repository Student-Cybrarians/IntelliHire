import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DashboardLayout from './DashboardLayout';
import CandidateWorkspace from './CandidateWorkspace';

describe('Candidate Sidebar & Navigation Simplification', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url === '/api/dashboard/candidate') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            profile: {
              target_role: 'Full Stack Engineer',
              experience_level: 'mid',
              primary_domain: 'Software Engineering',
              skills_json: '["TypeScript", "React", "Node.js"]',
              bio: 'Experienced developer',
              readiness_score: 0.82
            },
            modules: { resume_uploaded: true, resume: { filename: 'resume.pdf' } }
          })
        });
      }
      if (url === '/api/resume/status') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            claims: [{ claim_type: 'Skill', claim_value: 'TypeScript', verification_state: 'verified', confidence_score: 0.95 }]
          })
        });
      }
      if (url === '/api/requisitions') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, requisitions: [] })
        });
      }
      if (url === '/api/training/pathways') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            pathways: [
              {
                id: 'pw-1',
                title: 'Full Stack Competency Pathway',
                target_role: 'Full Stack Engineer',
                progress_pct: 65,
                status: 'in_progress',
                total_modules: 4,
                mastered_modules: 2
              }
            ]
          })
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    }));
  });

  it('1. Candidate sidebar contains exactly the 7 primary destinations', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <DashboardLayout role="candidate" userFullName="Alex Morgan">
          <div>Child Content</div>
        </DashboardLayout>
      </MemoryRouter>
    );

    // Primary items:
    expect(screen.getByRole('link', { name: /IntelliHire Home/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Dashboard · Learning Progress/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Module 1 · Resume Intelligence/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Module 2 · Aptitude \/ Assessment Preparation/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Module 3 · Technical Round/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Module 4 · HR Round/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Module 5 · Results/i })).toBeInTheDocument();
  });

  it('2. Explicitly verifies removed items are NOT in candidate navigation', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <DashboardLayout role="candidate" userFullName="Alex Morgan">
          <div>Child Content</div>
        </DashboardLayout>
      </MemoryRouter>
    );

    const nav = screen.getByRole('navigation', { name: /Dashboard Navigation/i });

    // "Evidence Portfolio" should NOT be in primary nav links
    expect(nav).not.toHaveTextContent('Evidence Portfolio');
    // "M6 · Learning Pathways" should NOT be in primary nav
    expect(nav).not.toHaveTextContent('M6 · Learning Pathways');
    // "M5 · Readiness Synthesis" should NOT be in primary nav
    expect(nav).not.toHaveTextContent('M5 · Readiness Synthesis');
    // Internal shorthand labels should not be in primary nav
    expect(nav).not.toHaveTextContent('M1 · Resume Studio');
    expect(nav).not.toHaveTextContent('M2 · Adaptive Assessment');
  });

  it('3. Candidate navigation destinations point to the correct routes', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <DashboardLayout role="candidate" userFullName="Alex Morgan">
          <div>Child Content</div>
        </DashboardLayout>
      </MemoryRouter>
    );

    // 1. Home points to /dashboard for candidate
    const homeLink = screen.getByRole('link', { name: /IntelliHire Home/i });
    expect(homeLink).toHaveAttribute('href', '/dashboard');

    // 2. Dashboard
    const dashLink = screen.getByRole('link', { name: /Dashboard · Learning Progress/i });
    expect(dashLink).toHaveAttribute('href', '/dashboard');

    // 3. Module 1
    const m1Link = screen.getByRole('link', { name: /Module 1 · Resume Intelligence/i });
    expect(m1Link).toHaveAttribute('href', '/resume');

    // 4. Module 2
    const m2Link = screen.getByRole('link', { name: /Module 2 · Aptitude \/ Assessment Preparation/i });
    expect(m2Link).toHaveAttribute('href', '/assess');

    // 5. Module 3
    const m3Link = screen.getByRole('link', { name: /Module 3 · Technical Round/i });
    expect(m3Link).toHaveAttribute('href', '/simulation');

    // 6. Module 4
    const m4Link = screen.getByRole('link', { name: /Module 4 · HR Round/i });
    expect(m4Link).toHaveAttribute('href', '/interviews');

    // 7. Module 5
    const m5Link = screen.getByRole('link', { name: /Module 5 · Results/i });
    expect(m5Link).toHaveAttribute('href', '/results');
  });

  it('4. Candidate footer contains profile link, avatar initials, and sign out', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <DashboardLayout role="candidate" userFullName="Alex Morgan">
          <div>Child Content</div>
        </DashboardLayout>
      </MemoryRouter>
    );

    // Profile card link
    const profileLink = screen.getByRole('link', { name: /Candidate Profile/i });
    expect(profileLink).toHaveAttribute('href', '/candidate');
    expect(profileLink).toHaveTextContent('Alex Morgan');
    expect(profileLink).toHaveTextContent('AM'); // Initials

    // Sign out buttons are available (icon and text button)
    const signOutBtns = screen.getAllByRole('button', { name: /Sign Out/i });
    expect(signOutBtns.length).toBeGreaterThanOrEqual(1);
  });

  it('5. Brand link points to / for unauthenticated/non-candidate layouts', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <DashboardLayout role="recruiter" userFullName="Jane Recruiter">
          <div>Child Content</div>
        </DashboardLayout>
      </MemoryRouter>
    );

    // For recruiter, Brand header points to /
    const brandLink = screen.getByRole('link', { name: /IntelliHire Brand/i });
    expect(brandLink).toHaveAttribute('href', '/');
  });

  it('6. Recruiter navigation remains completely preserved and unaffected', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <DashboardLayout role="recruiter" userFullName="Jane Recruiter">
          <div>Child Content</div>
        </DashboardLayout>
      </MemoryRouter>
    );

    const nav = screen.getByRole('navigation', { name: /Dashboard Navigation/i });
    expect(nav).toHaveTextContent('Recruitment Engine');
    expect(nav).toHaveTextContent('Pipeline Overview');
    expect(nav).toHaveTextContent('M3 · Requisitions & Match');
    expect(nav).toHaveTextContent('M4 · Structured Interviews');
    expect(nav).toHaveTextContent('M5 · Decision Cockpit');
    expect(nav).toHaveTextContent('M6 · Cohort Pathways');

    // Candidate items are not present in recruiter nav
    expect(nav).not.toHaveTextContent('Module 1 · Resume Intelligence');
    expect(nav).not.toHaveTextContent('Module 2 · Aptitude / Assessment Preparation');
  });

  it('7. CandidateWorkspace renders Dashboard · Learning Progress badge and 5-module progression strip', async () => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <CandidateWorkspace profileName="Alex Morgan" />
        </MemoryRouter>
      );
    });

    // Badge
    expect(screen.getByText('Dashboard · Learning Progress')).toBeInTheDocument();

    // Module Progression Strip
    expect(screen.getByText('Candidate Journey · Module Progression')).toBeInTheDocument();
    expect(screen.getByText('Resume Intelligence')).toBeInTheDocument();
    expect(screen.getByText('Aptitude Prep')).toBeInTheDocument();
    expect(screen.getByText('Technical Round')).toBeInTheDocument();
    expect(screen.getByText('HR Round')).toBeInTheDocument();
    expect(screen.getByText('Results')).toBeInTheDocument();

    // Learning pathways section displays without "M6"
    expect(screen.getByText('Personalized Learning Pathways & Curricula')).toBeInTheDocument();
    expect(screen.getByText('Full Stack Competency Pathway')).toBeInTheDocument();
    expect(screen.queryByText(/M6/i)).not.toBeInTheDocument();
  });
});
