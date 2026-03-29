/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaFileAlt, FaPrescriptionBottleAlt, FaPills } from 'react-icons/fa';

interface MeUser {
  id: number;
  username: string;
  role: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
}

interface PatientProfile {
  full_name: string;
  patient_unique_id: string;
}

interface DoctorAppointment {
  id: number;
  doctor_name: string;
  date: string;
  time_slot: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface LabAppointment {
  id: number;
  lab_name?: string;
  date: string;
  time_slot?: string;
  status: string;
}

interface DashboardAppointment {
  id: number;
  title: string;
  type: 'doctor' | 'lab';
  date: string;
  time_slot: string;
  status: string;
}

interface CaseTimelineEvent {
  id: number;
  description: string;
  created_at: string;
  actor_name?: string;
}

interface PatientCase {
  id: number;
  doctor_name: string;
  disease_name: string;
  medicines_given: string;
  prescriptions?: string;
  reports_required?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface FollowupTask {
  id: number;
  case: number;
  title: string;
  details?: string;
  due_date: string;
  status: 'pending' | 'completed';
  doctor_name?: string;
}

interface NotificationItem {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

const PatientDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<MeUser | null>(null);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [appointments, setAppointments] = useState<DashboardAppointment[]>([]);
  const [cases, setCases] = useState<PatientCase[]>([]);
  const [caseTimeline, setCaseTimeline] = useState<Record<number, CaseTimelineEvent[]>>({});
  const [followups, setFollowups] = useState<FollowupTask[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total_reports: 0, total_prescriptions: 0, total_orders: 0 });

  const token = localStorage.getItem('token');
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : undefined;

  const getAppointmentDateTime = (appt: DashboardAppointment) => new Date(`${appt.date} ${appt.time_slot}`);

  const upcomingAppointments = useMemo(() => {
    const now = new Date();
    return appointments.filter((appt) => {
      if (getAppointmentDateTime(appt) < now) return false;
      if (appt.type === 'doctor') return appt.status === 'approved';
      return ['pending', 'sample_collected', 'in_testing', 'results_ready', 'reported'].includes(appt.status);
    });
  }, [appointments]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    const loadAll = async () => {
      try {
        const [userRes, profileRes, statsRes, doctorApptRes, labApptRes, caseRes, followupRes, notifRes] = await Promise.all([
          axios.get<MeUser>('/api/users/me/', { headers: authHeaders }),
          axios.get<PatientProfile>('/api/patient/profile/', { headers: authHeaders }),
          axios.get('/api/patient/stats/', { headers: authHeaders }),
          axios.get<DoctorAppointment[]>('/api/patient/appointment-requests/', { headers: authHeaders }),
          axios.get<LabAppointment[]>('/api/patient/lab-requests/', { headers: authHeaders }),
          axios.get<PatientCase[]>('/api/patient/cases/', { headers: authHeaders }),
          axios.get<FollowupTask[]>('/api/patient/followups/', { headers: authHeaders }),
          axios.get<NotificationItem[]>('/api/notifications/', { headers: authHeaders }),
        ]);

        if (userRes.data.role !== 'patient') {
          navigate('/login', { replace: true });
          return;
        }

        setUser(userRes.data);
        setProfile(profileRes.data);
        setStats(statsRes.data || { total_reports: 0, total_prescriptions: 0, total_orders: 0 });

        const doctorAppointments: DashboardAppointment[] = (Array.isArray(doctorApptRes.data) ? doctorApptRes.data : []).map((a) => ({
          id: a.id,
          title: a.doctor_name || 'Doctor Appointment',
          type: 'doctor',
          date: a.date,
          time_slot: a.time_slot,
          status: a.status,
        }));
        const labAppointments: DashboardAppointment[] = (Array.isArray(labApptRes.data) ? labApptRes.data : []).map((a) => ({
          id: a.id,
          title: a.lab_name || 'Lab Appointment',
          type: 'lab',
          date: a.date,
          time_slot: a.time_slot || '10:00 AM',
          status: a.status,
        }));
        setAppointments([...doctorAppointments, ...labAppointments]);

        const loadedCases = Array.isArray(caseRes.data) ? caseRes.data : [];
        setCases(loadedCases);
        setFollowups(Array.isArray(followupRes.data) ? followupRes.data : []);
        setNotifications(Array.isArray(notifRes.data) ? notifRes.data : []);

        const timelineCalls = loadedCases.slice(0, 5).map((item) =>
          axios.get<CaseTimelineEvent[]>(`/api/patient/cases/${item.id}/timeline/`, { headers: authHeaders })
            .then((res) => ({ caseId: item.id, events: Array.isArray(res.data) ? res.data : [] }))
            .catch(() => ({ caseId: item.id, events: [] }))
        );
        const timelineResults = await Promise.all(timelineCalls);
        const timelineMap: Record<number, CaseTimelineEvent[]> = {};
        timelineResults.forEach((entry) => { timelineMap[entry.caseId] = entry.events; });
        setCaseTimeline(timelineMap);
      } catch {
        localStorage.removeItem('token');
        navigate('/login', { replace: true });
      } finally {
        setLoading(false);
      }
    };

    loadAll();
    const interval = setInterval(loadAll, 15000);
    return () => clearInterval(interval);
  }, [token, navigate]);

