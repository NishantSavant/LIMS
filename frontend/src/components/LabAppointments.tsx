import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface LabAppointmentRequest {
  id: number;
  test_name: string;
  date?: string;
  time_slot?: string;
  status: 'pending' | 'sample_collected' | 'in_testing' | 'results_ready' | 'reported' | 'rejected';
  created_at: string;
  patient_name: string;
  patient_unique_id: string;
  doctor_name: string;
}

const statusBadgeClass = (status: LabAppointmentRequest['status']) => {
  switch (status) {
    case 'pending':
      return 'bg-warning text-dark';
    case 'sample_collected':
      return 'bg-info text-dark';
    case 'in_testing':
      return 'bg-primary';
    case 'results_ready':
      return 'bg-success';
    case 'reported':
      return 'bg-secondary';
    case 'rejected':
      return 'bg-danger';
    default:
      return 'bg-light text-dark';
  }
};

const statusLabel = (status: LabAppointmentRequest['status']) => {
  switch (status) {
    case 'sample_collected':
      return 'Accepted';
    case 'in_testing':
      return 'In Testing';
    case 'results_ready':
      return 'Results Ready';
    case 'reported':
      return 'Reported';
    case 'rejected':
      return 'Rejected';
    default:
      return 'Pending';
  }
};

const LabAppointments: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [requests, setRequests] = useState<LabAppointmentRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'accepted' | 'all'>('pending');

  const fetchRequests = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.get<LabAppointmentRequest[]>(
        '/api/lab/appointments/requests/',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRequests(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Failed to load lab appointment requests:', error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 15000);
    return () => clearInterval(interval);
  }, [fetchRequests]);

  const visibleRequests = useMemo(() => {
    if (activeTab === 'pending') return requests.filter((r) => r.status === 'pending');
    if (activeTab === 'accepted') return requests.filter((r) => r.status !== 'pending');
    return requests;
  }, [activeTab, requests]);

  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const acceptedCount = requests.filter((r) => r.status !== 'pending').length;

  const handleApprove = async (id: number) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setBusyId(id);
    try {
      await axios.post(
        `/api/lab/appointments/${id}/approve/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchRequests();
    } catch (error: any) {
      alert(error?.response?.data?.error || 'Failed to accept request');
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (id: number) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setBusyId(id);
    try {
      await axios.post(
        `/api/lab/appointments/${id}/reject/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchRequests();
    } catch (error: any) {
      alert(error?.response?.data?.error || 'Failed to reject request');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="container-fluid py-4 px-4" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Lab Appointments</h3>
          <p className="text-muted mb-0">Review and process patient lab test requests</p>
        </div>
        <button className="btn btn-outline-secondary" onClick={() => navigate('/lab-dashboard')}>
          Back to Dashboard
        </button>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 16 }}>
            <div className="card-body">
              <small className="text-muted d-block">Pending Queue</small>
              <h3 className="mb-0 fw-bold">{pendingCount}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 16 }}>
            <div className="card-body">
              <small className="text-muted d-block">Accepted/Processed</small>
              <h3 className="mb-0 fw-bold">{acceptedCount}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 16 }}>
            <div className="card-body">
              <small className="text-muted d-block">Total Requests</small>
              <h3 className="mb-0 fw-bold">{requests.length}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: 16 }}>
        <div className="card-body py-2">
          <div className="btn-group" role="group">
            <button
              type="button"
              className={`btn ${activeTab === 'pending' ? 'btn-dark' : 'btn-light'}`}
              onClick={() => setActiveTab('pending')}
            >
              Pending ({pendingCount})
            </button>
            <button
              type="button"
              className={`btn ${activeTab === 'accepted' ? 'btn-dark' : 'btn-light'}`}
              onClick={() => setActiveTab('accepted')}
            >
              Accepted ({acceptedCount})
            </button>
            <button
              type="button"
              className={`btn ${activeTab === 'all' ? 'btn-dark' : 'btn-light'}`}
              onClick={() => setActiveTab('all')}
            >
              All ({requests.length})
            </button>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
        <div className="card-body">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary mb-2" />
              <p className="text-muted mb-0">Loading requests...</p>
            </div>
          ) : visibleRequests.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <h5 className="mb-2">No requests in this view</h5>
              <p className="mb-0">New lab appointments will appear here.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Doctor</th>
                    <th>Test</th>
                    <th>Appointment Date</th>
                    <th>Time Slot</th>
                    <th>Requested At</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRequests.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="fw-semibold">{item.patient_name || 'Unknown'}</div>
                        <small className="text-muted">{item.patient_unique_id || 'No ID'}</small>
                      </td>
                      <td>{item.doctor_name || 'Unknown'}</td>
                      <td>{item.test_name}</td>
                      <td>{item.date || '-'}</td>
                      <td>{item.time_slot || '-'}</td>
                      <td>{new Date(item.created_at).toLocaleString()}</td>
                      <td>
                        <span className={`badge ${statusBadgeClass(item.status)}`}>
                          {statusLabel(item.status)}
                        </span>
                      </td>
                      <td className="text-end">
                        {item.status === 'pending' ? (
                          <div className="d-inline-flex gap-2">
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => handleApprove(item.id)}
                              disabled={busyId === item.id}
                            >
                              {busyId === item.id ? 'Please wait...' : 'Accept'}
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleReject(item.id)}
                              disabled={busyId === item.id}
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-muted small">Processed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LabAppointments;
