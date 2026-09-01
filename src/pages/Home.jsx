// Home page - main dashboard after login
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../api.js'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import FeatureCard from '../components/FeatureCard.jsx'
import './Home.css'

function Home() {
  const navigate = useNavigate()
  const [user, setUser] = useState({ name: 'Friend' })

  // If user is not logged in, send them back to login
  useEffect(() => {
    apiRequest('/api/auth/me').then(({ user: stored }) => {
      setUser(stored)
    }).catch(() => {
      navigate('/login')
    })
  }, [navigate])

  // All five NutriMatrix features
  const features = [
    {
      icon: '📊',
      title: 'Nutrition Analysis',
      description: 'Analyze the nutritional information of grocery products and understand what you eat.',
      color: '#22c55e',
      accent: '#16a34a'
    },
    {
      icon: '🥦',
      title: 'Healthy Alternatives',
      description: 'Get smart suggestions for healthier alternatives to your favourite foods.',
      color: '#10b981',
      accent: '#059669'
    },
    {
      icon: '🛒',
      title: 'Digital Pantry',
      description: 'Track and manage all your grocery items in one smart digital pantry.',
      color: '#f59e0b',
      accent: '#d97706'
    },
    {
      icon: '⏰',
      title: 'Expiry Reminders',
      description: 'Never waste food again. Get timely reminders before items expire.',
      color: '#ef4444',
      accent: '#dc2626'
    },
    {
      icon: '🤖',
      title: 'AI Recommendations',
      description: 'Personalized food and nutrition tips powered by artificial intelligence.',
      color: '#8b5cf6',
      accent: '#7c3aed'
    }
  ]

  // Quick stats shown below the hero

  return (
    <div className="home-page">
      <Navbar />

      {/* HERO section */}
      <section className="hero">
        <div className="hero-container">
          <div className="hero-text">
            <span className="hero-badge">🌱 AI-Powered Nutrition</span>
            <h1 className="hero-title">
              Welcome to <span className="hero-accent">NutriMatrix</span>,
              <br />
              <span className="hero-name">{user.name}!</span>
            </h1>
            <p className="hero-desc">
              Your AI-powered nutrition companion for smarter grocery decisions,
              healthier alternatives and better food choices all in one beautiful dashboard.
            </p>

            <div className="hero-buttons">
              <button
                className="btn-primary"
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Explore Features
              </button>
              <button
                className="btn-secondary"
                onClick={() => navigate('/about')}
              >
                Learn More
              </button>
            </div>
          </div>

          {/* Hero image / illustration */}
          <div className="hero-visual">
            <div className="hero-circle">
              <img
                src="all-items.jpg"
                alt="Healthy bowl of fresh produce"
              />
            </div>

          </div>
        </div>
      </section>
      
      {/* STATS section 
      <section className="stats">
        <div className="stats-container">
          {stats.map((s, i) => (
            <div key={i} className="stat-item">
              <h3>{s.number}</h3>
              <p>{s.label}</p>
            </div>
          ))}
        </div>
      </section>
      */}

      {/* FEATURES section */}
      <section className="features" id="features">
        <div className="section-head">
          <span className="section-badge">✨ Our Features</span>
          <h2>Everything You Need for <span className="accent-text">Smarter Nutrition</span></h2>
          <p>Explore our AI-powered tools designed to make healthy living simple and enjoyable.</p>
        </div>

        <div className="features-grid">
          {features.map((f, i) => (
            <FeatureCard
              key={i}
              icon={f.icon}
              title={f.title}
              description={f.description}
              color={f.color}
              accent={f.accent}
            />
          ))}
        </div>
      </section>

      {/* CTA section */}
      <section className="cta">
        <div className="cta-container">
          <h2>Ready to Start Your <span className="accent-light">Healthy Journey</span>?</h2>
          <p>Join thousands of users making smarter nutrition choices every day with NutriMatrix.</p>
          <button className="btn-primary btn-large" onClick={() => navigate('/products')}>
            Get Started Today 🚀
          </button>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default Home
