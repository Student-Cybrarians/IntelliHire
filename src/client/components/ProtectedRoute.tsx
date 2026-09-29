import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ProtectedRoute({ children, requireOnboarding = true }: { children: React.ReactNode, requireOnboarding?: boolean }) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then((data: any) => {
        if (!data.user) {
          navigate('/login');
          return;
        }
        
        if (requireOnboarding && !data.user.onboarding_completed) {
          navigate('/onboarding');
          return;
        }

        if (!requireOnboarding && data.user.onboarding_completed) {
          // If we are on the onboarding page but already completed it, go to dashboard
          navigate('/dashboard');
          return;
        }

        setAuthorized(true);
        setLoading(false);
      })
      .catch(() => {
        navigate('/login');
      });
  }, [navigate, requireOnboarding]);

  if (loading || !authorized) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Authenticating...</div>;
  }

  return <>{children}</>;
}

