import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface LabReport {
  id: number;
  report_type?: string | null;
  report_file?: string | null;
  created_at?: string;
  is_flagged?: boolean;
  sample?: number;
  patient_name?: string;
  patient_unique_id?: string;
}

interface PatientProfileDetail {
  patient_unique_id?: string;
  full_name?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  blood_group?: string;
  abha_address?: string;
  address?: string;
  emergency_contact?: string;
  user?: { email?: string; username?: string };
}

const LabReportsList: React.FC = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<LabReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [selectedPatientProfile, setSelectedPatientProfile] = useState<PatientProfileDetail | null>(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const loadReports = async () => {
      setLoading(true);
      try {
        const res = await axios.get<LabReport[]>('/api/reports/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setReports(Array.isArray(res.data) ? res.data : []);
      } catch {
        setReports([]);
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, [navigate, token]);

  const handleOpenPatientProfile = async (patientUniqueId?: string) => {
    if (!token || !patientUniqueId) return;
    setShowProfileModal(true);
    setProfileLoading(true);
    setSelectedPatientProfile(null);
    try {
      const res = await axios.get(
        `/api/lab/patient/${encodeURIComponent(patientUniqueId)}/profile/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedPatientProfile(res.data || null);
    } catch {
      setSelectedPatientProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="mb-3">
        <h3 className="mb-1">All Reports</h3>
        <small className="text-muted">Every report uploaded by the lab appears here.</small>
      </div>

      {loading ? (
        <div className="text-muted">Loading reports...</div>
      ) : reports.length === 0 ? (
        <div className="text-muted">No reports uploaded yet.</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-sm align-middle">
            <thead>
              <tr>
                <th>Report ID</th>
                <th>Patient</th>
                <th>Patient ID</th>
                <th>Sample</th>
                <th>Type</th>
                <th>Uploaded</th>
                <th>File</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id}>
                  <td className="fw-semibold">#{report.id}</td>
                  <td>
                    <button
                      className="btn btn-link p-0 text-decoration-none d-inline-flex align-items-center gap-2"
                      onClick={() => handleOpenPatientProfile(report.patient_unique_id)}
                    >
                      <span
                        className="d-inline-flex align-items-center justify-content-center rounded-circle text-white"
                        style={{ width: 28, height: 28, backgroundColor: '#22c55e', fontSize: 12 }}
                      >
                        {(report.patient_name || 'P').trim().charAt(0).toUpperCase()}
                      </span>
                      {report.patient_name || 'Patient'}
                    </button>
                  </td>
                  <td>{report.patient_unique_id || 'N/A'}</td>
                  <td>{report.sample ?? 'N/A'}</td>
                  <td>{report.report_type || 'General'}</td>
                  <td>{report.created_at ? new Date(report.created_at).toLocaleString() : 'N/A'}</td>
                  <td>
                    {report.report_file ? (
                      <a
                        href={`${report.report_file}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View
                      </a>
                    ) : (
                      <span className="text-muted">No file</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showProfileModal && (
        <>
          <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title mb-0">Patient Profile</h5>
                  <button className="btn-close" onClick={() => setShowProfileModal(false)} />
                </div>
                <div className="modal-body">
                  {profileLoading ? (
                    <div className="text-center py-4">
                      <div className="spinner-border text-primary mb-2" />
                      <p className="text-muted mb-0">Loading profile...</p>
                    </div>
                  ) : !selectedPatientProfile ? (
                    <p className="text-muted mb-0">Profile not available.</p>
                  ) : (
                    <div className="row g-3">
                      <div className="col-md-6">
                        <div className="small text-muted">Full name</div>
                        <div className="fw-semibold">{selectedPatientProfile.full_name || '-'}</div>
                      </div>
                      <div className="col-md-6">
                        <div className="small text-muted">Patient ID</div>
                        <div className="fw-semibold">{selectedPatientProfile.patient_unique_id || '-'}</div>
                      </div>
                      <div className="col-md-6">
                        <div className="small text-muted">Email</div>
                        <div className="fw-semibold">{selectedPatientProfile.user?.email || '-'}</div>
                      </div>
                      <div className="col-md-6">
                        <div className="small text-muted">Phone</div>
                        <div className="fw-semibold">{selectedPatientProfile.phone || '-'}</div>
                      </div>
                      <div className="col-md-6">
                        <div className="small text-muted">Date of birth</div>
                        <div className="fw-semibold">{selectedPatientProfile.date_of_birth || '-'}</div>
                      </div>
                      <div className="col-md-6">
                        <div className="small text-muted">Gender</div>
                        <div className="fw-semibold">{selectedPatientProfile.gender || '-'}</div>
                      </div>
                      <div className="col-md-6">
                        <div className="small text-muted">Blood group</div>
                        <div className="fw-semibold">{selectedPatientProfile.blood_group || '-'}</div>
                      </div>
                      <div className="col-md-6">
                        <div className="small text-muted">Emergency contact</div>
                        <div className="fw-semibold">{selectedPatientProfile.emergency_contact || '-'}</div>
                      </div>
                      <div className="col-12">
                        <div className="small text-muted">Address</div>
                        <div className="fw-semibold">{selectedPatientProfile.address || '-'}</div>
                      </div>
                      <div className="col-12">
                        <div className="small text-muted">ABHA address</div>
                        <div className="fw-semibold">{selectedPatientProfile.abha_address || '-'}</div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setShowProfileModal(false)}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" onClick={() => setShowProfileModal(false)} />
        </>
      )}
    </div>
  );
};

export default LabReportsList;
