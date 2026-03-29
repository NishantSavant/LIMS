/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaUserInjured, FaClipboardList, FaCalendarCheck, FaFilePrescription } from 'react-icons/fa';

interface DoctorUser {
  id: number;
  username: string;
  role: string;
}

interface DoctorProfile {
  full_name: string;
  doctor_unique_id: string;
}

interface PendingRequest {
  id: number;
  patient_name?: string;
  date: string;
  time_slot: string;
}

interface DoctorAppointment {
  id: number;
  patient_name?: string;
  date: string;
  time_slot: string;
  status?: string;
}

interface NotificationItem {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface FollowupTask {
  id: number;
  title: string;
  due_date: string;
  status: 'pending' | 'completed';
  patient_name?: string;
}

const DoctorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<DoctorUser | null>(null);
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [labReports, setLabReports] = useState<any[]>([]);
  const [myPatientsCount, setMyPatientsCount] = useState(0);
  const [upcomingAppointments, setUpcomingAppointments] = useState<DoctorAppointment[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [followups, setFollowups] = useState<FollowupTask[]>([]);

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : undefined;

  useEffect(() => {
    const authToken = localStorage.getItem('token');
    if (!authToken) {
      navigate('/login');
      return;
    }
    setToken(authToken);
  }, [navigate]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!token) return;

    const loadAll = async () => {
      try {
        const [userRes, profileRes, pendingRes, reportsRes, patientsRes, apptRes, notifRes, followupRes] = await Promise.all([
          axios.get<DoctorUser>('/api/users/me/', { headers: authHeaders }),
          axios.get<DoctorProfile>('/api/doctor/profile/', { headers: authHeaders }),
          axios.get<PendingRequest[]>('/api/doctor/pending-requests/', { headers: authHeaders }),
          axios.get<any[]>('/api/doctor/lab-reports/', { headers: authHeaders }),
          axios.get<any[]>('/api/doctor/my-patients/', { headers: authHeaders }),
          axios.get<DoctorAppointment[]>('/api/doctor/appointments/upcoming/', { headers: authHeaders }),
          axios.get<NotificationItem[]>('/api/notifications/', { headers: authHeaders }),
          axios.get<FollowupTask[]>('/api/doctor/followups/', { headers: authHeaders }),
        ]);

        if (userRes.data.role !== 'doctor') {
          navigate('/login');
          return;
        }

        setUser(userRes.data);
        setProfile(profileRes.data);
        setPendingRequests(Array.isArray(pendingRes.data) ? pendingRes.data : []);
        setLabReports(Array.isArray(reportsRes.data) ? reportsRes.data : []);
        setMyPatientsCount(Array.isArray(patientsRes.data) ? patientsRes.data.length : 0);
        setUpcomingAppointments(Array.isArray(apptRes.data) ? apptRes.data : []);
        setNotifications(Array.isArray(notifRes.data) ? notifRes.data : []);
        setFollowups(Array.isArray(followupRes.data) ? followupRes.data : []);
      } catch {
        navigate('/login');
      }
    };

    loadAll();
    const interval = setInterval(loadAll, 15000);
    return () => clearInterval(interval);
  }, [token]);

  const handleAcceptAppointment = async (id: number) => {
    if (!token) return;
    await axios.post(`/api/doctor/appointments/${id}/approve/`, {}, { headers: authHeaders });
    setPendingRequests((prev) => prev.filter((p) => p.id !== id));
  };

  const handleRejectAppointment = async (id: number) => {
    if (!token) return;
    await axios.post(`/api/doctor/appointments/${id}/reject/`, {}, { headers: authHeaders });
    setPendingRequests((prev) => prev.filter((p) => p.id !== id));
  };

  const markNotificationRead = async (id: number) => {
    if (!token) return;
    await axios.post(`/api/notifications/${id}/read/`, {}, { headers: authHeaders });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const displayName = profile?.full_name || user?.username || 'Doctor';
  const todayKey = new Date().toISOString().split('T')[0];
  const todaysAppointments = useMemo(
    () => upcomingAppointments.filter((appt) => appt.date === todayKey),
    [upcomingAppointments, todayKey]
  );

  const liveStats = {
    patients: myPatientsCount,
    requests: pendingRequests.length,
    appointments: upcomingAppointments.length,
    labReports: labReports.length,
  };

  if (!token) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="w-100 p-4">
      <div className="mb-4 p-4 rounded-4" style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', color: 'white' }}>
        <h4 className="mb-1">Welcome, Dr. {displayName}</h4>
        {profile?.doctor_unique_id && <small>Doctor ID: {profile.doctor_unique_id}</small>}
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-3"><StatCard title="Patients" value={liveStats.patients} icon={<FaUserInjured />} /></div>
        <div className="col-md-3"><StatCard title="Requests" value={liveStats.requests} icon={<FaClipboardList />} /></div>
        <div className="col-md-3"><StatCard title="Appointments" value={liveStats.appointments} icon={<FaCalendarCheck />} /></div>
        <div className="col-md-3"><StatCard title="Lab Reports" value={liveStats.labReports} icon={<FaFilePrescription />} /></div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 16 }}>
            <div className="card-body">
              <h6 className="fw-semibold mb-3">Pending Appointment Requests ({pendingRequests.length})</h6>
              {pendingRequests.length === 0 ? (
                <div className="text-muted small">No pending requests.</div>
              ) : (
                <div className="d-grid gap-2">
                  {pendingRequests.slice(0, 6).map((req) => (
                    <div key={req.id} className="border rounded-3 p-2">
                      <div className="small fw-semibold">{req.patient_name || 'Patient'}</div>
                      <div className="small text-muted">{new Date(req.date).toLocaleDateString()} | {req.time_slot}</div>
                      <div className="mt-2 d-flex gap-2">
                        <button className="btn btn-sm btn-success" onClick={() => handleAcceptAppointment(req.id)}>Approve</button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleRejectAppointment(req.id)}>Reject</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 16 }}>
            <div className="card-body">
              <h6 className="fw-semibold mb-3">Today's Schedule</h6>
              {todaysAppointments.length === 0 ? (
                <div className="text-muted small">No appointments today.</div>
              ) : (
                <div className="d-grid gap-2">
                  {todaysAppointments.map((appt) => (
                    <div key={appt.id} className="border rounded-3 p-2 bg-light d-flex justify-content-between">
                      <span className="small fw-semibold">{appt.patient_name || 'Patient'}</span>
                      <span className="badge bg-success">{appt.time_slot || 'TBD'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
            <div className="card-body">
              <h6 className="fw-semibold mb-3">Follow-up Tasks ({followups.length})</h6>
              {followups.length === 0 ? (
                <div className="text-muted small">No follow-up tasks.</div>
              ) : (
                <div className="d-grid gap-2">
                  {followups.slice(0, 8).map((task) => (
                    <div key={task.id} className="border rounded-3 p-2 bg-light">
                      <div className="small fw-semibold">{task.title}</div>
                      <div className="small text-muted">{task.patient_name || 'Patient'} | Due: {new Date(task.due_date).toLocaleDateString()} | {task.status}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
            <div className="card-body">
              <h6 className="fw-semibold mb-3">Notifications</h6>
              {notifications.length === 0 ? (
                <div className="text-muted small">No notifications.</div>
              ) : (
                <div className="d-grid gap-2">
                  {notifications.slice(0, 8).map((item) => (
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

export default DoctorDashboard;