  const markNotificationRead = async (id: number) => {
    if (!token) return;
    await axios.post(`/api/notifications/${id}/read/`, {}, { headers: authHeaders });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (!user || !profile) return <div className="p-4">Authentication failed.</div>;

  const displayName = [user.first_name, user.middle_name, user.last_name].filter(Boolean).join(' ') || profile.full_name || user.username;

  return (
    <div className="p-4" style={{ minHeight: '100vh' }}>
      <div className="mb-4 d-flex align-items-center justify-content-between" style={{ background: '#2563eb', borderRadius: 24, padding: '20px 28px', color: 'white' }}>
        <div>
          <h5 className="mb-1">Welcome back, {displayName.toUpperCase()}!</h5>
          <small>Patient ID: {profile.patient_unique_id}</small>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <StatCard title="Total Reports" value={stats.total_reports} icon={<FaFileAlt />} />
        <StatCard title="Upcoming Appointments" value={upcomingAppointments.length} icon={<FaPills />} />
        <StatCard title="Prescriptions" value={stats.total_prescriptions} icon={<FaPrescriptionBottleAlt />} />
        <StatCard title="Active Orders" value={stats.total_orders} icon={<FaPills />} />
      </div>

      <div className="row g-4 mb-4">
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
            <div className="card-body">
              <div className="d-flex justify-content-between mb-3">
                <h6 className="mb-0">Upcoming Appointments</h6>
                <button className="btn btn-link btn-sm" onClick={() => navigate('/patient/appointments')}>View All</button>
              </div>
              {upcomingAppointments.length === 0 ? (
                <div className="text-muted small">No upcoming appointments.</div>
              ) : (
                <div className="d-grid gap-2">
                  {upcomingAppointments.slice(0, 5).map((appt) => (
                    <div key={appt.id} className="border rounded-3 p-2 bg-light">
                      <div className="small fw-semibold">{appt.title}</div>
                      <div className="small text-muted">{appt.type === 'lab' ? 'Lab' : 'Doctor'} appointment</div>
                      <div className="small text-muted">{new Date(`${appt.date} ${appt.time_slot}`).toLocaleString()}</div>
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
              <h6 className="mb-3">Follow-up Tasks</h6>
              {followups.length === 0 ? (
                <div className="text-muted small">No follow-up tasks yet.</div>
              ) : (
                <div className="d-grid gap-2">
                  {followups.slice(0, 8).map((task) => (
                    <div key={task.id} className="border rounded-3 p-2 bg-light">
                      <div className="small fw-semibold">{task.title}</div>
                      <div className="small text-muted">Doctor: {task.doctor_name || '-'} | Due: {new Date(task.due_date).toLocaleDateString()} | {task.status}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 16 }}>
        <div className="card-body">
          <h6 className="mb-3">Doctor Cases (Read Only)</h6>
          {cases.length === 0 ? (
            <div className="text-muted small">No case records shared yet.</div>
          ) : (
            <div className="d-grid gap-3">
              {cases.slice(0, 5).map((item) => (
                <div key={item.id} className="border rounded-3 p-3 bg-light">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h6 className="mb-0 fw-bold">{item.disease_name}</h6>
                    <small className="text-muted">{item.doctor_name || 'Doctor'}</small>
                  </div>
                  <div className="small mb-1"><strong>Medicine:</strong> {item.medicines_given}</div>
                  <div className="small mb-1"><strong>Prescription:</strong> {item.prescriptions || '-'}</div>
                  <div className="small mb-1"><strong>Reports:</strong> {item.reports_required || '-'}</div>
                  <div className="small mb-1"><strong>Notes:</strong> {item.notes || '-'}</div>
                  <div className="small text-muted mb-2">Updated: {new Date(item.updated_at).toLocaleString()}</div>

                  <div className="small fw-semibold mb-1">Timeline</div>
                  {(caseTimeline[item.id] || []).length === 0 ? (
                    <div className="small text-muted">No timeline entries.</div>
                  ) : (
                    <div className="d-grid gap-1">
                      {(caseTimeline[item.id] || []).slice(0, 6).map((ev) => (
                        <div key={ev.id} className="small border rounded-2 p-1 bg-white">
                          <div>{ev.description}</div>
                          <div className="text-muted">{ev.actor_name || 'Doctor'} | {new Date(ev.created_at).toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
        <div className="card-body">
          <h6 className="mb-3">Notifications</h6>
          {notifications.length === 0 ? (
            <div className="text-muted small">No notifications.</div>
          ) : (
            <div className="d-grid gap-2">
              {notifications.slice(0, 10).map((n) => (
                <div key={n.id} className={`border rounded-3 p-2 ${n.is_read ? 'bg-light' : 'bg-warning-subtle'}`}>
                  <div className="small fw-semibold">{n.title}</div>
                  <div className="small text-muted">{n.message}</div>
                  <div className="small text-muted d-flex justify-content-between mt-1">
                    <span>{new Date(n.created_at).toLocaleString()}</span>
                    {!n.is_read && (
                      <button className="btn btn-sm btn-link p-0 text-decoration-none" onClick={() => markNotificationRead(n.id)}>
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
  );
};

const StatCard: React.FC<{ title: string; value: number; icon: React.ReactNode }> = ({ title, value, icon }) => (
  <div className="col-md-3">
    <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
      <div className="card-body d-flex justify-content-between align-items-center">
        <div>
          <small className="text-muted">{title}</small>
          <h3 className="mb-0">{value}</h3>
        </div>
        <div>{icon}</div>
      </div>
    </div>
  </div>
);

export default PatientDashboard;
