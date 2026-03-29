// src/components/LabCreateSample.tsx
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaVial, FaBarcode, FaPrint, FaSearch, FaUser } from 'react-icons/fa';

interface SearchResult {
  id: number;
  full_name: string;
  unique_id: string;
  phone?: string;
  type: 'patient' | 'doctor';
}

const LabCreateSample: React.FC = () => {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState<SearchResult[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<SearchResult | null>(null);
  const [sampleType, setSampleType] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const searchPatients = useCallback(async (value: string) => {
    const term = value.trim();
    setSearchTerm(value);
    if (!term) {
      setPatients([]);
      setShowResults(false);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    setLoadingSearch(true);
    try {
      const res = await axios.get('/api/lab/patients/search/', {
        params: { q: term },
        headers: { Authorization: `Bearer ${token}` },
      });
      setPatients(res.data);
      setShowResults(true);
    } catch (err) {
      console.error('search error', err);
      setPatients([]);
      setShowResults(false);
    } finally {
      setLoadingSearch(false);
    }
  }, []);

  const handleCreateSample = async () => {
    if (!selectedPatient || !sampleType) {
      alert('Please select a patient and sample type');
      return;
    }

    setLoading(true);
    const token = localStorage.getItem('token');

    try {
      const res = await axios.post(
        '/api/lab/create-sample/',
        {
          patient_id: selectedPatient.id,
          sample_type: sampleType,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setResult(res.data);
      window.open(res.data.print_url, '_blank');
      alert(`Sample Created! Barcode: ${res.data.barcode}`);
    } catch (error: any) {
      alert('Error: ' + (error.response?.data?.error || 'Failed to create sample'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: '#f8fafc' }}>
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex align-items-center mb-3">
            <FaVial size={32} className="me-3 text-success" />
            <div>
              <h2 className="mb-1 fw-bold">Create Sample</h2>
              <small>Search patient → Generate barcode → Print & stick</small>
            </div>
          </div>
        </div>
      </div>

      <div className="row justify-content-center">
        <div className="col-lg-6">
          <div className="card border-0 shadow-lg" style={{ borderRadius: '20px' }}>
            <div className="card-body p-5">
              <div className="mb-4">
                <label className="form-label fw-bold">Select Patient</label>

                <div className="position-relative">
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0">
                      <FaSearch />
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0"
                      placeholder="Search patient or doctor by name, ID or phone..."
                      style={{ borderRadius: '0 12px 12px 0' }}
                      value={searchTerm}
                      onChange={(e) => searchPatients(e.target.value)}
                      autoComplete="off"
                    />
                  </div>

                  {showResults && (
                    <div
                      className="position-absolute w-100 bg-white shadow-lg mt-1"
                      style={{
                        zIndex: 1000,
                        borderRadius: '0 0 12px 12px',
                        maxHeight: 240,
                        overflowY: 'auto',
                        border: '1px solid #e5e7eb',
                      }}
                    >
                      {loadingSearch && <div className="p-3 text-muted small">Searching...</div>}
                      {!loadingSearch && patients.length === 0 && (
                        <div className="p-3 text-muted small">No patients or doctors found</div>
                      )}
                      {patients.map((person) => (
                        <button
                          key={`${person.type}-${person.id}`}
                          type="button"
                          className="w-100 text-start border-0 bg-white p-3 d-flex align-items-center justify-content-between"
                          style={{ cursor: person.type === 'patient' ? 'pointer' : 'not-allowed' }}
                          onClick={() => {
                            if (person.type !== 'patient') return;
                            setSelectedPatient(person);
                            setSearchTerm(`${person.full_name} (${person.unique_id})`);
                            setShowResults(false);
                          }}
                          disabled={person.type !== 'patient'}
                        >
                          <div className="d-flex align-items-center">
                            <div
                              className="me-3 d-flex align-items-center justify-content-center"
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: 12,
                                backgroundColor: '#f4e9ff',
                                color: '#7c3aed',
                              }}
                            >
                              <FaUser />
                            </div>
                            <div>
                              <div style={{ fontWeight: 600 }}>{person.full_name}</div>
                              <small className="text-muted">
                                {person.type === 'patient' ? 'Patient' : 'Doctor'} ID: {person.unique_id}
                                {person.phone && ` • ${person.phone}`}
                              </small>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {selectedPatient && (
                  <div className="mt-3 p-3 bg-light rounded" style={{ borderRadius: '12px' }}>
                    <strong>Selected:</strong> {selectedPatient.full_name}
                    <span className="badge bg-primary ms-2">{selectedPatient.unique_id}</span>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <label className="form-label fw-bold">Sample Type</label>
                <select
                  className="form-select form-select-lg"
                  value={sampleType}
                  onChange={(e) => setSampleType(e.target.value)}
                  style={{ borderRadius: '12px' }}
                >
                  <option value="">Select sample type</option>
                  <option value="Blood">🩸 Blood</option>
                  <option value="Urine">💧 Urine</option>
                  <option value="Stool">💩 Stool</option>
                  <option value="Swab">🦠 Swab/Nasal</option>
                  <option value="Tissue">🧬 Tissue/Biopsy</option>
                </select>
              </div>

              <button
                className="btn w-100 btn-success btn-lg fw-bold py-4"
                onClick={handleCreateSample}
                disabled={!selectedPatient || !sampleType || loading}
                style={{ borderRadius: '16px' }}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Creating Sample...
                  </>
                ) : (
                  <>
                    <FaBarcode className="me-2" />
                    Generate Sample ID + Print Barcode
                  </>
                )}
              </button>

              {result && (
                <div
                  className="mt-4 p-4 bg-gradient text-black text-center rounded-3"
                  style={{
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    borderRadius: '16px',
                  }}
                >
                  <div className="h3 fw-bold mb-2">{result.barcode}</div>
                  <div className="mb-3">{result.patient_name}</div>
                  <div className="small mb-3">Sample ID: {result.sample_id} | Ready for upload</div>
                  <div className="d-flex gap-2 justify-content-center">
                    <button className="btn btn-light btn-sm px-4" onClick={() => window.print()}>
                      <FaPrint /> Print Again
                    </button>
                    <button className="btn btn-outline-light btn-sm px-4" onClick={() => navigate('/lab-dashboard')}>
                      Dashboard
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabCreateSample;
