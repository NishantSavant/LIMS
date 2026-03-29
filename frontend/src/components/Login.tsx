import React, { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import axios from 'axios';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const tokenResponse = await axios.post('/api/token/', {
        username: email,
        password,
      });

      const accessToken: string = tokenResponse.data.access;
      const refreshToken: string = tokenResponse.data.refresh;

      localStorage.setItem('token', accessToken);
      localStorage.setItem('refresh', refreshToken);

      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

      const userResponse = await axios.get('/api/users/me/');
      const realRole = userResponse.data.role;

      let dashboardPath = '/';
      if (realRole === 'patient') dashboardPath = '/patient-dashboard';
      else if (realRole === 'doctor') dashboardPath = '/doctor/dashboard';
      else if (realRole === 'lab_staff' || realRole === 'lab') {
        dashboardPath = '/lab-dashboard';
      }

      window.location.href = dashboardPath;
    } catch (error: any) {
      alert(
        `Login failed: ${
          error.response?.data?.detail || 'Invalid credentials or server error'
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      <div className="login-card">
        <div className="login-left">
          <div className="login-logo">LIMS</div>
          <h2>Welcome back</h2>
          <p>Secure access for patients, doctors, and labs. Your data stays protected and traceable.</p>
          <div className="login-feature">
            <div className="login-dot" />
            <span>Real-time updates and audit trail</span>
          </div>
          <div className="login-feature">
            <div className="login-dot" />
            <span>Role-based access and visibility</span>
          </div>
        </div>
        <div className="login-right">
          <h3>Log in to your workspace</h3>
          <form onSubmit={handleLogin}>
            <div className="login-grid">
              <div>
                <label>Email / Username</label>
                <input
                  type="text"
                  placeholder="Enter your email or username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label>Password</label>
                <div className="signup-input-row">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
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
            </div>

            <button type="submit" className="login-button primary" disabled={loading}>
              {loading ? 'Logging in...' : 'Log in'}
            </button>

            <div className="login-footer">
              Don&apos;t have an account? <a href="/signup">Sign up</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
