import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface LabProfile {
  name: string;
  address: string;
  lab_unique_id: string;
  license_no: string;
}

const LabSettings: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<LabProfile>({
    name: '',
    address: '',
    lab_unique_id: '',
    license_no: '',
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
      .get<LabProfile>('/api/lab/profile/', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setForm({
          name: res.data.name || '',
          address: res.data.address || '',
          lab_unique_id: res.data.lab_unique_id || '',
          license_no: res.data.license_no || '',
        });
      })
      .finally(() => setLoading(false));
  }, [navigate, token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    try {
      await axios.put('/api/lab/profile/', form, {
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
    <div className="p-4" style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <h4 className="mb-1">Lab Settings</h4>
      <small className="text-muted">Manage your laboratory profile details</small>

      <div className="card border-0 shadow-sm mt-4 mb-3" style={{ borderRadius: 24, maxWidth: 640 }}>
        <div className="card-body">
          <div className="fw-semibold">{form.name || 'Laboratory'}</div>
          <small className="text-muted">Lab</small>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ maxWidth: 640 }}>
        <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: 24 }}>
          <div className="card-body">
            <h6 className="mb-3">Profile Information</h6>

            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label small text-muted">Lab Name</label>
                <input
                  type="text"
                  className="form-control"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Lab name"
                />
              </div>
              <div className="col-md-6">
                <label className="form-label small text-muted">Lab ID</label>
                <input
                  type="text"
                  className="form-control"
                  name="lab_unique_id"
                  value={form.lab_unique_id}
                  onChange={handleChange}
                  disabled
                />
              </div>
              <div className="col-md-6">
                <label className="form-label small text-muted">License Number</label>
                <input
                  type="text"
                  className="form-control"
                  name="license_no"
                  value={form.license_no}
                  onChange={handleChange}
                  placeholder="Lab license number"
                />
              </div>
              <div className="col-12">
                <label className="form-label small text-muted">Address</label>
                <input
                  type="text"
                  className="form-control"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Lab address"
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

export default LabSettings;
