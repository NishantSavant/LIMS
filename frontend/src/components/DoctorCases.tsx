/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

interface ConnectedPatient {
  id: number;
  patient_name: string;
  patient_id: string;
}

interface CaseTimelineEvent {
  id: number;
  event_type: string;
  description: string;
  actor_role?: string;
  actor_name?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

interface FollowUpTask {
  id: number;
  case: number;
  title: string;
  details?: string;
  due_date: string;
  status: 'pending' | 'completed';
  created_at: string;
}

interface PatientCase {
  id: number;
  disease_name: string;
  medicines_given: string;
  prescriptions?: string;
  reports_required?: string;
  notes?: string;
  report_requests?: Array<{
    id: number;
    test_name: string;
    status: 'pending' | 'completed';
    report_file?: string | null;
  }>;
  created_at: string;
  updated_at: string;
}

const initialForm = {
  disease_name: '',
  medicines_given: '',
  prescriptions: '',
  reports_required: '',
  notes: '',
};

const initialFollowupForm = {
  title: '',
  details: '',
  due_date: '',
};

const DoctorCases: React.FC = () => {
  const [patients, setPatients] = useState<ConnectedPatient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [cases, setCases] = useState<PatientCase[]>([]);
  const [form, setForm] = useState(initialForm);
  const [editingCaseId, setEditingCaseId] = useState<number | null>(null);
  const [activeCaseId, setActiveCaseId] = useState<number | null>(null);
  const [timelinesByCase, setTimelinesByCase] = useState<Record<number, CaseTimelineEvent[]>>({});
  const [tasksByCase, setTasksByCase] = useState<Record<number, FollowUpTask[]>>({});
  const [followupForm, setFollowupForm] = useState(initialFollowupForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem('token');

  const selectedPatient = useMemo(
    () => patients.find((p) => p.patient_id === selectedPatientId),
    [patients, selectedPatientId]
  );

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : undefined;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!token) return;
    const loadPatients = async () => {
      try {
        const res = await axios.get<ConnectedPatient[]>(
          '/api/doctor/my-patients/',
          { headers: authHeaders }
        );
        setPatients(Array.isArray(res.data) ? res.data : []);
      } catch {
        setPatients([]);
      }
    };
    loadPatients();
  }, [token]);

  const loadCases = async (patientUniqueId: string) => {
    if (!token || !patientUniqueId) return;
    setLoading(true);
    try {
      const res = await axios.get<PatientCase[]>(
        `/api/doctor/patient/${patientUniqueId}/cases/`,
        { headers: authHeaders }
      );
      const incoming = Array.isArray(res.data) ? res.data : [];
      setCases(incoming);
      if (incoming.length > 0) {
        setActiveCaseId((prev) => prev ?? incoming[0].id);
      } else {
        setActiveCaseId(null);
      }
    } catch {
      setCases([]);
      setActiveCaseId(null);
    } finally {
      setLoading(false);
    }
  };

  const loadCaseExtras = async (caseId: number) => {
    if (!token) return;
    try {
      const [timelineRes, tasksRes] = await Promise.all([
        axios.get<CaseTimelineEvent[]>(
          `/api/doctor/patient-cases/${caseId}/timeline/`,
          { headers: authHeaders }
        ),
        axios.get<FollowUpTask[]>(
          `/api/doctor/patient-cases/${caseId}/followups/`,
          { headers: authHeaders }
        ),
      ]);

      setTimelinesByCase((prev) => ({ ...prev, [caseId]: Array.isArray(timelineRes.data) ? timelineRes.data : [] }));
      setTasksByCase((prev) => ({ ...prev, [caseId]: Array.isArray(tasksRes.data) ? tasksRes.data : [] }));
    } catch {
      setTimelinesByCase((prev) => ({ ...prev, [caseId]: [] }));
      setTasksByCase((prev) => ({ ...prev, [caseId]: [] }));
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (selectedPatientId) {
      loadCases(selectedPatientId);
    } else {
      setCases([]);
      setActiveCaseId(null);
    }
    setTimelinesByCase({});
    setTasksByCase({});
  }, [selectedPatientId]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (activeCaseId) {
      loadCaseExtras(activeCaseId);
    }
  }, [activeCaseId]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingCaseId(null);
  };

  const submitCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedPatientId) return;
    setSaving(true);
    try {
      if (editingCaseId) {
        await axios.patch(
          `/api/doctor/patient-cases/${editingCaseId}/`,
          form,
          { headers: authHeaders }
        );
      } else {
        await axios.post(
          '/api/doctor/patient-cases/',
          { ...form, patient_unique_id: selectedPatientId },
          { headers: authHeaders }
        );
      }
      await loadCases(selectedPatientId);
      resetForm();
    } catch (error: any) {
      alert(error?.response?.data?.error || 'Failed to save case');
    } finally {
      setSaving(false);
    }
  };

  const submitFollowupTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !activeCaseId) return;

    try {
      await axios.post(
        `/api/doctor/patient-cases/${activeCaseId}/followups/`,
        followupForm,
        { headers: authHeaders }
      );
      setFollowupForm(initialFollowupForm);
      await loadCaseExtras(activeCaseId);
    } catch (error: any) {
      alert(error?.response?.data?.error || 'Failed to create follow-up task');
    }
  };

  const markTaskCompleted = async (taskId: number) => {
    if (!token || !activeCaseId) return;
    try {
      await axios.patch(
        `/api/doctor/followups/${taskId}/`,
        { status: 'completed' },
        { headers: authHeaders }
      );
      await loadCaseExtras(activeCaseId);
    } catch {
      alert('Failed to update task status');
    }
  };

  const startEdit = (item: PatientCase) => {
    setEditingCaseId(item.id);
    setForm({
      disease_name: item.disease_name || '',
      medicines_given: item.medicines_given || '',
      prescriptions: item.prescriptions || '',
      reports_required: item.reports_required || '',
      notes: item.notes || '',
    });
  };

  return (
    <div className="container-fluid py-4 px-4" style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <div className="mb-4">
        <h3 className="fw-bold mb-1">Patient Cases</h3>
        <p className="text-muted mb-0">Timeline, follow-up tasks, and report tracking</p>
      </div>

      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 16 }}>
        <div className="card-body">
          <label className="form-label fw-semibold">Select Patient</label>
          <select
            className="form-select"
            value={selectedPatientId}
            onChange={(e) => {
              setSelectedPatientId(e.target.value);
              resetForm();
            }}
          >
            <option value="">Choose patient</option>
            {patients.map((p) => (
              <option key={p.id} value={p.patient_id}>
                {p.patient_name} ({p.patient_id})
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedPatient && (
        <div className="row g-4">
          <div className="col-lg-5">
            <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
              <div className="card-body">
                <h5 className="fw-semibold mb-3">
                  {editingCaseId ? 'Update Case' : 'Create New Case'} - {selectedPatient.patient_name}
                </h5>
                <form onSubmit={submitCase}>
                  <div className="mb-3">
                    <label className="form-label">Disease Name</label>
                    <input className="form-control" value={form.disease_name} onChange={(e) => setForm({ ...form, disease_name: e.target.value })} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Medicine Given</label>
                    <textarea className="form-control" rows={3} value={form.medicines_given} onChange={(e) => setForm({ ...form, medicines_given: e.target.value })} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Prescriptions</label>
                    <textarea className="form-control" rows={2} value={form.prescriptions} onChange={(e) => setForm({ ...form, prescriptions: e.target.value })} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Reports To Be Done</label>
                    <textarea className="form-control" rows={2} value={form.reports_required} onChange={(e) => setForm({ ...form, reports_required: e.target.value })} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Additional Notes</label>
                    <textarea className="form-control" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                  </div>
                  <div className="d-flex gap-2">
                    <button className="btn btn-success" type="submit" disabled={saving}>
                      {saving ? 'Saving...' : editingCaseId ? 'Update Case' : 'Create Case'}
                    </button>
                    {editingCaseId && (
                      <button className="btn btn-outline-secondary" type="button" onClick={resetForm}>
                        Cancel Edit
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>

          <div className="col-lg-7">
            <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
              <div className="card-body">
                <h5 className="fw-semibold mb-3">Case History ({cases.length})</h5>
                {loading ? (
                  <div className="text-muted">Loading cases...</div>
                ) : cases.length === 0 ? (
                  <div className="text-muted">No cases found for this patient.</div>
                ) : (
                  <div className="d-grid gap-3">
                    {cases.map((item) => (
                      <div key={item.id} className="border rounded-3 p-3 bg-light">
                        <div className="d-flex justify-content-between align-items-start mb-2 gap-2">
                          <h6 className="mb-0 fw-bold">{item.disease_name}</h6>
                          <div className="d-flex gap-2">
                            <button className="btn btn-sm btn-outline-secondary" onClick={() => setActiveCaseId(item.id)}>
                              {activeCaseId === item.id ? 'Active' : 'Open'}
                            </button>
                            <button className="btn btn-sm btn-outline-primary" onClick={() => startEdit(item)}>
                              Edit
                            </button>
                          </div>
                        </div>
                        <div className="small mb-1"><strong>Medicine:</strong> {item.medicines_given}</div>
                        <div className="small mb-1"><strong>Prescription:</strong> {item.prescriptions || '-'}</div>
                        <div className="small mb-1"><strong>Reports:</strong> {item.reports_required || '-'}</div>
                        <div className="small mb-2"><strong>Notes:</strong> {item.notes || '-'}</div>
                        <div className="small text-muted">
                          Created: {new Date(item.created_at).toLocaleString()} | Updated: {new Date(item.updated_at).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeCaseId && (
        <div className="row g-4 mt-1">
          <div className="col-lg-6">
            <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
              <div className="card-body">
                <h6 className="fw-semibold mb-3">Case Timeline</h6>
                {(timelinesByCase[activeCaseId] || []).length === 0 ? (
                  <div className="text-muted small">No timeline events yet.</div>
                ) : (
                  <div className="d-grid gap-2">
                    {(timelinesByCase[activeCaseId] || []).map((event) => (
                      <div key={event.id} className="border rounded-3 p-2 bg-light">
                        <div className="small fw-semibold">{event.description}</div>
                        <div className="small text-muted">
                          {event.actor_name || event.actor_role || 'System'} | {new Date(event.created_at).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: 16 }}>
              <div className="card-body">
                <h6 className="fw-semibold mb-3">Add Follow-up Task</h6>
                <form onSubmit={submitFollowupTask}>
                  <div className="mb-2">
                    <input
                      className="form-control"
                      placeholder="Task title (e.g. Repeat CBC in 1 month)"
                      value={followupForm.title}
                      onChange={(e) => setFollowupForm((prev) => ({ ...prev, title: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="mb-2">
                    <textarea
                      className="form-control"
                      rows={2}
                      placeholder="Details"
                      value={followupForm.details}
                      onChange={(e) => setFollowupForm((prev) => ({ ...prev, details: e.target.value }))}
                    />
                  </div>
                  <div className="mb-3">
                    <input
                      type="date"
                      className="form-control"
                      value={followupForm.due_date}
                      onChange={(e) => setFollowupForm((prev) => ({ ...prev, due_date: e.target.value }))}
                      required
                    />
                  </div>
                  <button className="btn btn-success" type="submit">Create Task</button>
                </form>
              </div>
            </div>

            <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
              <div className="card-body">
                <h6 className="fw-semibold mb-3">Follow-up Tasks</h6>
                {(tasksByCase[activeCaseId] || []).length === 0 ? (
                  <div className="text-muted small">No follow-up tasks for this case.</div>
                ) : (
                  <div className="d-grid gap-2">
                    {(tasksByCase[activeCaseId] || []).map((task) => (
                      <div key={task.id} className="border rounded-3 p-2 bg-light d-flex justify-content-between align-items-center gap-2">
                        <div>
                          <div className="small fw-semibold">{task.title}</div>
                          <div className="small text-muted">Due: {new Date(task.due_date).toLocaleDateString()} | {task.status}</div>
                        </div>
                        {task.status === 'pending' && (
                          <button className="btn btn-sm btn-outline-success" onClick={() => markTaskCompleted(task.id)}>
                            Mark Completed
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorCases;
