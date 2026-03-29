// src/components/AddDoctorModal.tsx - Patient searches Doctor ID
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AddDoctorModal: React.FC = () => {
  const [doctorId, setDoctorId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const sendRequest = async () => {
    if (!doctorId || !doctorId.startsWith('D-')) {
      setMessage('❌ Enter valid Doctor ID (D-XXXXXXXX)');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      // Line 32 - FIXED
await axios.post(
  '/api/doctor/patient-request/',
  { doctor_id: doctorId },
  { headers: { Authorization: `Bearer ${token}` } }
);

      
      setMessage('✅ Request sent to doctor!');
      setTimeout(() => navigate('/patient/doctors'), 1500);
    } catch (error: any) {
      setMessage(`❌ ${error.response?.data?.error || 'Doctor not found'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal fade show" style={{ 
      display: 'block', 
      backgroundColor: 'rgba(0,0,0,0.5)' 
    }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '24px' }}>
          <div className="modal-header border-0 pb-2">
            <h5 className="modal-title fw-bold fs-4">Add Doctor</h5>
            <button 
              className="btn-close" 
              onClick={() => navigate('/patient/doctors')}
            />
          </div>
          <div className="modal-body p-4">
            <div className="mb-4">
              <label className="form-label fw-semibold mb-2 d-block">
                Doctor ID
              </label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">D-</span>
                <input
                  type="text"
                  className="form-control form-control-lg border-start-0"
                  placeholder="XXXXXXXX"
                  value={doctorId.replace('D-', '')}
                  onChange={(e) => setDoctorId('D-' + e.target.value.toUpperCase())}
                  style={{ borderRadius: '0 12px 12px 0' }}
                  disabled={loading}
                />
              </div>
              <small className="text-muted mt-1 d-block">
                Enter doctor ID to grant report access (Ask your doctor for ID)
              </small>
            </div>

            {message && (
              <div className={`alert alert-${message.includes('✅') ? 'success' : 'danger'} mb-3`}>
                {message}
              </div>
            )}

            <div className="d-grid gap-2">
              <button
                className="btn btn-success btn-lg fw-semibold py-3"
                onClick={sendRequest}
                disabled={loading || !doctorId}
                style={{ borderRadius: '16px' }}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Sending...
                  </>
                ) : (
                  'Send Access Request'
                )}
              </button>
              <button
                className="btn btn-outline-secondary"
                onClick={() => navigate('/patient/doctors')}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddDoctorModal;
