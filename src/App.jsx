// App.jsx - sets up all the routes for NutriMatrix
import { Routes, Route } from 'react-router-dom'
import Welcome from './pages/Welcome.jsx'
import Register from './pages/Register.jsx'
import EmailVerification from './pages/EmailVerification.jsx'
import Login from './pages/Login.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import Home from './pages/Home.jsx'
import AboutUs from './pages/AboutUs.jsx'
import Profile from './pages/Profile.jsx'
import Scanner from './pages/Scanner.jsx'
import ScannerPage from './pages/ScannerPage.jsx'
import ReceiptScanner from './pages/ReceiptScanner.jsx'
import Products from './pages/Products.jsx'
import MealPlanner from './pages/MealPlanner.jsx'
import DigitalPantry from './pages/DigitalPantry.jsx'
import Notifications from './pages/Notifications.jsx'
import AdminLogin from './pages/AdminLogin.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import './App.css'

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<EmailVerification />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/admin-forgot-password" element={<ForgotPassword admin />} />
        <Route path="/home" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/meal-planner" element={<MealPlanner />} />
        <Route path="/digital-pantry" element={<DigitalPantry />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/scanner" element={<Scanner />} />
        <Route path="/barcode-scanner" element={<ScannerPage />} />
        <Route path="/receipt-scanner" element={<ReceiptScanner />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/products" element={<AdminDashboard />} />
        <Route path="/admin/products/add" element={<AdminDashboard />} />
        <Route path="/admin/products/edit" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminDashboard />} />
        <Route path="/admin/prices" element={<AdminDashboard />} />
        <Route path="/admin/profile" element={<AdminDashboard />} />
      </Routes>
    </div>
  )
}

export default App
