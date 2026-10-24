// Footer - simple, colorful footer for NutriMatrix
import { Link } from 'react-router-dom'
import './Footer.css'

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-brand">
          <h3>🥗 Nutri<span className="footer-accent">Matrix</span></h3>
          <p>Your AI-powered nutrition companion for smarter grocery decisions.</p>
        </div>

        <div className="footer-links">
          <h4>Quick Links</h4>
          <ul>
            <li><Link to="/home">Home</Link></li>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/Scanner">Scanner</Link></li>
            <li><Link to="/digital-pantry">Digital Pantry</Link></li>
            <li><Link to="/meal-planner">Meal Planner</Link></li>
            <li><Link to="/Products">Product Analysis</Link></li>
            <li><Link to="/recipe-generator">Recipe Generator</Link></li>
            <li><Link to="/Feedback">Feedback</Link></li>
            <li><Link to="/Profile">Profile</Link></li>
          </ul>
        </div>

        <div className="footer-contact">
          <h4>Stay Healthy</h4>
          <p>📧 nutrimatrix286@gmail.com</p>
          <p>🌱 Eat smart. Live better.</p>
          <div className="social-icons">
            <span>📘</span><span>📷</span><span>🐦</span><span>▶️</span>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        © {new Date().getFullYear()} NutriMatrix · Made with 💚 for healthier living
      </div>
    </footer>
  )
}

export default Footer
