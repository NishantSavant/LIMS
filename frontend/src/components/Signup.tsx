import React, { useMemo, useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import axios from 'axios';

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const genders = ['male', 'female', 'other'];

const Signup: React.FC = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: name + auth
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Step 2: role + phone + otp
  const [role, setRole] = useState('');
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);

  // Step 3: role specific
  const [address, setAddress] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [gender, setGender] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [abhaAddress, setAbhaAddress] = useState('');

  const [specialization, setSpecialization] = useState('');
  const [registrationNo, setRegistrationNo] = useState('');

  const [labName, setLabName] = useState('');
  const [labAddress, setLabAddress] = useState('');
  const [labLicenseNo, setLabLicenseNo] = useState('');

  const fullName = useMemo(() => [firstName, middleName, lastName].filter(Boolean).join(' '), [firstName, middleName, lastName]);

  const sendOtp = () => {
    if (!phone || phone.length < 8) {
      alert('Enter a valid phone number');
      return;
    }
    const generated = String(Math.floor(100000 + Math.random() * 900000));
    setOtpCode(generated);
    setOtpSent(true);
    setOtpVerified(false);
    alert('OTP sent (demo mode).');
  };

  const verifyOtp = () => {
    if (!otpSent) return;
    if (otpInput === otpCode) {
      setOtpVerified(true);
      alert('OTP verified');
    } else {
      alert('Invalid OTP');
    }
  };

  const goNext = () => {
    if (step === 1) {
      if (!firstName || !lastName || !email || !password || !confirmPassword) {
        alert('Please complete all required fields');
        return;
      }
      if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!role || !phone) {
        alert('Select role and phone number');
        return;
      }
      if (!otpVerified) {
        alert('Verify OTP before continuing');
        return;
      }
      setStep(3);
      return;
    }
  };

  const goBack = () => {
    setStep((s) => Math.max(1, s - 1));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otpVerified) {
      alert('Verify OTP before creating account');
      return;
    }

    setLoading(true);
    try {
      const payload: Record<string, any> = {
        username: email,
        email,
        role,
        first_name: firstName,
        middle_name: middleName,
        last_name: lastName,
        password,
        phone,
      };

      if (role === 'patient') {
        payload.address = address;
        payload.blood_group = bloodGroup;
        payload.emergency_contact = emergencyContact;
        payload.gender = gender;
        payload.date_of_birth = dateOfBirth || null;
        payload.abha_address = abhaAddress;
      }

      if (role === 'doctor') {
        payload.specialization = specialization;
        payload.registration_no = registrationNo;
        payload.address = address;
        payload.blood_group = bloodGroup;
        payload.emergency_contact = emergencyContact;
        payload.gender = gender;
        payload.date_of_birth = dateOfBirth || null;
      }

      if (role === 'lab') {
        payload.lab_name = labName || fullName;
        payload.lab_address = labAddress;
        payload.lab_license_no = labLicenseNo;
      }

      await axios.post('/api/register/', payload);
      alert('Account created! You can now log in.');
      window.location.href = '/login';
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Signup failed. Check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-root">
      <div className="signup-card">
        <div className="signup-left">
          <div className="signup-logo">LIMS</div>
          <h2>Clinically designed onboarding</h2>
          <p>
            Create your account in three quick steps. Every role gets a tailored setup
            so your data is stored correctly from day one.
          </p>
          <div className="signup-steps">
            <div className={`signup-step ${step >= 1 ? 'active' : ''}`}>1. Identity</div>
            <div className={`signup-step ${step >= 2 ? 'active' : ''}`}>2. Role + OTP</div>
            <div className={`signup-step ${step >= 3 ? 'active' : ''}`}>3. Profile</div>
          </div>
        </div>

        <div className="signup-right">
          <form onSubmit={handleSignup}>
            {step === 1 && (
              <>
                <h3>Start with your identity</h3>
                <div className="signup-grid">
                  <div>
                    <label>First name</label>
                    <input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                  </div>
                  <div>
                    <label>Middle name</label>
                    <input value={middleName} onChange={(e) => setMiddleName(e.target.value)} />
                  </div>
                  <div>
                    <label>Last name</label>
                    <input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                  </div>
                  <div>
                    <label>Email</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div>
                    <label>Password</label>
                    <div className="signup-input-row">
                      <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required />
                      <button
                        type="button"
                        className="signup-eye"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label>Confirm password</label>
                    <div className="signup-input-row">
                      <input type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                      <button
                        type="button"
                        className="signup-eye"
                        onClick={() => setShowConfirmPassword((v) => !v)}
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h3>Choose your role</h3>
                <div className="signup-grid">
                  <div>
                    <label>Role</label>
                    <select value={role} onChange={(e) => setRole(e.target.value)} required>
                      <option value="">Select role</option>
                      <option value="patient">Patient</option>
                      <option value="doctor">Doctor</option>
                      <option value="lab">Lab Staff</option>
                    </select>
                  </div>
                  <div>
                    <label>Phone number</label>
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} required />
                  </div>
                </div>

                <div className="signup-otp">
                  <button type="button" className="signup-button ghost" onClick={sendOtp}>Send OTP</button>
                  <div className="signup-otp-row">
                    <input placeholder="Enter OTP" value={otpInput} onChange={(e) => setOtpInput(e.target.value)} />
                    <button type="button" className="signup-button subtle" onClick={verifyOtp}>Verify</button>
                  </div>
                  {otpSent && (
                    <div className="signup-otp-hint">Demo OTP: {otpCode}</div>
                  )}
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h3>Complete your profile</h3>

                {role === 'patient' && (
                  <div className="signup-grid">
                    <div>
                      <label>Address</label>
                      <input value={address} onChange={(e) => setAddress(e.target.value)} />
                    </div>
                    <div>
                      <label>Blood group</label>
                      <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)}>
                        <option value="">Select</option>
                        {bloodGroups.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
                      </select>
                    </div>
                    <div>
                      <label>Emergency contact</label>
                      <input value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} />
                    </div>
                    <div>
                      <label>Gender</label>
                      <select value={gender} onChange={(e) => setGender(e.target.value)}>
                        <option value="">Select</option>
                        {genders.map((g) => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div>
                      <label>Date of birth</label>
                      <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
                    </div>
                    <div>
                      <label>ABHA address</label>
                      <input value={abhaAddress} onChange={(e) => setAbhaAddress(e.target.value)} />
                    </div>
                  </div>
                )}

                {role === 'doctor' && (
                  <div className="signup-grid">
                    <div>
                      <label>Address</label>
                      <input value={address} onChange={(e) => setAddress(e.target.value)} />
                    </div>
                    <div>
                      <label>Blood group</label>
                      <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)}>
                        <option value="">Select</option>
                        {bloodGroups.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
                      </select>
                    </div>
                    <div>
                      <label>Emergency contact</label>
                      <input value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} />
                    </div>
                    <div>
                      <label>Gender</label>
                      <select value={gender} onChange={(e) => setGender(e.target.value)}>
                        <option value="">Select</option>
                        {genders.map((g) => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div>
                      <label>Date of birth</label>
                      <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
                    </div>
                    <div>
                      <label>Specialization</label>
                      <input value={specialization} onChange={(e) => setSpecialization(e.target.value)} />
                    </div>
                    <div>
                      <label>Registration number</label>
                      <input value={registrationNo} onChange={(e) => setRegistrationNo(e.target.value)} />
                    </div>
                  </div>
                )}

                {role === 'lab' && (
                  <div className="signup-grid">
                    <div>
                      <label>Lab name</label>
                      <input value={labName} onChange={(e) => setLabName(e.target.value)} />
                    </div>
                    <div>
                      <label>Lab address</label>
                      <input value={labAddress} onChange={(e) => setLabAddress(e.target.value)} />
                    </div>
                    <div>
                      <label>License number</label>
                      <input value={labLicenseNo} onChange={(e) => setLabLicenseNo(e.target.value)} />
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="signup-actions">
              {step > 1 && (
                <button type="button" className="signup-button ghost" onClick={goBack}>Back</button>
              )}
              {step < 3 && (
                <button type="button" className="signup-button primary" onClick={goNext}>Next</button>
              )}
              {step === 3 && (
                <button type="submit" className="signup-button primary" disabled={loading}>
                  {loading ? 'Creating...' : 'Create account'}
                </button>
              )}
            </div>

            <div className="signup-footer">
              Already have an account? <a href="/login">Log in</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;
