// Login page - lets the user sign in using credentials saved during registration
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { apiRequest } from '../api.js'
import './Login.css'

function Login() {
  const navigate = useNavigate()

  // form data
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  // handle submit
  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    // simple validation
    if (!email || !password) {
      setError('Please fill in both email and password.')
      return
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }

    setLoading(true)

    apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }).then(() => {
      setSuccess('Login successful! Welcome back 🎉')
      setTimeout(() => navigate('/home'), 800)
    }).catch((requestError) => {
      setError(requestError.message)
      setLoading(false)
    })
  }

  return (
    <div className="login-page">
      {/* Background decoration */}
      <div className="bg-blob blob-1"></div>
      <div className="bg-blob blob-2"></div>
      <div className="bg-blob blob-3"></div>

      {/* Floating food emojis */}
      <div className="floating-food f1">🥑</div>
      <div className="floating-food f2">🍎</div>
      <div className="floating-food f3">🥕</div>
      <div className="floating-food f4">🍇</div>

      <div className="login-wrapper">
        {/* Left side - brand area */}
        <div className="login-side">
          <Link to="/" className="brand-logo">
            <span className="brand-icon">🥗</span>
            <span>Nutri<span className="brand-accent">Matrix</span></span>
          </Link>

          <h1 className="side-heading">
            Welcome <span className="highlight">Back</span>!
          </h1>
          <p className="side-text">
            Log in to continue your journey towards healthier grocery choices and smarter nutrition.
          </p>

          <div className="side-features">
            <div className="side-feat">
              <span>🤖</span> AI-powered nutrition analysis
            </div>
            <div className="side-feat">
              <span>🥬</span> Healthy alternatives at your fingertips
            </div>
            <div className="side-feat">
              <span>📅</span> Smart expiry reminders
            </div>
          </div>
        </div>

        {/* Right side - login form */}
        <div className="login-card">
          <div className="card-header">
            <h2>Sign In</h2>
            <p>Enter your details to access your dashboard</p>
          </div>

          {/* Error / Success messages */}
          {error && <div className="msg msg-error">⚠️ {error}</div>}
          {success && <div className="msg msg-success">✅ {success}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            {/* Email */}
            <div className="input-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrap">
                <span className="input-icon">📧</span>
                <input
                  id="email"
                  type="email"
                  placeholder="[EMAIL]"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="input-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrap">
                <span className="input-icon">🔒</span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                {/* Eye icon to toggle password visibility */}
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Remember / Forgot row */}
            <div className="form-row">
              <label className="checkbox">
                <input type="checkbox" /> <span>Remember me</span>
              </label>
              <Link to="/forgot-password" className="forgot">Forgot password?</Link>
            </div>

            {/* Login button */}
            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? (
                <span className="btn-loader"></span>
              ) : (
                <>Sign In <span className="btn-arrow">→</span></>
              )}
            </button>
          </form>

          {/* Register link */}
          <p className="register-link">
            Don't have an account?{' '}
            <Link to="/register">Register here</Link>
          </p>
          <p className="register-link">
            <Link to="/admin-login">Admin sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login