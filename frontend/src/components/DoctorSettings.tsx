import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface DoctorProfile {
  full_name: string;
  specialization: string;
  doctor_unique_id: string;
  registration_no: string;
  date_of_birth: string | null;
  gender: string | null;
  blood_group: string | null;
  address: string;
  emergency_contact: string;
}

const DoctorSettings: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<DoctorProfile>({
    full_name: '',
    specialization: '',
    doctor_unique_id: '',
    registration_no: '',
    date_of_birth: '',
    gender: '',
    blood_group: '',
    address: '',
    emergency_contact: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    axios
      .get<DoctorProfile>('/api/doctor/profile/', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setForm({
          full_name: res.data.full_name || '',
          specialization: res.data.specialization || '',
          doctor_unique_id: res.data.doctor_unique_id || '',
          registration_no: res.data.registration_no || '',
          date_of_birth: res.data.date_of_birth || '',
          gender: res.data.gender || '',
          blood_group: res.data.blood_group || '',
          address: res.data.address || '',
          emergency_contact: res.data.emergency_contact || '',
        });
      })
      .finally(() => setLoading(false));
  }, [navigate, token]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    try {
      await axios.put('/api/doctor/profile/', form, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="p-4" style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <h4 className="mb-1">Doctor Settings</h4>
      <small className="text-muted">Manage your professional profile details</small>

      <div className="card border-0 shadow-sm mt-4 mb-3" style={{ borderRadius: 24, maxWidth: 640 }}>
        <div className="card-body">
          <div className="fw-semibold">{form.full_name || 'Doctor'}</div>
          <small className="text-muted">Doctor</small>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ maxWidth: 640 }}>
        <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: 24 }}>
          <div className="card-body">
            <h6 className="mb-3">Profile Information</h6>

            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label small text-muted">Full Name</label>
                <input
                  type="text"
                  className="form-control"
                  name="full_name"
                  value={form.full_name}
                  onChange={handleChange}
                  placeholder="Your full name"
                />
              </div>
              <div className="col-md-6">
                <label className="form-label small text-muted">Specialization</label>
                <input
                  type="text"
                  className="form-control"
                  name="specialization"
                  value={form.specialization}
                  onChange={handleChange}
                  placeholder="e.g., Cardiologist"
                />
              </div>
              <div className="col-md-6">
                <label className="form-label small text-muted">Registration Number</label>
                <input
                  type="text"
                  className="form-control"
                  name="registration_no"
                  value={form.registration_no}
                  onChange={handleChange}
                  placeholder="Medical registration number"
                />
              </div>
              <div className="col-md-6">
                <label className="form-label small text-muted">Doctor ID</label>
                <input
                  type="text"
                  className="form-control"
                  name="doctor_unique_id"
                  value={form.doctor_unique_id}
                  onChange={handleChange}
                  disabled
                />
              </div>
              <div className="col-md-6">
                <label className="form-label small text-muted">Date of Birth</label>
                <input
                  type="date"
                  className="form-control"
                  name="date_of_birth"
                  value={form.date_of_birth || ''}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label small text-muted">Gender</label>
                <select
                  className="form-select"
                  name="gender"
                  value={form.gender || ''}
                  onChange={handleChange}
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label small text-muted">Blood Group</label>
                <select
                  className="form-select"
                  name="blood_group"
                  value={form.blood_group || ''}
                  onChange={handleChange}
                >
                  <option value="">Select blood group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
              <div className="col-12">
                <label className="form-label small text-muted">Address</label>
                <input
                  type="text"
                  className="form-control"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Clinic/Hospital address"
                />
              </div>
              <div className="col-md-6">
                <label className="form-label small text-muted">Emergency Contact</label>
                <input
                  type="text"
                  className="form-control"
                  name="emergency_contact"
                  value={form.emergency_contact}
                  onChange={handleChange}
                  placeholder="Emergency contact number"
                />
              </div>
            </div>
          </div>
        </div>

        <button type="submit" className="btn btn-primary mt-2" disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
};

export default DoctorSettings;
