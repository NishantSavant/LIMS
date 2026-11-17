// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, dashboardPathForRole, useAuth, UserRole } from './auth';
import Login from './components/Login';
import Signup from './components/Signup';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import AdminDashboard from './components/AdminDashboard';
import Home from './components/Home';
import PatientDashboard from './components/PatientDashboard';
import DoctorDashboard from './components/DoctorDashboard';
import LabDashboard from './components/LabDashboard';
import LabUploadReports from './components/LabUploadReports';
import LabAppointments from './components/LabAppointments';
import LabPendingRequests from './components/LabPendingRequests';
import LabReportsList from './components/LabReportsList';
import PatientAppointments from './components/PatientAppointments';
import BookAppointmentForm from './components/BookAppointmentForm';
import PatientSettings from './components/PatientSettings';
import MyPatientsPage from './components/MyPatientsPage';
import MyDoctorsPage from './components/MyDoctorsPage';
import AddDoctorModal from './components/AddDoctorModal';
import DoctorAppointments from './components/DoctorAppointments';
import DoctorCases from './components/DoctorCases';
import PatientViewReports from './components/PatientViewReports';
import LabCreateSample from './components/LabCreateSample';
import DoctorLayout from './components/DoctorLayout';
import PatientLayout from './components/PatientLayout';
import LabLayout from './components/LabLayout';
import DoctorSettings from './components/DoctorSettings';
import LabSettings from './components/LabSettings';

const GlobalBackButton: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const hiddenPaths = [
    '/',
    '/login',
    '/signup',
    '/patient-dashboard',
    '/patient/dashboard',
    '/doctor/dashboard',
    '/lab-dashboard',
    '/lab/dashboard',
  ];
  if (hiddenPaths.includes(location.pathname)) return null;

  let leftOffset = 14;
  if (location.pathname.startsWith('/doctor')) leftOffset = 294; // sidebar 280 + gap
  else if (location.pathname.startsWith('/patient')) leftOffset = 254; // sidebar 240 + gap
  else if (location.pathname.startsWith('/lab')) leftOffset = 244; // sidebar 230 + gap

  return (
    <button
      className="btn btn-outline-secondary global-back-button"
      style={{
        position: 'fixed',
        top: 14,
        left: leftOffset,
        zIndex: 1100,
        padding: '7px',
      }}
      onClick={() => navigate(-1)}
    >
      Back
    </button>
  );
};

const PageLoading: React.FC = () => <div className="p-4">Loading…</div>;

const PublicRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isLoading, role } = useAuth();
  if (isLoading) return <PageLoading />;
  return role ? <Navigate to={dashboardPathForRole(role)} replace /> : children;
};

const ProtectedRoute: React.FC<{ roles: UserRole[]; children: React.ReactElement }> = ({ roles, children }) => {
  const { isLoading, role, token } = useAuth();
  if (isLoading) return <PageLoading />;
  if (!token || !role) return <Navigate to="/login" replace />;
  if (!roles.includes(role)) return <Navigate to={dashboardPathForRole(role)} replace />;
  return children;
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <GlobalBackButton />
        <Routes>
        {/* Auth pages (no navbar) */}
        <Route path="/" element={<PublicRoute><Home /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
        <Route path="/reset-password/:uid/:token" element={<PublicRoute><ResetPassword /></PublicRoute>} />

        {/* Dashboards */}
        <Route path="/lab-dashboard" element={<Navigate to="/lab/dashboard" replace />} />

        <Route path="/patient-dashboard" element={<Navigate to="/patient/dashboard" replace />} />

        <Route path="/doctor" element={<ProtectedRoute roles={['doctor']}><DoctorLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="patients" element={<MyPatientsPage />} />
          <Route path="appointments" element={<DoctorAppointments />} />
          <Route path="cases" element={<DoctorCases />} />
          <Route path="settings" element={<DoctorSettings />} />
          <Route path="dashboard" element={<DoctorDashboard />} />
        </Route>

        <Route path="/patient" element={<ProtectedRoute roles={['patient']}><PatientLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<PatientDashboard />} />
          <Route path="appointments" element={<PatientAppointments />} />
          <Route path="appointments/book" element={<BookAppointmentForm />} />
          <Route path="settings" element={<PatientSettings />} />
          <Route path="doctors" element={<MyDoctorsPage />} />
          <Route path="add-doctor" element={<AddDoctorModal />} />
          <Route path="reports" element={<PatientViewReports />} />
        </Route>

        <Route path="/lab" element={<ProtectedRoute roles={['lab', 'lab_staff']}><LabLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<LabDashboard embedded />} />
          <Route path="upload-reports" element={<LabUploadReports />} />
          <Route path="appointments" element={<LabAppointments />} />
          <Route path="pending-requests" element={<LabPendingRequests />} />
          <Route path="reports" element={<LabReportsList />} />
          <Route path="create-sample" element={<LabCreateSample />} />
          <Route path="settings" element={<LabSettings />} />
        </Route>
        <Route path="/admin/dashboard" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;
