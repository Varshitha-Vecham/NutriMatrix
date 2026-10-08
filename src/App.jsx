// App.jsx - sets up all the routes for NutriMatrix
import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import './App.css'

// Load each screen only when its route is opened.  In particular, this keeps
// the barcode-scanning library out of the initial application bundle.
const Welcome = lazy(() => import('./pages/Welcome.jsx'))
const Register = lazy(() => import('./pages/Register.jsx'))
const EmailVerification = lazy(() => import('./pages/EmailVerification.jsx'))
const Login = lazy(() => import('./pages/Login.jsx'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword.jsx'))
const Home = lazy(() => import('./pages/Home.jsx'))
const AboutUs = lazy(() => import('./pages/AboutUs.jsx'))
const Profile = lazy(() => import('./pages/Profile.jsx'))
const Scanner = lazy(() => import('./pages/Scanner.jsx'))
const ScannerPage = lazy(() => import('./pages/ScannerPage.jsx'))
const ReceiptScanner = lazy(() => import('./pages/ReceiptScanner.jsx'))
const Products = lazy(() => import('./pages/Products.jsx'))
const MealPlanner = lazy(() => import('./pages/MealPlanner.jsx'))
const DigitalPantry = lazy(() => import('./pages/DigitalPantry.jsx'))
const Notifications = lazy(() => import('./pages/Notifications.jsx'))
const AdminLogin = lazy(() => import('./pages/AdminLogin.jsx'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard.jsx'))

function App() {
  return (
    <div className="app">
      <Suspense fallback={null}>
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
      </Suspense>
    </div>
  )
}

export default App
