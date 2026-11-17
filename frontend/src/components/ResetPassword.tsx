import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';

const ResetPassword: React.FC = () => {
  const { uid, token } = useParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await axios.post('/api/password-reset/confirm/', { uid, token, password });
      setMessage('Your password has been reset. You can now log in.');
    } catch (requestError: any) {
      setError(requestError.response?.data?.detail || 'This reset link is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root"><div className="login-card"><div className="login-right">
      <h3>Choose a new password</h3>
      {message ? <p className="auth-message">{message}</p> : <form onSubmit={submit}>
        <div className="login-grid"><div><label>New password</label><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></div>
          <div><label>Confirm password</label><input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required /></div></div>
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button type="submit" className="login-button primary" disabled={loading}>{loading ? 'Saving…' : 'Reset password'}</button>
      </form>}
      <div className="login-footer"><Link to="/login">Return to login</Link></div>
    </div></div></div>
  );
};

export default ResetPassword;
