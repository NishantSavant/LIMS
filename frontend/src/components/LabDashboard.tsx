/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaUpload, FaVial, FaFileAlt, FaUserInjured } from 'react-icons/fa';

interface Sample {
  id: number;
  barcode: string;
  sample_type: string;
  collection_date: string;
  status: string;
}

interface LabStats {
  pending_samples: number;
  todays_uploads: number;
  total_patients: number;
  critical_reports: number;
}

interface NotificationItem {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface LabDashboardProps {
  embedded?: boolean;
}

const LabDashboard: React.FC<LabDashboardProps> = () => {
  const navigate = useNavigate();
  const [pendingSamples, setPendingSamples] = useState<Sample[]>([]);
  const [sampleHistory, setSampleHistory] = useState<Sample[]>([]);
  const [stats, setStats] = useState<LabStats>({
    pending_samples: 0,
    todays_uploads: 0,
    total_patients: 0,
    critical_reports: 0,
  });
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const token = localStorage.getItem('token');
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : undefined;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const loadAll = useCallback(async () => {
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const [statsRes, pendingRes, historyRes, notifRes] = await Promise.all([
        axios.get<LabStats>('/api/lab/stats/', { headers: authHeaders }),
        axios.get<Sample[]>('/api/lab/pending-samples/', { headers: authHeaders }),
        axios.get<Sample[]>('/api/lab/sample-history/', { headers: authHeaders }),
        axios.get<NotificationItem[]>('/api/notifications/', { headers: authHeaders }),
      ]);

      setStats({
        pending_samples: Number(statsRes.data?.pending_samples || 0),
        todays_uploads: Number(statsRes.data?.todays_uploads || 0),
        total_patients: Number(statsRes.data?.total_patients || 0),
        critical_reports: Number(statsRes.data?.critical_reports || 0),
      });
      setPendingSamples(Array.isArray(pendingRes.data) ? pendingRes.data : []);
      setSampleHistory(Array.isArray(historyRes.data) ? historyRes.data : []);
      setNotifications(Array.isArray(notifRes.data) ? notifRes.data : []);
    } catch {
      navigate('/login');
    }
  }, [token, navigate]);

  useEffect(() => {
    loadAll();
    const interval = setInterval(loadAll, 15000);
    return () => clearInterval(interval);
  }, [loadAll]);

  const markNotificationRead = async (id: number) => {
    if (!token) return;
    await axios.post(`/api/notifications/${id}/read/`, {}, { headers: authHeaders });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  return (
    <div className="p-4" style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <div className="mb-4">
        <h4 className="mb-1">Lab Dashboard</h4>
        <small className="text-muted">Live stats, pending samples, history, and report request notifications.</small>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-3"><StatCard title="Pending Samples" value={stats.pending_samples} icon={<FaVial />} /></div>
        <div className="col-md-3"><StatCard title="Today's Uploads" value={stats.todays_uploads} icon={<FaUpload />} /></div>
        <div className="col-md-3"><StatCard title="Total Patients" value={stats.total_patients} icon={<FaUserInjured />} /></div>
        <div className="col-md-3"><StatCard title="Critical Reports" value={stats.critical_reports} icon={<FaFileAlt />} /></div>
      </div>

      <div className="row g-4">
        <div className="col-lg-7">
          <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 16 }}>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-semibold mb-0">Pending Samples ({pendingSamples.length})</h6>
                <button className="btn btn-sm btn-success" onClick={() => navigate('/lab/create-sample')}>Create Sample</button>
              </div>
              {pendingSamples.length === 0 ? (
                <div className="text-muted small">No pending samples.</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm align-middle mb-0">
                    <thead><tr><th>Barcode</th><th>Type</th><th>Created</th><th>Action</th></tr></thead>
                    <tbody>
                      {pendingSamples.slice(0, 10).map((sample) => (
                        <tr key={sample.id}>
                          <td className="fw-semibold">{sample.barcode}</td>
                          <td>{sample.sample_type}</td>
                          <td>{new Date(sample.collection_date).toLocaleString()}</td>
                          <td>
                            <button className="btn btn-sm btn-outline-primary" onClick={() => navigate(`/lab/upload-reports?sample=${sample.id}`)}>
                              Upload Report
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
            <div className="card-body">
              <h6 className="fw-semibold mb-3">Sample History</h6>
              {sampleHistory.length === 0 ? (
                <div className="text-muted small">No history yet.</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm align-middle mb-0">
                    <thead><tr><th>Barcode</th><th>Type</th><th>Status</th><th>Created</th></tr></thead>
                    <tbody>
                      {sampleHistory.slice(0, 10).map((sample) => (
                        <tr key={sample.id}>
                          <td className="fw-semibold">{sample.barcode}</td>
                          <td>{sample.sample_type}</td>
                          <td>
                            <span className={`badge ${sample.status === 'completed' ? 'bg-success' : 'bg-warning text-dark'}`}>
                              {sample.status}
                            </span>
                          </td>
                          <td>{new Date(sample.collection_date).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
            <div className="card-body">
              <h6 className="fw-semibold mb-3">Notifications</h6>
              {notifications.length === 0 ? (
                <div className="text-muted small">No notifications.</div>
              ) : (
                <div className="d-grid gap-2">
                  {notifications.slice(0, 10).map((item) => (
                    <div key={item.id} className={`border rounded-3 p-2 ${item.is_read ? 'bg-light' : 'bg-warning-subtle'}`}>
                      <div className="small fw-semibold">{item.title}</div>
                      <div className="small text-muted">{item.message}</div>
                      <div className="small text-muted d-flex justify-content-between mt-1">
                        <span>{new Date(item.created_at).toLocaleString()}</span>
                        {!item.is_read && (
                          <button className="btn btn-sm btn-link p-0 text-decoration-none" onClick={() => markNotificationRead(item.id)}>
                            Mark read
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: number; icon: React.ReactNode }> = ({ title, value, icon }) => (
  <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
    <div className="card-body d-flex justify-content-between align-items-center">
      <div>
        <div className="small text-muted">{title}</div>
        <div className="h4 mb-0">{value}</div>
      </div>
      <div>{icon}</div>
    </div>
  </div>
);

export default LabDashboard;
