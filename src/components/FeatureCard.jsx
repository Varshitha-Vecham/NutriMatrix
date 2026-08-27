// FeatureCard - reusable card for showing each NutriMatrix feature
import './FeatureCard.css'

function FeatureCard({ icon, title, description, color, accent }) {
  return (
    <div className="feature-card" style={{ '--card-color': color, '--card-accent': accent }}>
      <div className="feature-icon-wrap">
        <span className="feature-icon">{icon}</span>
      </div>
      <h3 className="feature-title">{title}</h3>
      <p className="feature-desc">{description}</p>
      <button className="feature-btn">
        Explore <span className="arrow">→</span>
      </button>
    </div>
  )
}

export default FeatureCard
