// src/components/BookAppointmentModal.tsx - FULLY FIXED & WORKING
import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from 'react-bootstrap';
import axios from 'axios';
import { FaSpinner } from 'react-icons/fa';

// In BookAppointmentModal.tsx - CHANGE Doctor interface:
interface Doctor {
 id: number;
 full_name: string; // Your field
 doctor_unique_id?: string; // Your field 
 specialization?: string; // Your field (not specialty)
}


interface Lab {
 id: number;
 name: string;
}

interface Props {
 show: boolean;
 onClose: () => void;
}


const timeSlots = [
 '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
 '11:00 AM', '11:30 AM', '12:00 PM', '02:00 PM',
 '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM',
 '04:30 PM', '05:00 PM', '05:30 PM', '06:00 PM',
];

const BookAppointmentModal: React.FC<Props> = ({ show, onClose }) => {
 const [type, setType] = useState<'doctor' | 'lab'>('doctor');
 const [doctors, setDoctors] = useState<Doctor[]>([]);
 const [labs, setLabs] = useState<Lab[]>([]);
 const [selectedDoctor, setSelectedDoctor] = useState<number>(0);
 const [selectedLab, setSelectedLab] = useState<number>(0);
 const [selectedDate, setSelectedDate] = useState('');
 const [selectedTime, setSelectedTime] = useState('');
 const [reason, setReason] = useState('');
 const [testsRequired, setTestsRequired] = useState('');
 const [loading, setLoading] = useState(false);
 const [token, setToken] = useState<string | null>(null);

 // FIXED: useCallback for fetchDoctors (stable reference)
const fetchDoctors = useCallback(async (authToken: string | null) => {
 if (!authToken) return;
 try {
 // NEW ENDPOINT
 const res = await axios.get('/api/available-doctors/', {
 headers: { Authorization: `Bearer ${authToken}` },
 });
 setDoctors(res.data);
 } catch (error) {
 console.error('Error fetching doctors:', error);
 }
}, []);

// NEW: Check real availability (optional)
const checkAvailability = useCallback(async () => {
 if (!token || !selectedDoctor || !selectedDate || type !== 'doctor') return;
 
 try {
 const res = await axios.get(
 `/api/appointments/availability/?doctor_id=${selectedDoctor}&date=${selectedDate}`,
 { headers: { Authorization: `Bearer ${token}` } }
 );
 
 // Filter your timeSlots to only show available ones
 // const availableTimes = timeSlots.filter(slot => 
 // res.data.available_slots.some((avail: string) => 
 // avail.includes(slot.split(' ')[0])
 // )
 // );
 
 // Show warning if limited slots
 if (res.data.available_slots.length < 3) {
 alert(`Limited availability: ${res.data.available_slots.length} slots left`);
 }
 } catch (error) {
 console.log('Availability check failed, using default slots');
 }
}, [token, selectedDoctor, selectedDate, type]);


 // FIXED: useCallback for fetchLabs (stable reference)
 const fetchLabs = useCallback(async (authToken: string | null) => {
 if (!authToken) return;
 try {
 const res = await axios.get('/api/labs-available/', {
 headers: { Authorization: `Bearer ${authToken}` },
 });
 setLabs(res.data);
 } catch (error) {
 console.error('Error fetching labs:', error);
 }
 }, []);
 // FIXED: useCallback for resetStateOnClose (stable reference)
 const resetStateOnClose = useCallback(() => {
 setSelectedDoctor(0);
 setSelectedLab(0);
 setSelectedDate('');
 setSelectedTime('');
 setReason('');
 setTestsRequired('');
 setType('doctor');
 setDoctors([]);
 setLabs([]);
 onClose();
 }, [onClose]);

 // FIXED: useCallback for handleSubmit (complete deps)
const handleSubmit = useCallback(async (e: React.FormEvent) => {
 e.preventDefault();
 if (!token || !selectedDate || !selectedTime) {
 alert('Please fill all required fields');
 return;
 }

 setLoading(true);
 try {
 if (type === 'doctor' && selectedDoctor > 0) {
 // NEW ENDPOINT: date_time format
 const dateTimeStr = `${selectedDate}T${selectedTime.split(' ')[0]}:00`;
 
 await axios.post('/api/book-appointment/', {
 doctor: selectedDoctor, // Doctor ID
 date_time: dateTimeStr,
 date: selectedDate,
 time_slot: selectedTime, 
 }, {
 headers: { Authorization: `Bearer ${token}` },
 });
 alert('Doctor appointment booked successfully!');
 } else if (type === 'lab' && selectedLab > 0) {
 // Keep lab booking as-is (your existing flow)
 await axios.post('/api/patient/lab-request/', {
 lab_id: selectedLab,
 date: selectedDate,
 time_slot: selectedTime,
 tests: testsRequired,
 test_name: testsRequired?.trim() || 'General Lab Test',
 }, {
 headers: { Authorization: `Bearer ${token}` },
 });
 alert('Lab appointment request sent successfully!');
 }
 resetStateOnClose();
 } catch (error: any) {
 console.error('Booking error:', error);
 alert(`${error.response?.data?.error || 'Booking failed. Please try again.'}`);
 } finally {
 setLoading(false);
 }
}, [type, selectedDoctor, selectedLab, selectedDate, selectedTime, testsRequired, token, resetStateOnClose]);
; // ALL dependencies included


 // FIXED useEffect - now has stable function references
useEffect(() => {
 if (show) {
 const authToken = localStorage.getItem('token');
 console.log('TOKEN FOUND:', authToken ? 'YES' : 'NO'); // ADD THIS
 setToken(authToken);
 
 if (authToken) {
 console.log('FETCHING DOCTORS WITH TOKEN:', authToken.substring(0, 20) + '...'); // ADD THIS
 fetchDoctors(authToken);
 fetchLabs(authToken);
 } else {
 console.log('NO TOKEN - REDIRECT TO LOGIN'); // ADD THIS
 }
 } else {
 resetStateOnClose();
 }
}, [show, fetchDoctors, fetchLabs, resetStateOnClose]);
 // Stable deps

 // Form validation
 const isFormValid = selectedDate && selectedTime && 
 (type === 'doctor' ? selectedDoctor > 0 : selectedLab > 0);

 return (
 <Modal
 show={show}
 onHide={resetStateOnClose}
 centered
 size="lg"
 dialogClassName="book-appointment-modal"
 backdrop="static"
 keyboard={false}
 >
 <form onSubmit={handleSubmit}>
 <div className="modal-content" style={{ borderRadius: 16 }}>
 <div className="modal-header border-0 pb-0">
 <div>
 <h6 className="mb-1 fw-bold">Book Appointment</h6>
 <small className="text-muted">
 Select a doctor or laboratory and choose your preferred time
 </small>
 </div>
 <button
 type="button"
 className="btn-close"
 aria-label="Close"
 onClick={resetStateOnClose}
 />
 </div>

 <div className="modal-body p-4">
 {/* TYPE TABS */}
 <div className="d-flex mb-4">
 <button
 type="button"
 className={`btn flex-fill fw-semibold p-3 ${
 type === 'doctor' 
 ? 'text-primary border-primary bg-primary-subtle shadow-sm' 
 : 'text-muted border'
 }`}
 style={{
 borderRadius: '12px 0 0 12px',
 border: '2px solid',
 fontSize: '14px',
 }}
 onClick={() => setType('doctor')}
 >
 Doctor
 </button>
 <button
 type="button"
 className={`btn flex-fill fw-semibold p-3 ${
 type === 'lab' 
 ? 'text-purple-600 border-purple-500 bg-purple-50 shadow-sm' 
 : 'text-muted border'
 }`}
 style={{
 borderRadius: '0 12px 12px 0',
 border: '2px solid',
 fontSize: '14px',
 }}
 onClick={() => setType('lab')}
 >
 Laboratory
 </button>
 </div>

 {/* DOCTOR/LAB SELECT */}
 {type === 'doctor' ? (
 <div className="mb-4">
 <label className="form-label fw-semibold small mb-2">Select Doctor</label>
 <select
 className="form-select form-select-lg"
 value={selectedDoctor}
 onChange={(e) => setSelectedDoctor(parseInt(e.target.value))}
 required
 >
 <option value={0}>Loading doctors... ({doctors.length})</option>
 {doctors.map((doctor: any) => ( // 'any' for debug
 <option key={doctor.id} value={doctor.id}>
 {doctor.full_name || doctor.username || `Doctor ${doctor.id}`} 
 {doctor.specialization || doctor.doctor_unique_id || 'N/A'}
 </option>
 ))}
 </select>
 </div>
 ) : (
 <div className="mb-4">
 <label className="form-label fw-semibold small mb-2 d-block">Select Laboratory</label>
 <select
 className="form-select form-select-lg"
 value={selectedLab}
 onChange={(e) => setSelectedLab(parseInt(e.target.value) || 0)}
 required
 >
 <option value={0}>Choose a laboratory ({labs.length} available)</option>
 {labs.map((lab) => (
 <option key={lab.id} value={lab.id}>
 {lab.name}
 </option>
 ))}
 </select>
 </div>
 )}

 {/* DATE + TIME ROW */}
 <div className="row g-3 mb-4">
 <div className="col-md-6">
 <label className="form-label fw-semibold small mb-2">Date</label>
 <input
 type="date"
 className="form-control form-control-lg border-primary"
 value={selectedDate}
 onChange={(e) => setSelectedDate(e.target.value)}
 required
 min={new Date().toISOString().split('T')[0]}
 />
 </div>
 {type === 'doctor' && selectedDoctor > 0 && selectedDate && (
 <button
 type="button"
 className="btn btn-outline-info btn-sm w-100 mb-3"
 onClick={checkAvailability}
 >
Check Real Availability
 </button>
 )}
 <div className="col-md-6">
 <label className="form-label fw-semibold small mb-2">Time Slot</label>
 <div className="d-flex flex-wrap gap-2 p-2 bg-light rounded-3">
 {timeSlots.map((slot) => (
 <button
 key={slot}
 type="button"
 className={`btn btn-sm fw-semibold px-3 py-2 flex-fill transition-all ${
 selectedTime === slot 
 ? 'btn-primary text-white shadow-sm' 
 : 'btn-outline-primary hover-primary'
 }`}
 style={{
 borderRadius: '50px',
 minWidth: '85px',
 fontSize: '13px',
 borderWidth: '2px',
 }}
 onClick={() => setSelectedTime(slot)}
 >
 {slot}
 </button>
 ))}
 </div>
 </div>
 </div>

 {/* REASON / TESTS */}
 {type === 'doctor' ? (
 <div className="mb-4">
 <label className="form-label fw-semibold small mb-2">Reason for Visit</label>
 <textarea
 className="form-control border-primary-subtle"
 rows={3}
 placeholder="Describe your symptoms or reason for consultation..."
 value={reason}
 onChange={(e) => setReason(e.target.value)}
 />
 </div>
 ) : (
 <div className="mb-4">
 <label className="form-label fw-semibold small mb-2">Tests Required</label>
 <input
 type="text"
 className="form-control border-primary-subtle"
 placeholder="Blood Test, X-Ray, CT Scan, etc. (comma separated)"
 value={testsRequired}
 onChange={(e) => setTestsRequired(e.target.value)}
 />
 </div>
 )}
 </div>

 {/* FIXED FOOTER */}
 <div className="modal-footer border-0 bg-light px-4 py-3">
 <button
 type="button"
 className="btn btn-outline-secondary px-5 py-2 fw-semibold shadow-sm"
 onClick={resetStateOnClose}
 disabled={loading}
 >
 Cancel
 </button>
 <button
 type="submit"
 className={`px-5 py-2 fw-bold shadow-sm fs-6 ${isFormValid && !loading ? 'btn-primary' : 'btn-secondary'}`}
 disabled={!isFormValid || loading}
 >
 {loading ? (
 <>
 <FaSpinner className="spin me-2" size={18} />
 Booking...
 </>
 ) : (
 'Book Appointment'
 )}
 </button>
 </div>
 </div>
 </form>
 </Modal>
 );
};

export default BookAppointmentModal;


