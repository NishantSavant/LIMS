import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post('/api/password-reset/', { email });
      setSubmitted(true);
    } catch (requestError: any) {
      setError(requestError.response?.data?.detail || 'Unable to request a password reset. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      <div className="login-card">
        <div className="login-left">
          <div className="login-logo">LIMS</div>
          <h2>Recover your account</h2>
          <p>Enter the email address associated with your account and we will send a secure reset link.</p>
        </div>
        <div className="login-right">
          <h3>Reset your password</h3>
          {submitted ? (
            <p className="auth-message">If an account uses that email address, a password-reset link has been sent.</p>
          ) : (
            <form onSubmit={submit}>
              <div className="login-grid">
                <div>
                  <label>Email address</label>
                  <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
                </div>
              </div>
              {error && <p className="auth-error" role="alert">{error}</p>}
              <button type="submit" className="login-button primary" disabled={loading}>
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
          )}
          <div className="login-footer"><Link to="/login">Return to login</Link></div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
