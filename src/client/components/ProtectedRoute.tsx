import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

type AuthUser = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  onboarding_completed?: boolean | number;
};

export default function ProtectedRoute({
  children,
  requireOnboarding = true,
}: {
  children: React.ReactNode;
  requireOnboarding?: boolean;
}) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let active = true;

    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me', {
          credentials: 'same-origin',
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        });

        if (!res.ok) {
          if (active) {
            setAuthorized(false);
            setLoading(false);
            navigate('/login', { replace: true, state: { from: location.pathname } });
          }
          return;
        }

        const data = (await res.json()) as { user?: AuthUser | null };
        const user = data.user;

        if (!user) {
          if (active) {
            setAuthorized(false);
            setLoading(false);
            navigate('/login', { replace: true, state: { from: location.pathname } });
          }
          return;
        }

        // Normalize SQLite boolean/integer representations.
        const onboardingCompleted =
          user.onboarding_completed === true ||
          user.onboarding_completed === 1;

        if (requireOnboarding && !onboardingCompleted) {
          if (active) {
            setAuthorized(false);
            setLoading(false);
            navigate('/onboarding', { replace: true });
          }
          return;
        }

        if (!requireOnboarding && onboardingCompleted) {
          // An already-completed candidate should never remain on onboarding.
          if (active) {
            setAuthorized(false);
            setLoading(false);
            navigate('/dashboard', { replace: true });
          }
          return;
        }

        if (active) {
          setAuthorized(true);
          setLoading(false);
        }
      } catch {
        if (active) {
          setAuthorized(false);
          setLoading(false);
          navigate('/login', { replace: true, state: { from: location.pathname } });
        }
      }
    };

    void checkAuth();

    return () => {
      active = false;
    };
  }, [location.pathname, navigate, requireOnboarding]);

  if (loading || !authorized) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        Authenticating...
      </div>
    );
  }

  return <>{children}</>;
}
