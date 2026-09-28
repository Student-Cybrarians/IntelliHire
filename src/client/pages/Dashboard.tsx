import { useEffect, useState } from 'react';
import DashboardLayout from './dashboard/DashboardLayout';
import CandidateWorkspace from './dashboard/CandidateWorkspace';
import RecruiterWorkspace from './dashboard/RecruiterWorkspace';
import Forbidden from './dashboard/Forbidden';
import { useNavigate } from 'react-router-dom';

export default function DashboardRouter() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then((data: any) => {
        if (!data.user) {
          navigate('/login');
        } else {
          setUser(data.user);
        }
        setLoading(false);
      })
      .catch(() => {
        navigate('/login');
      });
  }, [navigate]);

  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Authenticating...</div>;
  }

  if (!user) return null;

  return (
    <DashboardLayout role={user.role} userFullName={user.full_name}>
      {user.role === 'candidate' && <CandidateWorkspace profileName={user.full_name} />}
      {(user.role === 'recruiter' || user.role === 'org_admin') && <RecruiterWorkspace />}
      {user.role !== 'candidate' && user.role !== 'recruiter' && user.role !== 'org_admin' && <Forbidden />}
    </DashboardLayout>
  );
}
