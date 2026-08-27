// ForgotPassword - lets a user set a new password for their local demo account.
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { apiRequest } from '../api.js'
import './ForgotPassword.css'

function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!email || !newPassword || !confirmPassword) {
      setError('Please fill in all the fields.')
      return
    }
    if (!email.includes('@') || !email.includes('.')) {
      setError('Please enter a valid email address.')
      return
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.')
      return
    }

    setLoading(true)
    apiRequest('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, password: newPassword })
    }).then(() => {
      setSuccess('Password updated successfully. Redirecting to login...')
      setTimeout(() => navigate('/login'), 1000)
    }).catch((requestError) => {
      setError(requestError.message)
      setLoading(false)
    })
  }

  return (
    <div className="forgot-page">
      <div className="bg-blob blob-1"></div>
      <div className="bg-blob blob-2"></div>
      <div className="bg-blob blob-3"></div>

      <div className="floating-food f1">&#129361;</div>
      <div className="floating-food f2">&#127822;</div>
      <div className="floating-food f3">&#129365;</div>
      <div className="floating-food f4">&#127815;</div>

      <div className="forgot-wrapper">
        <div className="forgot-side">
          <Link to="/" className="brand-logo">
            <span className="brand-icon">&#129385;</span>
            <span>Nutri<span className="brand-accent">Matrix</span></span>
          </Link>

          <h1 className="side-heading">
            Forgot Your <span className="highlight">Password</span>?
          </h1>
          <p className="side-text">
            Enter the email address tied to your NutriMatrix account and choose a new password.
          </p>

          <div className="side-features">
            <div className="side-feat"><span>&#128274;</span> Create a new secure password</div>
            <div className="side-feat"><span>&#9989;</span> Password updates immediately</div>
            <div className="side-feat"><span>&#128273;</span> Use it on your next login</div>
          </div>
        </div>

        <div className="forgot-card">
          <div className="card-header">
            <div className="card-icon">&#128273;</div>
            <h2>Reset Password</h2>
            <p>Enter your email and choose a new password</p>
          </div>

          {error && <div className="msg msg-error">{error}</div>}
          {success && <div className="msg msg-success">{success}</div>}

          <form onSubmit={handleSubmit} className="forgot-form">
            <div className="input-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrap">
                <span className="input-icon">&#9993;</span>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="new-password">New Password</label>
              <div className="input-wrap">
                <span className="input-icon">&#128274;</span>
                <input
                  id="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                >
                  {showNewPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="confirm-password">Confirm New Password</label>
              <div className="input-wrap">
                <span className="input-icon">&#128273;</span>
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide confirmed password' : 'Show confirmed password'}
                >
                  {showConfirmPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-forgot" disabled={loading}>
              {loading ? <span className="btn-loader"></span> : <>Update Password <span className="btn-arrow">&rarr;</span></>}
            </button>
          </form>

          <p className="back-to-login">
            Remembered your password? <Link to="/login">Back to Login</Link>
          </p>
          <p className="register-link">
            Don't have an account? <Link to="/register">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
