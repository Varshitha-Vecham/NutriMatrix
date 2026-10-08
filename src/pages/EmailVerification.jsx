import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { apiRequest } from '../api.js'
import './Register.css'
import './EmailVerification.css'

function EmailVerification() {
  const location = useLocation()
  const navigate = useNavigate()
  const [email, setEmail] = useState(location.state?.email || '')
  const [otp, setOtp] = useState('')
  const [codeSent, setCodeSent] = useState(Boolean(location.state?.codeSent))
  const [countdown, setCountdown] = useState(location.state?.resendAfterSeconds || 0)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (countdown <= 0) return undefined
    const timer = window.setTimeout(() => setCountdown((remaining) => Math.max(0, remaining - 1)), 1000)
    return () => window.clearTimeout(timer)
  }, [countdown])

  async function sendCode() {
    const normalizedEmail = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizedEmail)) {
      setError('Please enter a valid email address.')
      return
    }
    setError('')
    setSending(true)
    try {
      const response = await apiRequest('/api/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email: normalizedEmail })
      })
      setEmail(normalizedEmail)
      setCodeSent(true)
      setCountdown(response.resendAfterSeconds || 90)
    } catch (requestError) {
      setError(requestError.message)
      if (requestError.resendAfterSeconds) {
        setCodeSent(true)
        setCountdown(requestError.resendAfterSeconds)
      }
    } finally {
      setSending(false)
    }
  }

  async function verifyCode(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      await apiRequest('/api/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp })
      })
      navigate('/login', { state: { message: 'Email verified successfully. You can now log in.' } })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="register-page">
      <div className="bg-blob blob-1"></div>
      <div className="bg-blob blob-2"></div>
      <div className="bg-blob blob-3"></div>
      <div className="floating-food f1">🥕</div>
      <div className="floating-food f2">🍇</div>
      <div className="floating-food f3">🥬</div>
      <div className="floating-food f4">🍋</div>

      <div className="register-wrapper">
        <div className="register-side">
          <Link to="/" className="brand-logo">
            <span className="brand-icon">🥗</span>
            <span>Nutri<span className="brand-accent">Matrix</span></span>
          </Link>
          <h1 className="side-heading">One last step to your <span className="highlight">healthy journey</span></h1>
          <p className="side-text">Confirm that you can access your email address to activate your NutriMatrix account.</p>
          <div className="side-features">
            <div className="side-feat"><span>🔐</span> Your account stays secure</div>
            <div className="side-feat"><span>📧</span> A private, one-time code</div>
            <div className="side-feat"><span>⏱️</span> Code expires in 2 minutes</div>
          </div>
        </div>

        <div className="register-card verification-card">
          <div className="card-header">
            <h2>Verify Your Email</h2>
            <p>{codeSent ? <>We sent a verification code to <strong>{email}</strong>.</> : 'Request a code to verify your email address.'}</p>
          </div>

          {error && <div className="msg msg-error" role="alert">⚠️ {error}</div>}

          <form onSubmit={verifyCode} className="register-form">
            <div className="input-group">
              <label htmlFor="verification-email">Email Address</label>
              <div className="input-wrap">
                <span className="input-icon">📧</span>
                <input
                  id="verification-email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
            </div>
            <div className="input-group">
              <label htmlFor="verification-code">6-digit verification code</label>
              <div className="input-wrap">
                <span className="input-icon">🔢</span>
                <input
                  id="verification-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  placeholder="Enter your code"
                  value={otp}
                  onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                />
              </div>
            </div>

            {codeSent && <p className="verification-expiry">The code expires 2 minutes after it was sent.</p>}
            <button type="submit" className="btn-register" disabled={loading}>
              {loading ? <span className="btn-loader"></span> : <>Verify Email <span className="btn-arrow">→</span></>}
            </button>
          </form>

          <div className="verification-actions">
            <button type="button" className="verification-resend" onClick={sendCode} disabled={sending || countdown > 0}>
              {sending ? 'Sending code...' : countdown > 0 ? `Resend code in ${countdown}s` : codeSent ? 'Resend verification code' : 'Send verification code'}
            </button>
            <Link to="/register" className="verification-change-email">Go back to change your email</Link>
          </div>
          <p className="login-link">Already verified? <Link to="/login">Back to login</Link></p>
        </div>
      </div>
    </div>
  )
}

export default EmailVerification
