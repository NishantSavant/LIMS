// src/components/MyDoctorsPage.tsx - EXACT "My Doctors" page [file:31]
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface MyDoctorsPageProps {
  profile?: any;
}

const MyDoctorsPage: React.FC<MyDoctorsPageProps> = ({ profile }) => {
  const navigate = useNavigate();
  const [myDoctors, setMyDoctors] = useState([]);


  // Add useEffect
  useEffect(() => {
  const token = localStorage.getItem('token');
  axios.get('/api/patient/my-doctors/', {
    headers: { Authorization: `Bearer ${token}` }
  }).then(res => setMyDoctors(res.data));
}, []);

  return (
    <div className="container-fluid px-5 py-5" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header + Add Doctor button */}
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h4 className="fw-bold mb-1 text-dark fs-3">My Doctors</h4>
          <p className="text-muted mb-0" style={{ fontSize: '0.95rem' }}>
            ({0}) doctors can access your medical reports
          </p>
        </div>
        <button 
          className="btn btn-success px-4 py-2 fw-semibold shadow-sm" 
          style={{ borderRadius: '12px', fontSize: '0.95rem' }}
          onClick={() => navigate('/patient/add-doctor')}
        >
          + Add Doctor
        </button>
      </div>

      {/* Search + Filter Bar - EXACT layout */}
      <div className="card border-0 shadow-sm mb-5" style={{ borderRadius: '20px', backgroundColor: 'white' }}>
        <div className="card-body p-4">
          <div className="row align-items-center g-3">
            {/* Search Input */}
            <div className="col-md-5">
              <div className="input-group input-group-lg" style={{ 
                borderRadius: '16px', 
                border: '2px solid #e2e8f0',
                backgroundColor: '#f8fafc',
                height: '56px'
              }}>
                <span className="input-group-text bg-transparent border-0 px-4" style={{ 
                  backgroundColor: 'transparent !important',
                  border: 'none',
                  color: '#94a3b8'
                }}>
                  <i className="fas fa-search fs-5"></i>
                </span>
                <input 
                  type="text" 
                  className="form-control border-0 bg-transparent fs-6 fw-medium" 
                  placeholder="Search doctors by name, ID or specialty"
                  style={{ backgroundColor: 'transparent', border: 'none', paddingLeft: '0' }}
                />
              </div>
            </div>

            {/* Filter Dropdown */}
            <div className="col-md-3">
              <select className="form-select form-select-lg border-0 rounded-3 px-4 py-2 fw-medium" 
                      style={{ backgroundColor: '#f8fafc', border: '2px solid #e2e8f0', height: '56px', color: '#475569' }}>
                <option>All Doctors</option>
                <option>General Physician</option>
                <option>Cardiologist</option>
                <option>Dentist</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Empty State - PERFECT MATCH [file:31] */}
      <div className="row g-4">
    {myDoctors.map((doctor: any) => (
      <div key={doctor.doctor_id} className="col-md-6">
        <div className="card shadow-sm border-0" style={{ borderRadius: '20px' }}>
          <div className="card-body p-4">
            <div className="d-flex align-items-center mb-3">
              <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#22c55e', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold' }}>
                Dr.
              </div>
              <div className="ms-3">
                <h6 className="mb-1">{doctor.doctor_name}</h6>
                <small className="text-muted">ID: {doctor.doctor_id}</small>
              </div>
            </div>
            <span className="badge bg-success fs-6">✅ Connected</span>
          </div>
        </div>
      </div>
    ))}
  </div>
    </div>
  );
};

export default MyDoctorsPage;
