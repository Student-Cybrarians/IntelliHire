import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import InterviewPrep from './InterviewPrep';
import CandidateWorkspace from './dashboard/CandidateWorkspace';

const mockProfile = {
  success: true,
  profile: {
    target_role: 'Senior Financial Analyst',
    domain: 'Corporate Finance',
    experience_level: 'senior',
    claims_count: 5,
    gaps: [
      { name: 'Variance Analysis Under Inflation', competency: 'Financial Planning', severity: 'critical', proficiency: 0.35, uncertainty: 0.65 }
    ],
    misconceptions: [
      { skill: 'Variance Analysis', misconception: 'Treating cost-push inflation as volume variance' }
    ]
  }
};

const mockPlan = {
  success: true,
  plan_items: [
    {
      id: 'plan-1',
      competency: 'Financial Planning',
      skill: 'Variance Analysis Under Inflation',
      priority: 'high',
      reason: 'Diagnosed deficiency from prior assessment',
      target_capability: 'Isolate price vs volume variance under rapid cost escalations',
      recommended_learning: 'Review decomposition models',
      recommended_practice: 'Decompose Q3 operating costs',
      reassessment_criteria: 'Score >= 75%'
    }
  ]
};

const mockReadiness = {
  success: true,
  readiness: {
    overall_readiness_score: 78,
    evidence_confidence_score: 82,
    competency_coverage: { coverage_percentage: 75, verified: 3, total_competencies: 4 },
    mock_interviews_completed: 2,
    disclaimer: 'This synthesis provides candidate preparation analytics and human decision support. It does NOT constitute an automated hiring decision.',
    remaining_preparation_priorities: [
      { skill: 'Capital Budgeting', competency: 'Valuation', current_level: '55%', target_level: '75%+' }
    ]
  }
};

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn((url: string, opts?: any) => {
    if (url === '/api/m2/prep/profile') {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(mockProfile) });
    }
    if (url === '/api/m2/prep/plan') {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(mockPlan) });
    }
    if (url === '/api/m2/prep/readiness') {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(mockReadiness) });
    }
    if (url === '/api/m2/prep/sessions' && opts?.method === 'POST') {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, session_id: 'test-session-123', mode: 'mock' }) });
    }
    if (url === '/api/m2/prep/sessions/test-session-123/question') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          question: {
            id: 'q-1',
            question_number: 1,
            total_questions: 5,
            competency: 'Financial Planning',
            skill: 'Variance Analysis',
            dimension: 'judgment',
            technique: 'defend-your-answer',
            question: 'The CFO claims your cost variance was due to overhiring. Defend your analysis using wage vs headcount indices.',
            evaluation_criteria: 'Demonstrates clear factor isolation'
          }
        })
      });
    }
    if (url === '/api/m2/prep/sessions/test-session-123/respond' && opts?.method === 'POST') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          response_id: 'resp-1',
          evaluation: {
            score_raw: 0.85,
            analysis: 'Excellent price-volume decomposition demonstrating inflation decoupling.',
            interviewer_follow_up: 'What index did you use for the wage baseline?'
          },
          follow_up: 'What index did you use for the wage baseline?'
        })
      });
    }
    if (url === '/api/m2/prep/sessions/test-session-123/complete') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          session_id: 'test-session-123',
          overall_readiness_score: 85,
          debrief: [
            {
              competency: 'Financial Planning',
              question: 'The CFO claims your cost variance was due to overhiring.',
              score_percentage: 85,
              strengths: 'Rigorous quantitative defense',
              areas_to_improve: 'Reference regional wage disparities'
            }
          ]
        })
      });
    }
    if (url === '/api/m2/prep/sessions/test-session-123/export') {
      return Promise.resolve({
        ok: true,
        blob: () => Promise.resolve(new Blob(['mock docx content'], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }))
      });
    }
    // Candidate workspace mocks
    if (url === '/api/dashboard/candidate') {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ profile: { readiness_score: 0.75, target_role: 'Senior Analyst' }, modules: {} }) });
    }
    if (url === '/api/resume/status') {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ claims: [] }) });
    }
    if (url === '/api/requisitions') {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, requisitions: [] }) });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
  }));
});

