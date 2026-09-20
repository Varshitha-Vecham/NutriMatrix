// FeatureCard - reusable card for showing each NutriMatrix feature
import { useNavigate } from 'react-router-dom'
import './FeatureCard.css'

function FeatureCard({ icon, title, description, color, accent }) {
  const navigate = useNavigate()

  const handleExplore = () => {
    if (title === 'Expiry Reminders') {
      navigate('/notifications')
      return
    }

    if (title === 'Digital Pantry') {
      navigate('/digital-pantry')
      return
    }

    if (title === 'Meal Planner' || title === 'Recipe Generator') {
      navigate('/meal-planner')
      return
    }

    navigate('/scanner')
  }

  return (
    <div className="feature-card" style={{ '--card-color': color, '--card-accent': accent }}>
      <div className="feature-icon-wrap">
        <span className="feature-icon">{icon}</span>
      </div>
      <h3 className="feature-title">{title}</h3>
      <p className="feature-desc">{description}</p>
      <button className="feature-btn" onClick={handleExplore}>
        Explore <span className="arrow">→</span>
      </button>
    </div>
  )
}

export default FeatureCard
