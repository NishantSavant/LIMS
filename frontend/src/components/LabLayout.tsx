import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { FaTachometerAlt, FaUpload, FaFileAlt, FaCalendarCheck, FaSignOutAlt, FaVial, FaCog } from 'react-icons/fa';
import axios from 'axios';

const LabLayout: React.FC = () => {
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
    <div className="app-layout lab-layout" style={{ minHeight: '100vh', backgroundColor: '#f9fafb', ['--sidebar-width' as any]: '230px' }}>
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

      <aside className={`app-sidebar ${sidebarOpen ? 'open' : ''}`} style={{ backgroundColor: '#fafbfb', borderRight: '1px solid #e5e7eb' }}>
        <div className="p-3 border-bottom">
          <div className="fw-bold">LIMS</div>
          <small className="text-muted">Laboratory</small>
        </div>

        <nav className="flex-grow-1 px-2 py-3">
          <SidebarLink icon={<FaTachometerAlt />} label="Overview" to="/lab/dashboard" onClick={() => setSidebarOpen(false)} />
          <SidebarLink icon={<FaUpload />} label="Upload Report" to="/lab/upload-reports" onClick={() => setSidebarOpen(false)} />
          <SidebarLink icon={<FaFileAlt />} label="All Reports" to="/lab/reports" onClick={() => setSidebarOpen(false)} />
          <SidebarLink icon={<FaCalendarCheck />} label="Appointments" to="/lab/appointments" onClick={() => setSidebarOpen(false)} />
          <SidebarLink icon={<FaVial />} label="Create Sample" to="/lab/create-sample" onClick={() => setSidebarOpen(false)} />
          <SidebarLink icon={<FaCog />} label="Settings" to="/lab/settings" onClick={() => setSidebarOpen(false)} />
        </nav>

        <div className="p-3 border-top">
          <button
            className="btn btn-sm w-100"
            onClick={() => {
              handleLogout();
              setSidebarOpen(false);
            }}
          >
            <FaSignOutAlt className="me-2" size={12} />
            Logout
          </button>
        </div>
      </aside>

      <main className="app-content" style={{ paddingTop: needsTopOffset ? 44 : 0 }}>
        <Outlet />
      </main>
    </div>
  );
};

const SidebarLink: React.FC<{ icon: React.ReactNode; label: string; to: string; onClick?: () => void }> = ({
  icon,
  label,
  to,
  onClick,
}) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      `d-flex align-items-center mb-1 px-3 py-2 rounded-3 text-decoration-none ${
        isActive ? 'bg-white text-dark border' : 'text-muted'
      }`
    }
    style={{ fontSize: 13 }}
  >
    <span className="me-2" style={{ width: 18 }}>
      {icon}
    </span>
    <span>{label}</span>
  </NavLink>
);

export default LabLayout;
