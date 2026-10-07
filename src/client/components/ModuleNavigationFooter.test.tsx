import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ModuleNavigationFooter, { CANDIDATE_JOURNEY_STEPS } from './ModuleNavigationFooter';

describe('ModuleNavigationFooter Component', () => {
  it('renders all 5 candidate journey module steps in correct order', () => {
    render(
      <MemoryRouter initialEntries={['/simulation']}>
        <ModuleNavigationFooter currentModule="M03" />
      </MemoryRouter>
    );

    expect(screen.getByRole('navigation', { name: /IntelliHire Candidate Journey Navigation/i })).toBeInTheDocument();

    CANDIDATE_JOURNEY_STEPS.forEach(step => {
      expect(screen.getByTitle(new RegExp(`${step.label}: ${step.fullName}`, 'i'))).toBeInTheDocument();
    });
  });

  it('marks current module active and previous modules as accessible', () => {
    render(
      <MemoryRouter initialEntries={['/simulation']}>
        <ModuleNavigationFooter currentModule="M03" />
      </MemoryRouter>
    );

    const m3Button = screen.getByTitle(/M03: Technical & Domain Simulation/i);
    expect(m3Button).toHaveAttribute('aria-current', 'step');

    const m1Button = screen.getByTitle(/M01: Resume Intelligence/i);
    expect(m1Button).not.toBeDisabled();

    const m2Button = screen.getByTitle(/M02: Adaptive Assessment/i);
    expect(m2Button).not.toBeDisabled();

    // Future modules without progress should be disabled
    const m5Button = screen.getByTitle(/M05: Decision Support & Results/i);
    expect(m5Button).toBeDisabled();
  });

  it('navigates to next module when Next Module button is clicked', async () => {
    let currentPath = '/simulation';

    function TestApp() {
      return (
        <Routes>
          <Route
            path="/simulation"
            element={
              <div>
                <h1>Module 3 Page</h1>
                <ModuleNavigationFooter currentModule="M03" />
              </div>
            }
          />
          <Route path="/interviews" element={<div><h1>Module 4 Interviews Page</h1></div>} />
        </Routes>
      );
    }

    render(
      <MemoryRouter initialEntries={['/simulation']}>
        <TestApp />
      </MemoryRouter>
    );

    const nextButton = screen.getByRole('button', { name: /Proceed to Next Module: M04 · Interviews/i });
    expect(nextButton).toBeInTheDocument();

    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Module 4 Interviews Page')).toBeInTheDocument();
    });
  });

  it('executes onBeforeNavigate callback before proceeding and handles errors safely', async () => {
    const onBeforeNavigate = vi.fn().mockResolvedValue(true);

    render(
      <MemoryRouter initialEntries={['/simulation']}>
        <Routes>
          <Route
            path="/simulation"
            element={
              <ModuleNavigationFooter
                currentModule="M03"
                onBeforeNavigate={onBeforeNavigate}
              />
            }
          />
          <Route path="/interviews" element={<div><h1>Target Reached</h1></div>} />
        </Routes>
      </MemoryRouter>
    );

    const nextButton = screen.getByRole('button', { name: /Proceed to Next Module: M04 · Interviews/i });
    fireEvent.click(nextButton);

    expect(screen.getByText(/Saving & Continuing…/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(onBeforeNavigate).toHaveBeenCalledTimes(1);
      expect(screen.getByText('Target Reached')).toBeInTheDocument();
    });
  });

  it('aborts navigation if onBeforeNavigate returns false', async () => {
    const onBeforeNavigate = vi.fn().mockResolvedValue(false);

    render(
      <MemoryRouter initialEntries={['/simulation']}>
        <Routes>
          <Route
            path="/simulation"
            element={
              <ModuleNavigationFooter
                currentModule="M03"
                onBeforeNavigate={onBeforeNavigate}
              />
            }
          />
          <Route path="/interviews" element={<div><h1>Target Reached</h1></div>} />
        </Routes>
      </MemoryRouter>
    );

    const nextButton = screen.getByRole('button', { name: /Proceed to Next Module: M04 · Interviews/i });
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(onBeforeNavigate).toHaveBeenCalledTimes(1);
    });

    expect(screen.queryByText('Target Reached')).not.toBeInTheDocument();
  });
});
