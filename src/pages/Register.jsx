// Register page - new users create their account here
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { apiRequest } from '../api.js'
import './Register.css'

function Register() {
  const navigate = useNavigate()

  // form data
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  // password rules
  function passwordRules(pwd) {
    return {
      length: pwd.length >= 6,
      upper: /[A-Z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      special: /[^A-Za-z0-9]/.test(pwd)
    }
  }
  const rules = passwordRules(password)

  // handle submit
  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    // validation
    if (!name || !email || !password || !confirm) {
      setError('Please fill in all the fields.')
      return
    }
    if (!email.includes('@') || !email.includes('.')) {
      setError('Please enter a valid email address.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    }).then(() => {
      setSuccess('Account created successfully! Redirecting to login...')
      setTimeout(() => navigate('/login'), 1200)
    }).catch((requestError) => {
      setError(requestError.message)
      setLoading(false)
    })
  }

  return (
    <div className="register-page">
      {/* Decorative background */}
      <div className="bg-blob blob-1"></div>
      <div className="bg-blob blob-2"></div>
      <div className="bg-blob blob-3"></div>

      <div className="floating-food f1">🥕</div>
      <div className="floating-food f2">🍇</div>
      <div className="floating-food f3">🥬</div>
      <div className="floating-food f4">🍋</div>

      <div className="register-wrapper">
        {/* Left - brand area */}
        <div className="register-side">
          <Link to="/" className="brand-logo">
            <span className="brand-icon">🥗</span>
            <span>Nutri<span className="brand-accent">Matrix</span></span>
          </Link>

          <h1 className="side-heading">
            Join the <span className="highlight">Nutrition</span> Revolution!
          </h1>
          <p className="side-text">
            Create your free NutriMatrix account and unlock the power of AI-driven grocery management,
            healthier food choices, and personalized nutrition tips.
          </p>

          <div className="side-features">
            <div className="side-feat"><span>✅</span> Free forever, no credit card needed</div>
            <div className="side-feat"><span>✅</span> Smart AI that learns your taste</div>
            <div className="side-feat"><span>✅</span> Track your pantry effortlessly</div>
            <div className="side-feat"><span>✅</span> Reduce food waste with reminders</div>
          </div>
        </div>

        {/* Right - registration card */}
        <div className="register-card">
          <div className="card-header">
            <h2>Create Account</h2>
            <p>Start your healthy journey in seconds</p>
          </div>

          {/* Messages */}
          {error && <div className="msg msg-error">⚠️ {error}</div>}
          {success && <div className="msg msg-success">✅ {success}</div>}

          <form onSubmit={handleSubmit} className="register-form">
            {/* Full Name */}
            <div className="input-group">
              <label htmlFor="name">Full Name</label>
              <div className="input-wrap">
                <span className="input-icon">👤</span>
                <input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

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
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button type="button" className="eye-btn" onClick={() => setShowPwd(!showPwd)}>
                  {showPwd ? '🙈' : '👁️'}
                </button>
              </div>

              {/* Password strength hints */}
              {password && (
                <div className="pwd-rules">
                  <span className={rules.length ? 'rule ok' : 'rule'}>✓ 6+ characters</span>
                  <span className={rules.upper ? 'rule ok' : 'rule'}>✓ Uppercase letter</span>
                  <span className={rules.number ? 'rule ok' : 'rule'}>✓ Number</span>
                  <span className={rules.special ? 'rule ok' : 'rule'}>✓ Special character</span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="input-group">
              <label htmlFor="confirm">Confirm Password</label>
              <div className="input-wrap">
                <span className="input-icon">🔐</span>
                <input
                  id="confirm"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
                <button type="button" className="eye-btn" onClick={() => setShowConfirm(!showConfirm)}>
                  {showConfirm ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <button type="submit" className="btn-register" disabled={loading}>
              {loading ? (
                <span className="btn-loader"></span>
              ) : (
                <>Create Account <span className="btn-arrow">→</span></>
              )}
            </button>
          </form>

          <p className="login-link">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register