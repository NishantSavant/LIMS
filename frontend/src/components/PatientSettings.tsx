import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface PatientProfile {
  full_name: string;
  date_of_birth: string | null;
  gender: string | null;
  blood_group: string | null;
  phone: string;
  abha_address: string;
  // extend later with gender, blood_group, city, etc.
}

const PatientSettings: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<PatientProfile>({
    full_name: '',
    date_of_birth: '',
    gender: '',
    blood_group: '',
    phone: '',
    abha_address: '',
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
      .get<PatientProfile>('/api/patient/profile/', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setForm({
          full_name: res.data.full_name || '',
          date_of_birth: res.data.date_of_birth || '',
          gender: res.data.gender || '',
          blood_group: res.data.blood_group || '',
          phone: res.data.phone || '',
          abha_address: res.data.abha_address || '',
        });
      })
      .finally(() => setLoading(false));
  }, [navigate, token]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);

   axios.put('/api/patient/profile/', form, {
  headers: { Authorization: `Bearer ${token}` },
});

  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="p-4" style={{ minHeight: '100vh', backgroundColor: '#f5f7ff' }}>
      <button
        className="btn btn-link text-decoration-none mb-3 px-0"
        onClick={() => navigate(-1)}
      >
        ← Back
      </button>

      <h4 className="mb-1">Profile Settings</h4>
      <small className="text-muted">
        Manage your personal and medical information
      </small>

      {/* Profile photo card */}
      <div
        className="card border-0 shadow-sm mt-4 mb-3"
        style={{ borderRadius: 24, maxWidth: 640 }}
      >
        <div className="card-body d-flex align-items-center">
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              backgroundColor: '#e5e7eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              marginRight: 16,
            }}
          >
            👤
          </div>
          <div>
            <div className="fw-semibold">{form.full_name || 'Patient'}</div>
            <small className="text-muted">Patient</small>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ maxWidth: 640 }}>
        {/* Basic Information */}
        <div
          className="card border-0 shadow-sm mb-3"
          style={{ borderRadius: 24 }}
        >
          <div className="card-body">
            <h6 className="mb-3">Basic Information</h6>

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
                  <option value="">Select Gender</option>
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
              {/* placeholders for gender / blood group */}
              <div className="col-md-6">
                <label className="form-label small text-muted">Phone Number</label>
                <input
                  type="text"
                  className="form-control"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>
              <div className="col-md-6">
                <label className="form-label small text-muted">Address</label>
                <input
                  type="text"
                  className="form-control"
                  name="abha_address"
                  value={form.abha_address}
                  onChange={handleChange}
                  placeholder="Enter your complete address"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Emergency contact / medical info sections can be added later */}

        <button
          type="submit"
          className="btn btn-primary mt-2"
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
};

export default PatientSettings;
