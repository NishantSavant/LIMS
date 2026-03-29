import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface LabReport {
  id: number;
  report_type?: string | null;
  report_file?: string | null;
  created_at?: string;
  is_flagged?: boolean;
  sample?: number;
  patient_name?: string;
  patient_unique_id?: string;
}

const LabReportsList: React.FC = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<LabReport[]>([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const loadReports = async () => {
      setLoading(true);
      try {
        const res = await axios.get<LabReport[]>('/api/reports/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setReports(Array.isArray(res.data) ? res.data : []);
      } catch {
        setReports([]);
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, [navigate, token]);

  return (
    <div className="container-fluid py-4">
      <div className="mb-3">
        <h3 className="mb-1">All Reports</h3>
        <small className="text-muted">Every report uploaded by the lab appears here.</small>
      </div>

      {loading ? (
        <div className="text-muted">Loading reports...</div>
      ) : reports.length === 0 ? (
        <div className="text-muted">No reports uploaded yet.</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-sm align-middle">
            <thead>
              <tr>
                <th>Report ID</th>
                <th>Patient</th>
                <th>Patient ID</th>
                <th>Sample</th>
                <th>Type</th>
                <th>Uploaded</th>
                <th>File</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id}>
                  <td className="fw-semibold">#{report.id}</td>
                  <td>{report.patient_name || 'Patient'}</td>
                  <td>{report.patient_unique_id || 'N/A'}</td>
                  <td>{report.sample ?? 'N/A'}</td>
                  <td>{report.report_type || 'General'}</td>
                  <td>{report.created_at ? new Date(report.created_at).toLocaleString() : 'N/A'}</td>
                  <td>
                    {report.report_file ? (
                      <a
                        href={`${report.report_file}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View
                      </a>
                    ) : (
                      <span className="text-muted">No file</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LabReportsList;