describe('Phase 0 Verification: M02 Interview Preparation Engine UI & Flows', () => {
  it('loads Preparation Profile, gaps, and misconceptions', async () => {
    render(<BrowserRouter><InterviewPrep /></BrowserRouter>);

    expect(await screen.findByText(/Adaptive Interview Preparation Engine/i)).toBeInTheDocument();
    expect(await screen.findByText('Senior Financial Analyst')).toBeInTheDocument();
    expect(await screen.findByText('Variance Analysis Under Inflation')).toBeInTheDocument();
    expect(await screen.findByText(/Treating cost-push inflation as volume variance/i)).toBeInTheDocument();
  });

  it('renders Evidence-Based Preparation Plan tab', async () => {
    render(<BrowserRouter><InterviewPrep /></BrowserRouter>);

    const planTabBtn = await screen.findByRole('button', { name: /Evidence-Based Plan/i });
    fireEvent.click(planTabBtn);

    expect(await screen.findByText(/Prioritized Capability Preparation Plan/i)).toBeInTheDocument();
    expect(await screen.findByText(/Isolate price vs volume variance under rapid cost escalations/i)).toBeInTheDocument();
    expect(await screen.findByText(/Review decomposition models/i)).toBeInTheDocument();
  });

  it('allows simulation mode selection and runs full interactive mock interview loop', async () => {
    render(<BrowserRouter><InterviewPrep /></BrowserRouter>);

    // Switch to simulation tab
    const simTabBtn = await screen.findByRole('button', { name: /Interactive Simulator/i });
    fireEvent.click(simTabBtn);

    // Click Launch Mock Interview
    const launchBtn = await screen.findByRole('button', { name: /Start Mock Interview/i });
    fireEvent.click(launchBtn);

    // Verify question is loaded with questioning technique
    expect(await screen.findByText(/The CFO claims your cost variance was due to overhiring/i)).toBeInTheDocument();
    expect(await screen.findByText(/Technique: defend-your-answer/i)).toBeInTheDocument();

    // Fill in candidate response
    const textarea = screen.getByPlaceholderText(/Provide a comprehensive response detailing your methodology/i);
    fireEvent.change(textarea, { target: { value: 'We isolated headcount from compensation. The variance was 85% labor-cost inflation driven by statutory union rate hikes, with headcount exactly at budget.' } });

    // Submit answer
    const submitBtn = screen.getByRole('button', { name: /Submit Response/i });
    fireEvent.click(submitBtn);

    // Verify evaluation reaction & follow-up probe render
    await waitFor(() => {
      expect(screen.getByText(/What index did you use for the wage baseline?/i)).toBeInTheDocument();
    });
  });

  it('renders Readiness Synthesis tab with ethical decision support disclaimer', async () => {
    render(<BrowserRouter><InterviewPrep /></BrowserRouter>);

    const readinessTabBtn = await screen.findByRole('button', { name: /Readiness Synthesis/i });
    fireEvent.click(readinessTabBtn);

    expect(await screen.findByText('78%')).toBeInTheDocument();
    expect(await screen.findByText(/Ethical Decision Support & Safety Notice/i)).toBeInTheDocument();
    expect(await screen.findByText(/does NOT constitute an automated hiring decision/i)).toBeInTheDocument();
    expect(await screen.findByText('Capital Budgeting')).toBeInTheDocument();
  });

  it('CandidateWorkspace includes working link to Interview Prep', async () => {
    render(<BrowserRouter><CandidateWorkspace profileName="Jane Doe" /></BrowserRouter>);

    const prepCard = await screen.findByText('Interview Prep');
    expect(prepCard).toBeInTheDocument();
    expect(prepCard.closest('a')).toHaveAttribute('href', '/interview-prep');
  });
});
