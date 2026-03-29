import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { FaSignOutAlt } from 'react-icons/fa';
import axios from 'axios';

const PatientLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const needsTopOffset = !location.pathname.endsWith('/dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    navigate('/login');
  };

  return (
    <div
      className="app-layout patient-layout"
      style={{ minHeight: '100vh', backgroundColor: '#f5f7ff', ['--sidebar-width' as any]: '240px' }}
    >
      <button
        className="sidebar-toggle"
        type="button"
        aria-label="Toggle sidebar"
        aria-expanded={sidebarOpen}
        onClick={() => setSidebarOpen((prev) => !prev)}
      >
        <span />
        <span />
        <span />
      </button>

      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <div
        className={`app-sidebar d-flex flex-column ${sidebarOpen ? 'open' : ''}`}
        style={{ backgroundColor: '#ffffff', borderRight: '1px solid #e5e7eb' }}
      >
        <div className="p-3 border-bottom">
          <div className="fw-bold">LIMS</div>
          <small className="text-muted">Patient</small>
        </div>

        <nav className="flex-grow-1 p-2">
          <button
            className="btn btn-light w-100 text-start mb-2"
            onClick={() => {
              navigate('/patient/dashboard');
              setSidebarOpen(false);
            }}
          >
            Dashboard
          </button>
          <button
            className="btn btn-light w-100 text-start mb-2"
            onClick={() => {
              navigate('/patient/doctors');
              setSidebarOpen(false);
            }}
          >
            My Doctors
          </button>
          <button
            className="btn btn-light w-100 text-start mb-2"
            onClick={() => {
              navigate('/patient/appointments');
              setSidebarOpen(false);
            }}
          >
            Appointments
          </button>
          <button
            className="btn btn-light w-100 text-start mb-2"
            onClick={() => {
              navigate('/patient/reports');
              setSidebarOpen(false);
            }}
          >
            Reports
          </button>
          <button
            className="btn btn-light w-100 text-start mb-2"
            onClick={() => {
              navigate('/patient/settings');
              setSidebarOpen(false);
            }}
          >
            Settings
          </button>
        </nav>

        <div className="p-3 border-top" style={{ borderColor: 'rgba(148,163,184,0.3)' }}>
          <button
            className="btn btn-sm w-100 d-flex align-items-center justify-content-center text-black"
            style={{
              backgroundColor: 'transparent',
              border: '1px solid rgba(148,163,184,0.6)',
              borderRadius: 999,
              fontSize: 13,
            }}
            onClick={() => {
              handleLogout();
              setSidebarOpen(false);
            }}
          >
            <FaSignOutAlt className="me-2" size={12} />
            Logout
          </button>
        </div>
      </div>

      <div className="app-content" style={{ paddingTop: needsTopOffset ? 44 : 0 }}>
        <Outlet />
      </div>
    </div>
  );
};

export default PatientLayout;
