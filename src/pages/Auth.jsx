import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { apiRequest } from '../api.js'
import './Auth.css'

const authContent = {
  login: {
    title: <>Welcome <span className="highlight">Back</span>!</>,
    text: 'Log in to continue your journey towards healthier grocery choices and smarter nutrition.',
    features: ['AI-powered nutrition analysis', 'Healthy alternatives at your fingertips', 'Smart expiry reminders'],
    icons: ['🤖', '🥬', '📅']
  },
  register: {
    title: <>Join the <span className="highlight">Nutrition</span> Revolution!</>,
    text: 'Create your free NutriMatrix account and unlock the power of AI-driven grocery management, healthier food choices, and personalized nutrition tips.',
    features: ['Free forever, no credit card needed', 'Smart AI that learns your taste', 'Track your pantry effortlessly', 'Reduce food waste with reminders'],
    icons: ['✅', '✅', '✅', '✅']
  },
  forgot: {
    title: <>Forgot Your <span className="highlight">Password</span>?</>,
    text: 'Enter the email address tied to your NutriMatrix account and choose a new password.',
    features: ['Create a new secure password', 'Password updates immediately', 'Use it on your next login'],
    icons: ['🔒', '✅', '🔑']
  }
}

function Brand() {
  return <Link to="/" className="brand-logo"><span className="brand-icon">🥗</span><span>Nutri<span className="brand-accent">Matrix</span></span></Link>
}

function AuthLayout({ mode, children }) {
  const content = authContent[mode]
  return (
    <div className={`auth-page ${mode}-page`}>
      <div className="bg-blob blob-1" /><div className="bg-blob blob-2" /><div className="bg-blob blob-3" />
      <div className="floating-food f1">🥑</div><div className="floating-food f2">🍎</div><div className="floating-food f3">🥕</div><div className="floating-food f4">🍇</div>
      <div className="auth-wrapper">
        <div className="auth-side">
          <Brand />
          <h1 className="side-heading">{content.title}</h1>
          <p className="side-text">{content.text}</p>
          <div className="side-features">{content.features.map((feature, index) => <div className="side-feat" key={feature}><span>{content.icons[index]}</span>{feature}</div>)}</div>
        </div>
        {children}
      </div>
    </div>
  )
}

function Message({ error, success }) {
  return <>{error && <div className="msg msg-error">⚠️ {error}</div>}{success && <div className="msg msg-success">✅ {success}</div>}</>
}

function PasswordInput({ id, value, onChange, visible, setVisible, placeholder, autoComplete = 'new-password' }) {
  return <div className="input-wrap"><span className="input-icon">🔒</span><input id={id} type={visible ? 'text' : 'password'} placeholder={placeholder} value={value} onChange={onChange} autoComplete={autoComplete} /><button type="button" className="eye-btn" onClick={() => setVisible(!visible)} aria-label={visible ? 'Hide password' : 'Show password'}>{visible ? '🙈' : '👁️'}</button></div>
}

