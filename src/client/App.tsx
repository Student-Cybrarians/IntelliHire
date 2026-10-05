import { Routes, Route, Navigate } from 'react-router-dom';
import PublicLanding from './pages/PublicLanding';
import About from './pages/About';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Onboarding from './pages/Onboarding';
import Assessment from './pages/Assessment';
import AssessmentV2 from './pages/AssessmentV2';
import Resume from './pages/Resume';
import CandidateProfile from './pages/CandidateProfile';
import AdminWorkspace from './pages/AdminWorkspace';
import Module3Pipeline from './pages/Module3Pipeline';
import Module4Interviews from './pages/Module4Interviews';
import Module5Analytics from './pages/Module5Analytics';
import FeaturePlaceholder from './pages/FeaturePlaceholder';
import InterviewPrep from './pages/InterviewPrep';
import Module3Simulation from './pages/Module3Simulation';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<PublicLanding />} />
      <Route path="/about" element={<About />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Candidate Lifecycle */}
      <Route path="/onboarding" element={<ProtectedRoute requireOnboarding={false}><Onboarding /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/candidate" element={<ProtectedRoute><CandidateProfile /></ProtectedRoute>} />
      
      {/* Module 1: Resume Intelligence & Ingestion */}
      <Route path="/resume" element={<ProtectedRoute><Resume /></ProtectedRoute>} />
      <Route path="/module-1" element={<ProtectedRoute><Resume /></ProtectedRoute>} />

      {/* Module 2: Universal Adaptive Evidence Engine */}
      <Route path="/assess" element={<ProtectedRoute><AssessmentV2 /></ProtectedRoute>} />
      <Route path="/module-2" element={<ProtectedRoute><AssessmentV2 /></ProtectedRoute>} />
      <Route path="/interview-prep" element={<ProtectedRoute><InterviewPrep /></ProtectedRoute>} />
      <Route path="/prep" element={<ProtectedRoute><InterviewPrep /></ProtectedRoute>} />
      <Route path="/assessment/:skill_id" element={<ProtectedRoute><Assessment /></ProtectedRoute>} />

      {/* Module 3: Requisition Match & Pipeline */}
      <Route path="/module-3" element={<ProtectedRoute allowedRoles={['recruiter', 'org_admin']}><Module3Pipeline /></ProtectedRoute>} />
      <Route path="/requisitions" element={<ProtectedRoute allowedRoles={['recruiter', 'org_admin']}><Module3Pipeline /></ProtectedRoute>} />
      <Route path="/candidates" element={<ProtectedRoute allowedRoles={['recruiter', 'org_admin']}><Module3Pipeline /></ProtectedRoute>} />

      {/* Module 4: Structured Interview Intelligence */}
      <Route path="/module-4" element={<ProtectedRoute allowedRoles={['recruiter', 'org_admin']}><Module4Interviews /></ProtectedRoute>} />
      <Route path="/interviews" element={<ProtectedRoute allowedRoles={['recruiter', 'org_admin']}><Module4Interviews /></ProtectedRoute>} />

      {/* Module 5: Enterprise Decision Support & Governance */}
      <Route path="/module-5" element={<ProtectedRoute><Module5Analytics /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><Module5Analytics /></ProtectedRoute>} />
      <Route path="/readiness" element={<ProtectedRoute><Module5Analytics /></ProtectedRoute>} />

      {/* Admin Control Center */}
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['org_admin']}><AdminWorkspace /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute allowedRoles={['org_admin']}><AdminWorkspace /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute allowedRoles={['org_admin']}><AdminWorkspace /></ProtectedRoute>} />
      <Route path="/technical-sandbox" element={<ProtectedRoute><Module3Simulation /></ProtectedRoute>} />
      <Route path="/simulation" element={<ProtectedRoute><Module3Simulation /></ProtectedRoute>} />
      <Route path="/sandbox" element={<ProtectedRoute><Module3Simulation /></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
