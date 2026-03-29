import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import BookAppointmentModal from './BookAppointmentModal';

interface AppointmentRequest {
  id: number;
  doctor_name: string;
  date: string;
  time_slot: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  can_cancel: boolean;
  can_reschedule: boolean;
}

interface LabAppointmentRequest {
  id: number;
  test_name: string;
  lab_name?: string;
  date: string;
  time_slot: string;
  status: string;
  created_at: string;
}

interface UnifiedAppointment {
  id: number;
  type: 'doctor' | 'lab';
  title: string;
  date: string;
  time_slot: string;
  status: string;
  created_at: string;
  can_cancel: boolean;
  can_reschedule: boolean;
}

const PatientAppointments: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [appointments, setAppointments] = useState<UnifiedAppointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [showConfirm, setShowConfirm] = useState<number | null>(null);

  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);

  const mergeAppointments = (
    doctorData: AppointmentRequest[] = [],
    labData: LabAppointmentRequest[] = []
  ): UnifiedAppointment[] => {
    const doctorAppointments = doctorData.map((a) => ({
      id: a.id,
      type: 'doctor' as const,
      title: a.doctor_name || 'Doctor Appointment',
      date: a.date,
      time_slot: a.time_slot,
      status: a.status,
      created_at: a.created_at,
      can_cancel: Boolean(a.can_cancel),
      can_reschedule: Boolean(a.can_reschedule),
    }));

    const labAppointments = labData.map((a) => ({
      id: a.id,
      type: 'lab' as const,
      title: a.lab_name || 'Lab Appointment',
      date: a.date,
      time_slot: a.time_slot || '10:00 AM',
      status: a.status,
      created_at: a.created_at,
      can_cancel: false,
      can_reschedule: false,
    }));

    return [...doctorAppointments, ...labAppointments];
  };

  const fetchAppointments = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      setLoading(true);
      const [doctorRes, labRes] = await Promise.all([
        axios.get<AppointmentRequest[]>(
          '/api/patient/appointment-requests/',
          { headers: { Authorization: `Bearer ${token}` } }
        ),
        axios.get<LabAppointmentRequest[]>(
          '/api/patient/lab-requests/',
          { headers: { Authorization: `Bearer ${token}` } }
        ),
      ]);

      setAppointments(mergeAppointments(doctorRes.data || [], labRes.data || []));
    } catch (err) {
      console.error('Error fetching appointments', err);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const confirmCancel = async (id: number) => {
    setUpdatingId(id);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `/api/appointments/${id}/cancel/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchAppointments();
    } catch {
      alert('Cancel failed');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleReschedule = async (appt: UnifiedAppointment) => {
    if (appt.type !== 'doctor') return;

    const newDate = prompt('New date (YYYY-MM-DD):', appt.date);
    const newTime = prompt('New time (HH:MM AM/PM):', appt.time_slot);
    if (!newDate || !newTime) return;

    setUpdatingId(appt.id);
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `/api/appointments/${appt.id}/reschedule/`,
        { date: newDate, time_slot: newTime },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchAppointments();
    } catch {
      alert('Reschedule failed');
    } finally {
      setUpdatingId(null);
    }
  };

  const getAppointmentDateTime = (appt: UnifiedAppointment) => {
    const combined = `${appt.date} ${appt.time_slot}`;
    return new Date(combined);
  };

  const { upcomingAppointments, pastAppointments } = useMemo(() => {
    const now = new Date();
    const upcoming: UnifiedAppointment[] = [];
    const past: UnifiedAppointment[] = [];

    appointments.forEach((appt) => {
      const dt = getAppointmentDateTime(appt);
      if (dt >= now) upcoming.push(appt);
      else past.push(appt);
    });

    upcoming.sort((a, b) => +getAppointmentDateTime(a) - +getAppointmentDateTime(b));
    past.sort((a, b) => +getAppointmentDateTime(b) - +getAppointmentDateTime(a));

    return { upcomingAppointments: upcoming, pastAppointments: past };
  }, [appointments]);

  const activeList = activeTab === 'upcoming' ? upcomingAppointments : pastAppointments;

  const renderStatusBadge = (status: string) => {
    if (status === 'approved') return <span className="badge bg-success">APPROVED</span>;
    if (['sample_collected', 'in_testing', 'results_ready', 'reported'].includes(status)) {
      return <span className="badge bg-success">ACCEPTED</span>;
    }
    if (status === 'pending') return <span className="badge bg-warning text-dark">PENDING</span>;
    if (status === 'rejected') return <span className="badge bg-danger">REJECTED</span>;
    return <span className="badge bg-secondary">{status.toUpperCase()}</span>;
  };

  return (
    <>
      <div className="p-4" style={{ minHeight: '100vh', backgroundColor: '#f5f7ff' }}>
        <div className="mb-4" />

        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h4 className="mb-1">Appointments</h4>
            <small className="text-muted">Book and manage your doctor and lab appointments</small>
          </div>
          <button className="btn btn-primary" style={{ borderRadius: 999 }} onClick={openModal}>
            + Book Appointment
          </button>
        </div>

        <div className="mb-3">
          <div className="btn-group" role="group">
            <button
              className={`btn ${activeTab === 'upcoming' ? 'btn-dark' : 'btn-light'}`}
              style={{ borderRadius: '999px 0 0 999px' }}
              onClick={() => setActiveTab('upcoming')}
            >
              Upcoming ({upcomingAppointments.length})
            </button>
            <button
              className={`btn ${activeTab === 'past' ? 'btn-dark' : 'btn-light'}`}
              style={{ borderRadius: '0 999px 999px 0' }}
              onClick={() => setActiveTab('past')}
            >
              Past ({pastAppointments.length})
            </button>
          </div>
        </div>

        <div className="card border-0 shadow-sm" style={{ borderRadius: 24, minHeight: 260 }}>
          <div className="card-body">
            {loading ? (
              <div className="d-flex flex-column justify-content-center align-items-center text-center" style={{ minHeight: 200 }}>
                <div className="spinner-border text-primary mb-3" />
                <p className="text-muted mb-0">Loading appointments...</p>
              </div>
            ) : activeList.length === 0 ? (
              <div className="d-flex flex-column justify-content-center align-items-center text-center" style={{ minHeight: 200 }}>
                <h6 className="mb-1">{activeTab === 'upcoming' ? 'No upcoming appointments' : 'No past appointments'}</h6>
                <p className="text-muted mb-3">
                  {activeTab === 'upcoming' ? 'Book an appointment with a doctor or laboratory' : 'Completed appointments will appear here'}
                </p>
                {activeTab === 'upcoming' && (
                  <button className="btn btn-primary" style={{ borderRadius: 999 }} onClick={openModal}>
                    Book Appointment
                  </button>
                )}
              </div>
            ) : (
              <div className="list-group list-group-flush">
                {activeList.map((appt) => {
                  const dt = getAppointmentDateTime(appt);
                  const dateStr = dt.toLocaleDateString();
                  const timeStr = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const bookedAt = new Date(appt.created_at);
                  const bookedDateStr = bookedAt.toLocaleDateString();
                  const bookedTimeStr = bookedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const isUpdating = updatingId === appt.id;

                  return (
                    <div key={`${appt.type}-${appt.id}`} className="list-group-item border-0 px-0 py-3">
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1 pe-3">
                          <div className="fw-semibold mb-1">{appt.title}</div>
                          <div className="text-muted small mb-1">{appt.type === 'lab' ? 'Lab' : 'Doctor'} appointment</div>
                          <div className="text-muted small mb-1">{dateStr} • {timeStr}</div>
                          <div className="text-muted small mb-1">Booked: {bookedDateStr} at {bookedTimeStr}</div>
                        </div>

                        <div className="text-end">
                          {renderStatusBadge(appt.status)}
                          {isUpdating ? (
                            <div className="spinner-border spinner-border-sm mt-2 me-2" />
                          ) : (
                            <>
                              {appt.can_reschedule && (
                                <button className="btn btn-sm btn-outline-primary d-block w-100 mt-1 px-2" onClick={() => handleReschedule(appt)}>
                                  Reschedule
                                </button>
                              )}
                              {appt.can_cancel && (
                                <button className="btn btn-sm btn-outline-danger d-block w-100 mt-1 px-2" onClick={() => setShowConfirm(appt.id)}>
                                  Cancel
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <BookAppointmentModal show={showModal} onClose={closeModal} />
      {showConfirm !== null && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Cancel Appointment</h5>
                <button type="button" className="btn-close" onClick={() => setShowConfirm(null)} />
              </div>
              <div className="modal-body">Are you sure you want to cancel this appointment? This action cannot be undone.</div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowConfirm(null)}>No, keep appointment</button>
                <button
                  className="btn btn-danger"
                  onClick={() => {
                    const id = showConfirm;
                    setShowConfirm(null);
                    if (id !== null) confirmCancel(id);
                  }}
                >
                  Yes, cancel appointment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PatientAppointments;
