// src/layouts/DoctorLayout.tsx
import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { FaSignOutAlt } from 'react-icons/fa';
import axios from 'axios';

const DoctorLayout: React.FC = () => {
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
    <div className="app-layout doctor-layout" style={{ minHeight: '100vh', ['--sidebar-width' as any]: '280px' }}>
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
        style={{ backgroundColor: '#f8fafc', borderRight: '1px solid #e2e8f0' }}
      >
        <div className="p-4 border-bottom">
          <div className="fw-bold fs-4 text-success mb-2">LIMS</div>
          <small className="text-muted">Doctor</small>
        </div>

        <nav className="flex-grow-1 p-2 mt-3">
          <button
            className="btn w-100 text-start mb-2"
            onClick={() => {
              navigate('/doctor/dashboard');
              setSidebarOpen(false);
            }}
          >
            Dashboard
          </button>
          <button
            className="btn w-100 text-start mb-2"
            onClick={() => {
              navigate('/doctor/patients');
              setSidebarOpen(false);
            }}
          >
            My Patients
          </button>
          <button
            className="btn w-100 text-start mb-2"
            onClick={() => {
              navigate('/doctor/appointments');
              setSidebarOpen(false);
            }}
          >
            Appointments
          </button>
          <button
            className="btn w-100 text-start mb-2"
            onClick={() => {
              navigate('/doctor/cases');
              setSidebarOpen(false);
            }}
          >
            Patient Cases
          </button>
          <button
            className="btn w-100 text-start mb-2"
            onClick={() => {
              navigate('/doctor/settings');
              setSidebarOpen(false);
            }}
          >
            Settings
          </button>
        </nav>

        <div className="p-3 border-top">
          <button
            className="btn w-100"
            onClick={() => {
              handleLogout();
              setSidebarOpen(false);
            }}
          >
            <FaSignOutAlt className="me-2" />
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

export default DoctorLayout;
