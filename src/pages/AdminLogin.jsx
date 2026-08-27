import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiRequest } from '../api.js'
import './AdminLogin.css'

function AdminLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleSubmit(event) {
    event.preventDefault()
    setError('')
    if (!email || !password) {
      setError('Enter your admin email and password.')
      return
    }

    setLoading(true)
    apiRequest('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }).then(() => navigate('/admin'))
      .catch((requestError) => {
        setError(requestError.message)
        setLoading(false)
      })
  }

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <Link to="/" className="admin-login-brand">🥗 Nutri<span>Matrix</span></Link>
        <div className="admin-login-icon">🔐</div>
        <p className="admin-eyebrow">CONTROL CENTER</p>
        <h1>Admin sign in</h1>
        <p className="admin-login-intro">Manage users and review their nutrition profiles securely.</p>
        {error && <div className="admin-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <label htmlFor="admin-email">Admin email</label>
          <input id="admin-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" />
          <label htmlFor="admin-password">Password</label>
          <div className="admin-password-wrap">
            <input id="admin-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? '🙈' : '👁️'}</button>
          </div>
          <button className="admin-login-submit" type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign in to dashboard →'}</button>
        </form>
        <Link to="/login" className="admin-back-link">Back to user login</Link>
      </section>
    </main>
  )
}

export default AdminLogin
