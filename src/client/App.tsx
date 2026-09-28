import { Routes, Route, Navigate } from 'react-router-dom';
import PublicLanding from './pages/PublicLanding';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Onboarding from './pages/Onboarding';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicLanding />} />
      <Route path="/login" element={<Login />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
