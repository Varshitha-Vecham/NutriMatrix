import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import './AboutUs.css'

function AboutUs() {
  return (
    <div className="about-page">
      <Navbar />

      <main className="about-page-content">
        <section className="about-hero">
          <span className="section-badge">💚 About NutriMatrix</span>
          <h1>Make Every Choice Count</h1>
          <p>
            NutriMatrix is an AI-powered nutrition and smart grocery management platform
            designed to help people make healthier and more informed food choices.
          </p>
        </section>

        <section className="about-sections">
          <div className="about-card highlight split-layout">
            <div className="about-copy">
              <h2>What We Do</h2>
              <p>
                We combine Artificial Intelligence, nutrition analysis, barcode scanning,
                and digital pantry management to make it easier to understand the food
                products you use every day.
              </p>
              <ul>
                <li>Analyze the nutritional information of food products.</li>
                <li>Identify products using barcode scanning.</li>
                <li>Scan receipts to add purchased products to the digital pantry.</li>
                <li>Track pantry items and their expiry dates.</li>
                <li>Receive reminders before products expire.</li>
                <li>Discover healthier food alternatives.</li>
                <li>Get personalized meal and nutrition recommendations.</li>
                <li>Interact with an AI-powered nutrition assistant.</li>
              </ul>
            </div>

            <div className="about-visual">
              <img src="grocery-list.jpg" alt="Fresh grocery items and vegetables" />
            </div>
          </div>

          <div className="about-card">
            <h2>Our Mission</h2>
            <p>
              Our mission is to make nutrition information simple, accessible, and useful
              in everyday life. NutriMatrix aims to help users understand what they
              consume, reduce food waste, and make better food decisions through
              intelligent technology.
            </p>
          </div>

          <div className="about-card">
            <h2>How NutriMatrix Helps</h2>
            <p>
              Instead of manually checking and remembering information about every grocery
              item, NutriMatrix brings important information together in one platform.
              From product identification to nutrition analysis and expiry tracking, the
              system provides useful insights that support healthier and smarter food
              management.
            </p>
          </div>

          <div className="about-card">
            <h2>Our Vision</h2>
            <p>
              To create a smarter and healthier future where technology helps everyone
              make better food choices, manage their pantry efficiently, and build
              healthier eating habits.
            </p>
          </div>
        </section>

        <section className="about-cta">
          <h2>NutriMatrix</h2>
          <p>Smarter Food Choices , Healthier Living ..!!</p>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default AboutUs
