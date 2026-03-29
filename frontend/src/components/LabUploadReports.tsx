// src/components/LabUploadReports.tsx
import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { FaSearch, FaUser, FaFileUpload } from 'react-icons/fa';

interface SearchResult {
  id: number;
  full_name: string;
  unique_id: string;
  phone: string;
  type: 'patient' | 'doctor';
}

interface CaseReportRequest {
  id: number;
  case_id: number;
  test_name: string;
  doctor_name: string;
  requested_at: string;
}

const LabUploadReports: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState<SearchResult[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<SearchResult | null>(null);

  const [report_type, setReportType] = useState('');
  const [reportTitle, setReportTitle] = useState('');
  const [reportDate, setReportDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [file, setFile] = useState<File | null>(null);
  const [findings, setFindings] = useState('');
  const [conclusion, setConclusion] = useState('');
  const [critical, setCritical] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sampleId, setSampleId] = useState('');
  const [sampleLookupLoading, setSampleLookupLoading] = useState(false);
  const [sampleLookupError, setSampleLookupError] = useState('');
  const [caseRequests, setCaseRequests] = useState<CaseReportRequest[]>([]);
  const [selectedCaseRequestId, setSelectedCaseRequestId] = useState<number | ''>('');

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

  const handleSelectPatient = (patient: SearchResult) => {
    if (patient.type !== 'patient') return;
    setSelectedPatient(patient);
    setShowResults(false);
    setSearchTerm(`${patient.full_name} (${patient.unique_id})`);
    setSelectedCaseRequestId('');
  };

  const loadCaseRequests = useCallback(async (patientId: number) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await axios.get<CaseReportRequest[]>(
        '/api/lab/patient/case-report-requests/',
        {
          params: { patient_id: patientId },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setCaseRequests(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Failed to load case report requests', error);
      setCaseRequests([]);
    }
  }, []);

  useEffect(() => {
    if (selectedPatient?.id) {
      loadCaseRequests(selectedPatient.id);
    } else {
      setCaseRequests([]);
    }
  }, [selectedPatient, loadCaseRequests]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
  };

  const lookupSample = async () => {
    const idOrBarcode = sampleId.trim();
    if (!idOrBarcode) {
      setSampleLookupError('Enter a sample ID or barcode.');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) return;

    setSampleLookupLoading(true);
    setSampleLookupError('');
    try {
      const payload: Record<string, string> = {};
      if (/^\d+$/.test(idOrBarcode)) {
        payload.sample_id = idOrBarcode;
      } else {
        payload.barcode = idOrBarcode;
      }
      const res = await axios.post('/api/lab/scan-sample/', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const patient = res.data?.patient;
      if (patient?.id) {
        setSelectedPatient({
          id: patient.id,
          full_name: patient.full_name || 'Patient',
          unique_id: patient.patient_unique_id || '',
          phone: '',
          type: 'patient',
        });
        setSearchTerm(`${patient.full_name} (${patient.patient_unique_id})`);
      }
      if (res.data?.sample?.id) {
        setSampleId(String(res.data.sample.id));
      }
    } catch (err: any) {
      setSampleLookupError(err?.response?.data?.error || 'Sample not found.');
    } finally {
      setSampleLookupLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedPatient) {
      alert('Please select a patient first.');
      return;
    }
    if (!sampleId.trim()) {
      alert('Please enter sample ID.');
      return;
    }
    if (!file) {
      alert('Please choose a report file (PDF/JPG/PNG).');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Not authenticated. Please log in again.');
      return;
    }

    const formData = new FormData();
    formData.append('sample_id', sampleId);
    formData.append('patient_id', String(selectedPatient.id));
    if (selectedCaseRequestId) {
      formData.append('case_request_id', String(selectedCaseRequestId));
    }
    formData.append('report_file', file);
    formData.append('report_type', report_type);
    formData.append('report_title', reportTitle);
    formData.append('report_date', reportDate);
    formData.append(
      'results',
      JSON.stringify({
        findings,
        conclusion,
      })
    );
    formData.append('doctor_notes', findings);
    formData.append('is_flagged', critical.toString());

    setUploading(true);
    try {
      const res = await axios.post('/api/lab/upload-report/', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      alert(res.data.message || 'Report uploaded successfully!');

      setSelectedPatient(null);
      setSearchTerm('');
      setSampleId('');
      setSampleLookupError('');
      setFile(null);
      setReportType('');
      setReportTitle('');
      setFindings('');
      setConclusion('');
      setCritical(false);
      setCaseRequests((prev) => prev.filter((r) => r.id !== selectedCaseRequestId));
      setSelectedCaseRequestId('');
    } catch (err: any) {
      console.error('Upload error:', err.response?.data || err.message);
      alert(`Upload failed: ${err.response?.data?.error || 'Server error'}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container-fluid py-4" style={{ minHeight: '100vh', backgroundColor: '#f5f7ff' }}>
      <h4 className="mb-3 fw-bold">Upload Lab Report</h4>

      <div className="row g-3">
        <div className="col-lg-7">
          <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: 18 }}>
            <div className="card-body">
              <h6 className="mb-3 fw-semibold">Select Patient</h6>

              <div className="position-relative">
                <div className="input-group">
                  <span className="input-group-text bg-white border-end-0">
                    <FaSearch />
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0"
                    placeholder="Search patient or doctor by name, ID or phone..."
                    style={{ borderRadius: 999 }}
                    value={searchTerm}
                    onChange={(e) => searchPatients(e.target.value)}
                    autoComplete="off"
                  />
                </div>

                {showResults && (
                  <div
                    className="position-absolute w-100 bg-white shadow-sm mt-1"
                    style={{
                      zIndex: 10,
                      borderRadius: 16,
                      maxHeight: 260,
                      overflowY: 'auto',
                    }}
                  >
                    {loadingSearch && <div className="p-3 text-muted small">Searching...</div>}
                    {!loadingSearch && patients.length === 0 && (
                      <div className="p-3 text-muted small">No patients or doctors found</div>
                    )}
                    {patients.map((p) => (
                      <button
                        key={`${p.type}-${p.id}`}
                        type="button"
                        className="w-100 text-start border-0 bg-white p-3 d-flex align-items-center justify-content-between"
                        style={{ cursor: p.type === 'patient' ? 'pointer' : 'not-allowed' }}
                        onClick={() => handleSelectPatient(p)}
                        disabled={p.type !== 'patient'}
                      >
                        <div className="d-flex align-items-center">
                          <div
                            className="me-3 d-flex align-items-center justify-content-center"
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 12,
                              backgroundColor: '#f4e9ff',
                              color: '#7c3aed',
                            }}
                          >
                            <FaUser />
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{p.full_name}</div>
                            <small className="text-muted">
                              {p.type === 'patient' ? 'Patient' : 'Doctor'} ID: {p.unique_id}
                              {p.phone && ` • ${p.phone}`}
                            </small>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedPatient && (
                <div className="mt-3 small text-muted">
                  Selected: <span className="fw-semibold">{selectedPatient.full_name} ({selectedPatient.unique_id})</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: 18 }}>
            <div className="card-body">
              <h6 className="mb-3 fw-semibold">Report Details</h6>

              <div className="mb-3">
                <label className="form-label small">Report Type</label>
                <select className="form-select" value={report_type} onChange={(e) => setReportType(e.target.value)}>
                  <option value="">Select report type</option>
                  <option value="Blood Test">Blood Test</option>
                  <option value="X-Ray">X-Ray</option>
                  <option value="MRI">MRI</option>
                  <option value="CT Scan">CT Scan</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label small">Report Title</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g., Complete Blood Count"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                />
              </div>

              <div className="mb-0">
                <label className="form-label small">Report Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: 18 }}>
        <div className="card-body">
          <h6 className="mb-3 fw-semibold">Sample ID</h6>
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder="Enter sample ID or barcode"
              value={sampleId}
              onChange={(e) => setSampleId(e.target.value)}
              style={{ borderRadius: 12 }}
            />
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={lookupSample}
              disabled={sampleLookupLoading}
            >
              {sampleLookupLoading ? 'Checking...' : 'Auto-fill'}
            </button>
          </div>
          {sampleLookupError && <small className="text-danger mt-2 d-block">{sampleLookupError}</small>}
          <small className="text-muted mt-2 d-block">Enter a sample ID or barcode to auto-fill the patient.</small>

          <div className="mt-4">
            <h6 className="mb-3 fw-semibold">Doctor Requested Reports (Optional Link)</h6>
            <select
              className="form-select mb-3"
              value={selectedCaseRequestId}
              onChange={(e) => setSelectedCaseRequestId(e.target.value ? Number(e.target.value) : '')}
              disabled={!selectedPatient}
            >
              <option value="">{selectedPatient ? 'Select doctor request (optional)' : 'Select a patient first'}</option>
              {caseRequests.map((req) => (
                <option key={req.id} value={req.id}>
                  {req.test_name} | Dr. {req.doctor_name} | {new Date(req.requested_at).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: 18 }}>
        <div className="card-body">
          <h6 className="mb-3 fw-semibold">Upload Report File</h6>
          <div
            className="d-flex flex-column align-items-center justify-content-center text-center"
            style={{
              border: '2px dashed #e5e7eb',
              borderRadius: 18,
              minHeight: 160,
            }}
          >
            <input
              id="report-file"
              type="file"
              className="d-none"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
            />
            <label htmlFor="report-file" style={{ cursor: 'pointer' }}>
              <FaFileUpload size={32} className="mb-2 text-primary" />
              <div className="fw-semibold mb-1">Click to upload report file</div>
              <small className="text-muted">PDF, JPG, PNG up to 10MB</small>
            </label>
            {file && (
              <div className="mt-2 small text-muted">
                Selected file: <span className="fw-semibold">{file.name}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: 18 }}>
        <div className="card-body">
          <h6 className="mb-3 fw-semibold">Findings & Conclusion (Optional)</h6>

          <div className="mb-3">
            <label className="form-label small">Findings</label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="Enter test findings..."
              value={findings}
              onChange={(e) => setFindings(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="form-label small">Conclusion</label>
            <textarea
              className="form-control"
              rows={2}
              placeholder="Enter conclusion..."
              value={conclusion}
              onChange={(e) => setConclusion(e.target.value)}
            />
          </div>

          <div className="d-flex align-items-center p-3" style={{ borderRadius: 12, backgroundColor: '#fef2f2' }}>
            <div className="me-3 text-danger" style={{ fontSize: 18 }}>
              ⓘ
            </div>
            <div className="flex-grow-1">
              <div className="fw-semibold text-danger mb-1">Mark as Critical</div>
              <small className="text-muted">This will highlight the report for urgent attention.</small>
            </div>
            <div className="form-check form-switch ms-3">
              <input
                className="form-check-input"
                type="checkbox"
                checked={critical}
                onChange={(e) => setCritical(e.target.checked)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="d-flex justify-content-end">
        <button
          className="btn btn-primary px-4 py-2 fw-semibold"
          style={{ borderRadius: 999, backgroundColor: '#8b5cf6', borderColor: '#8b5cf6' }}
          onClick={handleUpload}
          disabled={uploading || !selectedPatient || !sampleId || !file}
        >
          {uploading ? 'Uploading...' : 'Upload Report'}
        </button>
      </div>
    </div>
  );
};

export default LabUploadReports;
