// src/components/BookAppointmentForm.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const BookAppointmentForm: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="p-4" style={{ minHeight: '100vh', backgroundColor: '#f5f7ff' }}>
      <button
        className="btn btn-link text-decoration-none mb-3 px-0"
        onClick={() => navigate(-1)}
      >
        ← Back
      </button>

      <h4 className="mb-1">Book Appointment</h4>
      <small className="text-muted">
        This is a temporary page. The booking form will be added here later.
      </small>

      <div
        className="card border-0 shadow-sm mt-4"
        style={{ borderRadius: 24, minHeight: 200 }}
      >
        <div className="card-body d-flex align-items-center justify-content-center text-muted">
          Booking form coming soon…
        </div>
      </div>
    </div>
  );
};

export default BookAppointmentForm;
