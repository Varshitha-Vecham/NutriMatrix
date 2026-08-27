# 🥗 NutriMatrix - AI-Powered Nutrition Companion

A colorful, modern React.js web application that helps users make smarter grocery decisions, find healthier alternatives, and get AI-based nutrition recommendations.

## ✨ Features

- 🎨 **Beautiful UI** - Fresh green theme with glassmorphism, gradients & animations
- 🔐 **Complete Auth Flow** - Welcome → Register → Login → Home → Logout
- 💾 **MySQL** - Accounts are stored securely in a MySQL database
- 👁️ **Password Visibility** - Eye icons on all password fields
- 📱 **Fully Responsive** - Works on desktop, tablet, and mobile
- 🤖 **AI-Themed** - 5 feature cards: Nutrition Analysis, Healthy Alternatives, Digital Pantry, Expiry Reminders, AI Recommendations

## 🚀 How to Run

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create the database**
   ```bash
   mysql -u root -p < server/schema.sql
   ```

3. **Configure the API**
   Copy `.env.example` to `.env` and set your MySQL password and a strong `JWT_SECRET`.

4. **Start the dev servers**
   ```bash
   npm run dev
   ```

3. Open `http://localhost:5173` in your browser.

## 🗂️ Project Structure

```
src/
 ├── components/
 │    ├── Navbar.jsx       # Top nav with logo, links, logout
 │    ├── Footer.jsx       # Bottom footer
 │    └── FeatureCard.jsx  # Reusable feature card
 │
 ├── pages/
 │    ├── Welcome.jsx      # Landing page (/)
 │    ├── Register.jsx     # Create account (/register)
 │    ├── Login.jsx        # Sign in (/login)
 │    └── Home.jsx         # Dashboard (/home)
 │
 ├── App.jsx               # Routes
 ├── main.jsx              # Entry point
 ├── App.css               # App-level styles
 └── index.css             # Global styles
```

## 🎨 Design Palette

- 🟢 Primary Green: #22c55e
- 🌿 Dark Green: #15803d
- 🌱 Light Green: #dcfce7
- 🟡 Yellow Accent: #facc15
- 🟠 Orange Accent: #fb923c
- ⚪ White & soft gradients

## 🔄 User Flow

1. Visit / → See Welcome page with "Get Started" button
2. Click **Get Started** → Goes to /register
3. Fill form → Account is saved in MySQL → Redirect to /login
4. Login with same credentials → Redirect to /home
5. On Home: explore features, use navbar, click **Logout** to clear the session cookie

---

Made with 💚 for healthier living.
