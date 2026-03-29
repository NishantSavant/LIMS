// src/components/MyPatientsPage.tsx - SHOWS CONNECTED PATIENTS
import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface MyPatientsPageProps {
  stats?: { patients: number; requests: number; appointments: number; prescriptions: number };
  profile?: any;
}

interface ConnectedPatient {
  id: number;
  patient_name: string;
  patient_id: string;
}

interface PendingLinkRequest {
  id: number;
  patient_name: string;
  patient_id: string;
  patient_phone?: string;
  requested_at?: string;
}

interface PatientReport {
  id: number;
  created_at?: string;
  report_type?: string;
  report_file?: string;
  is_flagged?: boolean;
}

const MyPatientsPage: React.FC<MyPatientsPageProps> = ({ stats = { patients: 0, requests: 0, appointments: 0, prescriptions: 0 }, profile }) => {
  
  const [myPatients, setMyPatients] = useState<ConnectedPatient[]>([]);
  const [pendingLinkRequests, setPendingLinkRequests] = useState<PendingLinkRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [linkActionLoadingId, setLinkActionLoadingId] = useState<number | null>(null);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [selectedPatientName, setSelectedPatientName] = useState('');
  const [patientReports, setPatientReports] = useState<PatientReport[]>([]);
  const [showReportsModal, setShowReportsModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      Promise.all([
        axios.get('/api/doctor/my-patients/', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('/api/doctor/link-requests/', {
          headers: { Authorization: `Bearer ${token}` }
        }),
      ])
      .then(([patientsRes, requestsRes]) => {
        setMyPatients(Array.isArray(patientsRes.data) ? patientsRes.data : []);
        setPendingLinkRequests(Array.isArray(requestsRes.data) ? requestsRes.data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    }
  }, []);

  const handleLinkRequestAction = async (linkId: number, action: 'accept' | 'reject') => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setLinkActionLoadingId(linkId);
    try {
      await axios.put(
        `/api/doctor/patient-request/${linkId}/${action}/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const [patientsRes, requestsRes] = await Promise.all([
        axios.get('/api/doctor/my-patients/', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('/api/doctor/link-requests/', {
          headers: { Authorization: `Bearer ${token}` }
        }),
      ]);
      setMyPatients(Array.isArray(patientsRes.data) ? patientsRes.data : []);
      setPendingLinkRequests(Array.isArray(requestsRes.data) ? requestsRes.data : []);
    } catch (error) {
      console.error(`Failed to ${action} link request`, error);
      alert(`Failed to ${action} request`);
    } finally {
      setLinkActionLoadingId(null);
    }
  };

  const handleViewReports = async (patientUniqueId: string, patientName: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setSelectedPatientName(patientName);
    setShowReportsModal(true);
    setReportsLoading(true);
    setPatientReports([]);

    try {
      const res = await axios.get(
        `/api/doctor/lab-reports/?patient_id=${encodeURIComponent(patientUniqueId)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPatientReports(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Failed to fetch patient reports:', error);
      setPatientReports([]);
    } finally {
      setReportsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container-fluid px-5 py-5" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
        <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
          <div className="spinner-border text-success" style={{ width: '3rem', height: '3rem' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid px-5 py-5" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h4 className="fw-bold mb-1 text-dark fs-3">My Patients</h4>
          <p className="text-muted mb-0" style={{ fontSize: '0.95rem' }}>
            ({stats.patients || myPatients.length}) patients assigned to you
          </p>
        </div>
        <button 
          className="btn btn-success px-4 py-2 fw-semibold shadow-sm" 
          style={{ borderRadius: '12px', fontSize: '0.95rem' }}
        >
          + Add Patient
        </button>
      </div>

      {/* Search + Filter Bar */}
      <div className="card border-0 shadow-sm mb-5" style={{ borderRadius: '20px', backgroundColor: 'white' }}>
        <div className="card-body p-4">
          <div className="row align-items-center g-3">
            <div className="col-md-5">
              <div className="input-group input-group-lg" style={{ 
                borderRadius: '16px', border: '2px solid #e2e8f0', backgroundColor: '#f8fafc', height: '56px'
              }}>
                <span className="input-group-text bg-transparent border-0 px-4" style={{ 
                  backgroundColor: 'transparent !important', border: 'none', color: '#94a3b8'
                }}>
                  <i className="fas fa-search fs-5"></i>
                </span>
                <input 
                  type="text" 
                  className="form-control border-0 bg-transparent fs-6 fw-medium" 
                  placeholder="Search patients by name, ID or email"
                />
              </div>
            </div>
            <div className="col-md-3">
              <select className="form-select form-select-lg border-0 rounded-3 px-4 py-2 fw-medium" 
                      style={{ backgroundColor: '#f8fafc', border: '2px solid #e2e8f0', height: '56px', color: '#475569' }}>
                <option>All Patients</option>
                <option>Active</option>
                <option>Inactive</option>
                <option>Pending</option>
              </select>
            </div>
            <div className="col-md-4 text-end">
              <div className="d-inline-flex align-items-center gap-2">
                <div style={{
                  width: '44px', height: '44px', borderRadius: '50%',
                  backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', border: '2px solid #f1f5f9'
                }}>
                  <i className="fas fa-user text-muted" style={{ fontSize: '14px' }}></i>
                </div>
                <span className="fw-semibold text-muted" style={{ fontSize: '0.9rem' }}>
                  View assigned patients
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ SHOW CONNECTED PATIENTS or EMPTY STATE */}
      {pendingLinkRequests.length > 0 && (
        <div className="card border-0 shadow-lg mb-4" style={{ borderRadius: '20px' }}>
          <div className="card-body p-4">
            <h5 className="fw-semibold mb-3">Pending Patient Link Requests ({pendingLinkRequests.length})</h5>
            <div className="row g-3">
              {pendingLinkRequests.map((request) => (
                <div key={request.id} className="col-md-6 col-lg-4">
                  <div className="border rounded-3 p-3 bg-light h-100">
                    <div className="fw-semibold">{request.patient_name}</div>
                    <div className="small text-muted mb-2">ID: {request.patient_id}</div>
                    {request.patient_phone && (
                      <div className="small text-muted mb-2">Phone: {request.patient_phone}</div>
                    )}
                    {request.requested_at && (
                      <div className="small text-muted mb-3">Requested: {new Date(request.requested_at).toLocaleString()}</div>
                    )}
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-sm btn-success"
                        disabled={linkActionLoadingId === request.id}
                        onClick={() => handleLinkRequestAction(request.id, 'accept')}
                      >
                        Accept
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        disabled={linkActionLoadingId === request.id}
                        onClick={() => handleLinkRequestAction(request.id, 'reject')}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {myPatients.length === 0 ? (
        // Your existing empty state
        <div className="card border-0 shadow-lg" style={{ borderRadius: '24px', backgroundColor: 'white', minHeight: '400px' }}>
          <div className="card-body p-5 text-center">
            <div className="mb-4">
              <div style={{
                width: '120px', height: '120px', borderRadius: '50%',
                backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center',
                justifyContent: 'center', margin: '0 auto 24px', border: '3px dashed #e2e8f0'
              }}>
                <i className="fas fa-users fs-1 text-muted" style={{ opacity: 0.5 }}></i>
              </div>
            </div>
            <h5 className="fw-semibold mb-3 text-muted" style={{ fontSize: '1.4rem' }}>No patients yet</h5>
            <p className="text-muted mb-0" style={{ fontSize: '1rem', maxWidth: '400px', margin: '0 auto', lineHeight: '1.6' }}>
              Patients assigned by your lab will appear here. You can also add patients manually.
            </p>
          </div>
        </div>
      ) : (
        // ✅ CONNECTED PATIENTS LIST
        <div className="row g-4">
          {myPatients.map((patient) => (
            <div key={patient.id} className="col-md-6 col-lg-4">
              <div className="card h-100 border-0 shadow-lg hover-shadow" style={{ borderRadius: '20px' }}>
                <div className="card-body p-4">
                  <div className="d-flex align-items-center mb-3">
                    <div style={{
                      width: '56px', height: '56px', borderRadius: '50%',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: '20px', fontWeight: '600'
                    }}>
                      {patient.patient_name.split(' ').map(n => n[0]).join('').slice(0,2)}
                    </div>
                    <div className="ms-3 flex-grow-1">
                      <h6 className="mb-1 fw-semibold">{patient.patient_name}</h6>
                      <small className="text-muted d-block">ID: {patient.patient_id}</small>
                    </div>
                    <span className="badge bg-success fs-6">✅ Connected</span>
                  </div>
                  <div className="d-flex gap-2 mt-3">
                    <button
                      className="btn btn-outline-primary btn-sm px-3"
                      style={{ borderRadius: '20px' }}
                      onClick={() => handleViewReports(patient.patient_id, patient.patient_name)}
                    >
                      View Reports
                    </button>
                    <button className="btn btn-outline-secondary btn-sm px-3" style={{ borderRadius: '20px' }}>
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showReportsModal && (
        <>
          <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title mb-0">Reports: {selectedPatientName}</h5>
                  <button className="btn-close" onClick={() => setShowReportsModal(false)} />
                </div>
                <div className="modal-body">
                  {reportsLoading ? (
                    <div className="text-center py-4">
                      <div className="spinner-border text-primary mb-2" />
                      <p className="text-muted mb-0">Loading reports...</p>
                    </div>
                  ) : patientReports.length === 0 ? (
                    <p className="text-muted mb-0">No reports found for this patient.</p>
                  ) : (
                    <div className="list-group">
                      {patientReports.map((report) => (
                        <div key={report.id} className="list-group-item d-flex justify-content-between align-items-center">
                          <div>
                            <div className="fw-semibold">Report #{report.id}</div>
                            <small className="text-muted">
                              {report.report_type || 'General'} • {report.created_at ? new Date(report.created_at).toLocaleString() : 'Unknown date'}
                            </small>
                          </div>
                          <div className="d-flex align-items-center gap-2">
                            {report.is_flagged && <span className="badge bg-danger">Flagged</span>}
                            {report.report_file && (
                              <a
                                href={`${report.report_file}`}
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-sm btn-outline-primary"
                              >
                                View File
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setShowReportsModal(false)}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" onClick={() => setShowReportsModal(false)} />
        </>
      )}
    </div>
  );
};

export default MyPatientsPage;
