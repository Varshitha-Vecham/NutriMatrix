// Welcome page - the first page users see when they visit NutriMatrix
// Styled after reference.jpeg: full-bleed produce background with a centered white card on top.
import { useNavigate } from 'react-router-dom'
import './Welcome.css'

function Welcome() {
  const navigate = useNavigate()

  return (
    <div className="welcome-page">
      {/* Full-bleed background image of fresh produce */}
      <div
        className="welcome-bg-image"
        style={{
          backgroundImage:
            "url('/welcome1.jpeg')"
        }}
      />

      {/* Soft white veil so the card reads cleanly */}
      <div className="welcome-bg-veil" />

      {/* Centered content card */}
      <main className="welcome-card">
        <div className="welcome-logo">
          <span className="logo-icon">🥗</span>
          <span className="logo-text">
            Nutri<span className="logo-accent">Matrix</span>
          </span>
        </div>

        <span className="welcome-tagline">Smart Choices, Healthier You.</span>

        <h1 className="welcome-title">
          Welcome to <br /> NutriMatrix
        </h1>

        <p className="welcome-subtitle">
          Your Smart Companion for Healthy Grocery &amp; Nutrition Management
        </p>

        <button
          className="welcome-cta"
          onClick={() => navigate('/register')}
        >
          Get Started <span className="cta-arrow">→</span>
        </button>

        {/* <div className="welcome-links">
          <a href="#privacy" onClick={(e) => e.preventDefault()}>
            Privacy Policy
          </a>
          <span className="dot">•</span>
          <a href="#terms" onClick={(e) => e.preventDefault()}>
            Terms of Service
          </a>
        </div> */}

        {/* Subtle accent glow at the bottom of the card */}
        <div className="welcome-glow" />
      </main>

      {/* Top-left secondary login link (kept discreet, like the reference) */}
      <button className="welcome-corner-login" onClick={() => navigate('/login')}>
        Login
      </button>
    </div>
  )
}

export default Welcome
