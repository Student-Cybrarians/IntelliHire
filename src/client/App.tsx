import { Routes, Route, Navigate } from 'react-router-dom';
import PublicLanding from './pages/PublicLanding';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Onboarding from './pages/Onboarding';
import Assessment from './pages/Assessment';
import Resume from './pages/Resume';
import FeaturePlaceholder from './pages/FeaturePlaceholder';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<PublicLanding />} />
      <Route path="/login" element={<Login />} />

      {/* Candidate lifecycle */}
      <Route path="/onboarding" element={<ProtectedRoute requireOnboarding={false}><Onboarding /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/assessment/:skill_id" element={<ProtectedRoute><Assessment /></ProtectedRoute>} />

      {/* Dashboard navigation targets.
          These are real routes so navigation never falls through to the public landing page.
          Detailed module implementations can replace the placeholders independently. */}
      <Route path="/resume" element={<ProtectedRoute><Resume /></ProtectedRoute>} />
      <Route path="/technical-sandbox" element={<ProtectedRoute><FeaturePlaceholder title="Technical Sandbox" description="Technical and domain simulation workspace." /></ProtectedRoute>} />
      <Route path="/requisitions" element={<ProtectedRoute allowedRoles={['recruiter', 'org_admin']}><FeaturePlaceholder title="Active Requisitions" description="Recruiter requisition workspace." /></ProtectedRoute>} />
      <Route path="/candidates" element={<ProtectedRoute allowedRoles={['recruiter', 'org_admin']}><FeaturePlaceholder title="Candidate Pipeline" description="Candidate review workspace." /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute allowedRoles={['org_admin']}><FeaturePlaceholder title="Organization Settings" description="Organization administration workspace." /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute allowedRoles={['org_admin']}><FeaturePlaceholder title="User Management" description="Organization user-management workspace." /></ProtectedRoute>} />

      {/* Unknown application routes must not silently send authenticated users to the public landing page. */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
