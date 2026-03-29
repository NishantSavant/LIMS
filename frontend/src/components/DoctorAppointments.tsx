// src/components/DoctorAppointments.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaCalendarCheck, FaUser, FaClock, FaCheck, FaTimes, FaCalendarDay } from 'react-icons/fa';

interface Appointment {
  id: number;
  patient_name: string;
  patient_unique_id: string;
  patient_phone?: string;
  patient_address?: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  requested_at: string;
  approved_at?: string;
  rejected_at?: string;
  created_at: string;
  date: string;
  time_slot: string;
}

interface PatientDetails {
  id?: number;
  full_name: string;
  patient_unique_id: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  blood_group?: string;
  abha_id?: string;
  abha_address?: string;
  address?: string;
  created_at?: string;
  updated_at?: string;
}


const DoctorAppointments: React.FC = () => {
  const navigate = useNavigate();
  const [pendingRequests, setPendingRequests] = useState<Appointment[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [pastAppointments, setPastAppointments] = useState<Appointment[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'upcoming' | 'past'>('pending');
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<PatientDetails | null>(null);
  const [showPatientModal, setShowPatientModal] = useState(false);


  const fetchAppointments = useCallback(async () => {
    if (!token) return;
    try {
      const [pendingRes, upcomingRes, pastRes] = await Promise.all([
        axios.get('/api/doctor/pending-requests/', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get('/api/doctor/appointments/upcoming/', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get('/api/doctor/appointments/past/', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setUpcomingAppointments(upcomingRes.data);
      console.table('🔍 UPCOMING APPTS:', upcomingRes.data);
      console.table('PENDING REQS:', pendingRes.data); 
      setPendingRequests(pendingRes.data);
      setPastAppointments(pastRes.data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  }, [token]);

  const approveAppointment = useCallback(async (appointmentId: number) => {
    if (!token) return;
    setLoading(true);
    try {
      await axios.post(`/api/doctor/appointments/${appointmentId}/approve/`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAppointments();
      alert('✅ Appointment approved!');
    } catch (error) {
      alert('❌ Error approving appointment');
    } finally {
      setLoading(false);
    }
  }, [token, fetchAppointments]);

  const rejectAppointment = useCallback(async (appointmentId: number) => {
    if (!token) return;
    setLoading(true);
    try {
      await axios.post(`/api/doctor/appointment/${appointmentId}/reject/`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAppointments();
      alert('❌ Appointment rejected');
    } catch (error) {
      alert('❌ Error rejecting appointment');
    } finally {
      setLoading(false);
    }
  }, [token, fetchAppointments]);



  useEffect(() => {
    const authToken = localStorage.getItem('token');
    if (!authToken) {
      navigate('/login');
      return;
    }
    setToken(authToken);
  }, [navigate]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const getAppointmentsForTab = () => {
    switch (activeTab) {
      case 'pending': return pendingRequests;
      case 'upcoming': return upcomingAppointments;
      case 'past': return pastAppointments;
      default: return [];
    }
  };

  const appointments = getAppointmentsForTab();

  const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleString();
  } catch {
    return 'Invalid date';
  }
};

  const formatAppointmentDate = (dateString?: string): string => {
    if (!dateString) return 'Date not available';
    const parsed = new Date(dateString);
    if (Number.isNaN(parsed.getTime())) return 'Date not available';
    return parsed.toLocaleDateString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <>
      <div className="container-fluid py-5 px-4">
        <div className="row justify-content-center">
          <div className="col-lg-11">
            <h2 className="fw-bold text-success mb-5 text-center">Appointment Management</h2>

            {/* TABS */}
            <div className="card border-0 shadow-sm mb-5" style={{ borderRadius: '24px' }}>
              <div className="card-header border-0 p-0">
                <ul className="nav nav-tabs nav-tabs-custom nav-justified p-3" style={{ borderRadius: '20px' }}>
                  <li className="nav-item">
                    <button 
                      className={`nav-link fw-bold fs-6 ${activeTab === 'pending' ? 'active bg-warning text-dark' : 'text-muted'}`}
                      onClick={() => setActiveTab('pending')}
                    >
                      <FaClock className="me-2" />
                      Pending ({pendingRequests.length})
                    </button>
                  </li>
                  <li className="nav-item">
                    <button 
                      className={`nav-link fw-bold fs-6 ${activeTab === 'upcoming' ? 'active bg-success text-white' : 'text-muted'}`}
                      onClick={() => setActiveTab('upcoming')}
                    >
                      <FaCalendarCheck className="me-2" />
                      Upcoming ({upcomingAppointments.length})
                    </button>
                  </li>
                  <li className="nav-item">
                    <button 
                      className={`nav-link fw-bold fs-6 ${activeTab === 'past' ? 'active bg-secondary text-white' : 'text-muted'}`}
                      onClick={() => setActiveTab('past')}
                    >
                      <FaCalendarDay className="me-2" />
                      Past ({pastAppointments.length})
                    </button>
                  </li>
                </ul>
              </div>
            </div>

            {/* CONTENT */}
            <div className="card border-0 shadow-lg" style={{ borderRadius: '24px' }}>
              <div className={`card-header border-0 p-4 ${activeTab === 'pending' ? 'bg-warning bg-opacity-10' : activeTab === 'upcoming' ? 'bg-success bg-opacity-10' : 'bg-secondary bg-opacity-10'}`}>
                <h5 className={`mb-0 fw-bold ${activeTab === 'pending' ? 'text-warning' : activeTab === 'upcoming' ? 'text-success' : 'text-secondary'}`}>
                  {activeTab === 'pending' && <FaClock className="me-2" />}
                  {activeTab === 'upcoming' && <FaCalendarCheck className="me-2" />}
                  {activeTab === 'past' && <FaCalendarDay className="me-2" />}
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Appointments ({appointments.length})
                </h5>
              </div>
              <div className="card-body p-4">
                {loading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-success mb-3" style={{width: '3rem', height: '3rem'}} />
                    <p className="text-muted">Loading appointments...</p>
                  </div>
                ) : appointments.length > 0 ? (
                  <div className="row g-4">
                    {appointments.map((appt) => (
                      <div key={appt.id} className="col-lg-4 col-md-6">
                        <div className={`card border-0 h-100 shadow-sm p-4 ${activeTab === 'upcoming' ? 'bg-gradient-light' : ''}`} style={{ borderRadius: '20px' }}>
                          <div className="card-body p-0 flex-grow-1">
                            {/* 👈 APPOINTMENT DATE - TOP PRIORITY */}
                            <div className="bg-primary text-white p-3 rounded-top mb-0" style={{ 
                              borderRadius: '20px 20px 0 0 !important',
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important',
                              color: 'white !important',
                              position: 'relative',
                              zIndex: 10
                            }}>
                              <div className="d-flex align-items-center justify-content-between">
                                <div className="text-white">
                                  <FaCalendarDay className="me-1" style={{ color: 'white' }} />
                                  <strong style={{ color: 'white', fontSize: '1.1rem' }}>
                                    {formatAppointmentDate(appt.date)}
                                  </strong>
                                </div>
                                <span className="badge bg-light text-dark px-3 py-2 fs-6 fw-semibold border shadow-sm">
                                  {appt.time_slot || 'TBD'}
                                </span>
                              </div>
                            </div>


                            {/* Patient Info */}
                            <div className="p-3">
                              <div className="d-flex align-items-start mb-3">
                                <div className={`rounded-circle d-flex align-items-center justify-content-center me-3 ${activeTab === 'upcoming' ? 'bg-success' : 'bg-primary'} text-white`} 
                                    style={{ width: '45px', height: '45px', fontSize: '14px' }}>
                                  {(appt.patient_name || 'P').split(' ').map(n => n[0]).join('')}
                                </div>
                                <div className="flex-grow-1">
                                  <h6 className="fw-bold mb-1 text-truncate">{appt.patient_name}</h6>
                                  <small className="text-muted d-block">ID: {appt.patient_unique_id}</small>
                                </div>
                              </div>

                            {/* Status & Timestamps */}
                            <div className="mb-3 small">
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <span className="text-muted">Status</span>
                                <span className={`badge fs-6 px-2 py-1 fw-semibold ${
                                  appt.status === 'approved' ? 'bg-success' : 
                                  appt.status === 'pending' ? 'bg-warning text-dark' : 
                                  'bg-secondary'
                                }`}>
                                  {appt.status.toUpperCase()}
                                </span>
                              </div>
                              
                              <div className="d-flex justify-content-between text-muted">
                                <span>Appointment Date</span>
                                <small className="fw-semibold">{formatAppointmentDate(appt.date)}</small>
                              </div>

                              <div className="d-flex justify-content-between text-muted mt-2">
                                <span>Requested</span>
                                <small>{formatDate(appt.created_at)}</small>
                              </div>
                              
                              {appt.approved_at && (
                                <div className="d-flex justify-content-between align-items-center mt-2 pt-2 border-top">
                                  <span className="text-muted">Approved</span>
                                  <small className={`fw-semibold ${
                                    appt.approved_at ? 'text-success' : 'text-muted'
                                  }`}>
                                    {formatDate(appt.approved_at)}  {/* 👈 Shows exact time */}
                                  </small>
                                </div>
                              )}
                            </div>

                            {/* Buttons */}
                            {activeTab === 'pending' ? (
                              <div className="d-grid gap-2">
                                <button 
                                  className="btn btn-success fw-bold py-2 shadow-sm"
                                  onClick={() => approveAppointment(appt.id)}
                                  disabled={loading}
                                >
                                  <FaCheck className="me-2" />
                                  Approve
                                </button>
                                <button 
                                  className="btn btn-outline-danger fw-bold py-2"
                                  onClick={() => rejectAppointment(appt.id)}
                                  disabled={loading}
                                >
                                  <FaTimes className="me-2" />
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <button 
                                className="btn btn-outline-primary w-100 fw-semibold py-2 shadow-sm"
                                onClick={async () => {
                                  if (!appt.patient_unique_id) {
                                    alert('❌ Missing Patient ID');
                                    console.error('Patient ID missing:', appt);
                                    return;
                                  }

                                        console.log('🔍 Fetching patient:', appt.patient_unique_id); // DEBUG
                                        try {
                                          const token = localStorage.getItem('token');
                                          if (!token) throw new Error('No token');

                                          const response = await axios.get(
                                            `/api/doctor/patient/${appt.patient_unique_id}/`,
                                            { headers: { Authorization: `Bearer ${token}` } }
                                          );

                                          // 👈 VALIDATE RESPONSE HAS patient_unique_id
                                          if (!response.data.patient_unique_id) {
                                            throw new Error('Invalid patient data - missing ID');
                                          }

                                          setSelectedPatient(response.data);
                                          setShowPatientModal(true);
                                        } catch (error: any) {
                                          console.error('Patient fetch failed:', error.response?.data || error.message);
                                          alert(`Failed to load patient ${appt.patient_unique_id}: ${error.response?.data?.error || 'Unknown error'}`);
                                        }
                                }}
                              >
                                👁️ View Patient Details ({appt.patient_unique_id})
                              </button>
                            )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-5 text-muted">
                    <FaCalendarCheck size={64} className="mb-4 opacity-50" />
                    <h5 className="fw-semibold mb-2">No {activeTab} appointments</h5>
                    <p className="mb-0">
                      {activeTab === 'pending' && 'Requests will appear here when patients book with you'}
                      {activeTab === 'upcoming' && 'Approved appointments will appear here'}
                      {activeTab === 'past' && 'Completed appointments will appear here'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PATIENT DETAILS MODAL */}
      {showPatientModal && selectedPatient && (
  <>
    <div 
      className="modal fade show d-block" 
      tabIndex={-1}
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
    >
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title mb-0">
              <FaUser className="me-2" /> Patient Details
            </h5>
            <button 
              className="btn-close btn-close-white" 
              onClick={() => setShowPatientModal(false)} 
            />
          </div>
          
          <div className="modal-body p-4">
            {/* Basic Info */}
            <div className="row mb-4">
              <div className="col-md-8">
                <h6 className="fw-bold text-primary mb-2">Basic Information</h6>
                <div className="row g-3">
                  <div className="col-md-6">
                    <strong>Name:</strong><br/>
                    <span className="text-muted">{selectedPatient.full_name || 'N/A'}</span>
                  </div>
                  <div className="col-md-6">
                    <strong>Patient ID:</strong><br/>
                    <span className="badge bg-success fs-5 fw-bold px-3 py-2 mb-2 d-block">
                      {selectedPatient.patient_unique_id}
                    </span>
                    <small className="text-muted">Copy ID for records</small>
                  </div>

                  <div className="col-md-6">
                    <strong>Phone:</strong><br/>
                    <span>{selectedPatient.phone || 'N/A'}</span>
                  </div>
                  <div className="col-md-6">
                    <strong>DOB:</strong><br/>
                    <span>{selectedPatient.date_of_birth || 'N/A'}</span>
                  </div>
                  <div className="col-md-6">
                    <strong>Gender:</strong><br/>
                    <span>{selectedPatient.gender || 'N/A'}</span>
                  </div>
                  <div className="col-md-6">
                    <strong>Blood Group:</strong><br/>
                    <span>{selectedPatient.blood_group || 'N/A'}</span>
                  </div>
                </div>
              </div>
              <div className="col-md-4 text-center">
                <div className="avatar-circle bg-primary text-white d-flex align-items-center justify-content-center mx-auto mb-3"
                     style={{width: '80px', height: '80px', borderRadius: '50%', fontSize: '24px', fontWeight: 'bold'}}>
                  {selectedPatient.full_name?.split(' ').map(n => n[0]).slice(0,2).join('') || 'P'}
                </div>
              </div>
            </div>

            {/* ABHA & Address */}
            <div className="row mb-4">
              <div className="col-md-6">
                <h6 className="fw-bold text-primary mb-2">ABHA Information</h6>
                <div className="mb-2">
                  <strong>ABHA ID:</strong> {selectedPatient.abha_id || 'N/A'}
                </div>
                <div>
                  <strong>ABHA Address:</strong> {selectedPatient.abha_address || 'N/A'}
                </div>
              </div>
              <div className="col-md-6">
                <h6 className="fw-bold text-primary mb-2">Address</h6>
                <p className="text-muted mb-1">{selectedPatient.address || 'Not provided'}</p>
              </div>
            </div>

            {/* Recent Appointments */}
            <div className="row">
              <div className="col-12">
                <h6 className="fw-bold text-primary mb-2">Recent Activity</h6>
                <div className="small">
                  <strong>Requested:</strong> {formatDate(selectedPatient?.created_at)}<br/>
                  <strong>Last Updated:</strong>{formatDate(selectedPatient?.updated_at)}
                </div>
              </div>
            </div>
          </div>
          
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setShowPatientModal(false)}>
              Close
            </button>
            <button className="btn btn-primary">
              View Full Medical History →
            </button>
          </div>
        </div>
      </div>
    </div>
    {/* Backdrop click to close */}
    <div className="modal-backdrop fade show" onClick={() => setShowPatientModal(false)} />
  </>
)}

    </>
  );
};

export default DoctorAppointments;