function Login() {
  const navigate = useNavigate(); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [show, setShow] = useState(false); const [error, setError] = useState(''); const [success, setSuccess] = useState(''); const [loading, setLoading] = useState(false)
  function submit(event) {
    event.preventDefault(); setError(''); setSuccess('')
    if (!email || !password) return setError('Please fill in both email and password.')
    if (!email.includes('@')) return setError('Please enter a valid email address.')
    setLoading(true); apiRequest('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }).then(() => { setSuccess('Login successful! Welcome back 🎉'); setTimeout(() => navigate('/home'), 800) }).catch((requestError) => { setError(requestError.message); setLoading(false) })
  }
  return <AuthLayout mode="login"><div className="auth-card"><div className="card-header"><h2>Sign In</h2><p>Enter your details to access your dashboard</p></div><Message error={error} success={success} /><form onSubmit={submit} className="auth-form"><label>Email Address</label><div className="input-wrap"><span className="input-icon">📧</span><input type="email" placeholder="you@example.com" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" /></div><label>Password</label><PasswordInput id="password" value={password} onChange={event => setPassword(event.target.value)} visible={show} setVisible={setShow} placeholder="Enter your password" autoComplete="current-password" /><div className="form-row"><label className="checkbox"><input type="checkbox" /> Remember me</label><Link to="/forgot-password">Forgot password?</Link></div><button className="auth-submit" type="submit" disabled={loading}>{loading ? 'Signing in...' : <>Sign In <span>→</span></>}</button></form><p className="auth-link">Don't have an account? <Link to="/register">Register here</Link></p><p className="auth-link"><Link to="/admin-login">Admin sign in</Link></p></div></AuthLayout>
}

function Register() {
  const navigate = useNavigate(); const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState(''); const [show, setShow] = useState(false); const [showConfirm, setShowConfirm] = useState(false); const [error, setError] = useState(''); const [success, setSuccess] = useState(''); const [loading, setLoading] = useState(false)
  function submit(event) {
    event.preventDefault(); setError(''); setSuccess('')
    if (!name || !email || !password || !confirm) return setError('Please fill in all the fields.')
    if (!email.includes('@') || !email.includes('.')) return setError('Please enter a valid email address.')
    if (password.length < 6) return setError('Password must be at least 6 characters long.')
    if (password !== confirm) return setError('Passwords do not match.')
    setLoading(true); apiRequest('/api/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }).then(() => { setSuccess('Account created successfully! Redirecting to login...'); setTimeout(() => navigate('/login'), 1200) }).catch(requestError => { setError(requestError.message); setLoading(false) })
  }
  return <AuthLayout mode="register"><div className="auth-card"><div className="card-header"><h2>Create Account</h2><p>Start your healthy journey in seconds</p></div><Message error={error} success={success} /><form onSubmit={submit} className="auth-form"><label>Full Name</label><div className="input-wrap"><span className="input-icon">👤</span><input type="text" placeholder="John Doe" value={name} onChange={event => setName(event.target.value)} /></div><label>Email Address</label><div className="input-wrap"><span className="input-icon">📧</span><input type="email" placeholder="you@example.com" value={email} onChange={event => setEmail(event.target.value)} /></div><label>Password</label><PasswordInput id="register-password" value={password} onChange={event => setPassword(event.target.value)} visible={show} setVisible={setShow} placeholder="Create a strong password" /><label>Confirm Password</label><PasswordInput id="confirm-password" value={confirm} onChange={event => setConfirm(event.target.value)} visible={showConfirm} setVisible={setShowConfirm} placeholder="Re-enter your password" /><button className="auth-submit" type="submit" disabled={loading}>{loading ? 'Creating account...' : <>Create Account <span>→</span></>}</button></form><p className="auth-link">Already have an account? <Link to="/login">Login</Link></p></div></AuthLayout>
}

function ForgotPassword() {
  const navigate = useNavigate(); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState(''); const [show, setShow] = useState(false); const [showConfirm, setShowConfirm] = useState(false); const [error, setError] = useState(''); const [success, setSuccess] = useState(''); const [loading, setLoading] = useState(false)
  function submit(event) {
    event.preventDefault(); setError(''); setSuccess('')
    if (!email || !password || !confirm) return setError('Please fill in all the fields.')
    if (!email.includes('@') || !email.includes('.')) return setError('Please enter a valid email address.')
    if (password.length < 6) return setError('New password must be at least 6 characters long.')
    if (password !== confirm) return setError('New passwords do not match.')
    setLoading(true); apiRequest('/api/auth/reset-password', { method: 'POST', body: JSON.stringify({ email, password }) }).then(() => { setSuccess('Password updated successfully. Redirecting to login...'); setTimeout(() => navigate('/login'), 1000) }).catch(requestError => { setError(requestError.message); setLoading(false) })
  }
  return <AuthLayout mode="forgot"><div className="auth-card"><div className="card-header"><h2>Reset Password</h2><p>Enter your email and choose a new password</p></div><Message error={error} success={success} /><form onSubmit={submit} className="auth-form"><label>Email Address</label><div className="input-wrap"><span className="input-icon">📧</span><input type="email" placeholder="you@example.com" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" /></div><label>New Password</label><PasswordInput id="new-password" value={password} onChange={event => setPassword(event.target.value)} visible={show} setVisible={setShow} placeholder="At least 6 characters" /><label>Confirm New Password</label><PasswordInput id="confirm-new-password" value={confirm} onChange={event => setConfirm(event.target.value)} visible={showConfirm} setVisible={setShowConfirm} placeholder="Re-enter your new password" /><button className="auth-submit" type="submit" disabled={loading}>{loading ? 'Updating password...' : <>Update Password <span>→</span></>}</button></form><p className="auth-link">Remembered your password? <Link to="/login">Back to Login</Link></p><p className="auth-link">Don't have an account? <Link to="/register">Register here</Link></p></div></AuthLayout>
}

function AdminLogin() {
  const navigate = useNavigate(); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [show, setShow] = useState(false); const [error, setError] = useState(''); const [loading, setLoading] = useState(false)
  function submit(event) { event.preventDefault(); setError(''); if (!email || !password) return setError('Enter your admin email and password.'); setLoading(true); apiRequest('/api/admin/login', { method: 'POST', body: JSON.stringify({ email, password }) }).then(() => navigate('/admin')).catch(requestError => { setError(requestError.message); setLoading(false) }) }
  return <div className="admin-auth-page"><div className="auth-card admin-card"><Brand /><p className="admin-eyebrow">CONTROL CENTER</p><h1>Admin sign in</h1><p>Manage users and review their nutrition profiles securely.</p>{error && <div className="msg msg-error">⚠️ {error}</div>}<form onSubmit={submit} className="auth-form"><label>Admin email</label><div className="input-wrap"><input type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="username" /></div><label>Password</label><PasswordInput id="admin-password" value={password} onChange={event => setPassword(event.target.value)} visible={show} setVisible={setShow} placeholder="Enter your password" autoComplete="current-password" /><button className="auth-submit" type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign in to dashboard →'}</button></form><p className="auth-link"><Link to="/login">Back to user login</Link></p></div></div>
}

export default function Auth() {
  const path = useLocation().pathname
  if (path === '/register') return <Register />
  if (path === '/forgot-password') return <ForgotPassword />
  if (path === '/admin-login') return <AdminLogin />
  return <Login />
}
