import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../api.js'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import './Profile.css'

const initialProfile = {
  name: '',
  phone: '',
  age: '',
  gender: 'prefer not to say',
  heightCm: '',
  weightKg: '',
  dietType: 'no preference',
  allergies: '',
  foodDislikes: '',
  cuisines: '',
  goals: 'healthy eating',
  monthlyBudget: '',
  priceConscious: true,
  notifications: true,
  expiryReminders: true,
  aiRecommendations: true
}

function Profile() {
  const navigate = useNavigate()
  const [user, setUser] = useState({ name: 'Friend', email: '' })
  const [profile, setProfile] = useState(initialProfile)
  const [savedProfile, setSavedProfile] = useState(initialProfile)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    setError('')
    setMessage('')
    apiRequest('/api/auth/me')
      .then((auth) => {
        setUser(auth.user)
        return Promise.all([auth.user, apiRequest('/api/profile')])
      })
      .then(([authUser, savedProfile]) => {
        const profileDetails = { ...savedProfile.profile }
        delete profileDetails.photoUrl
        delete profileDetails.groceryCategories
        delete profileDetails.brands
        delete profileDetails.profileUserId
        const loadedProfile = { ...initialProfile, ...profileDetails, name: profileDetails.name || authUser.name }
        setProfile(loadedProfile)
        setSavedProfile(loadedProfile)
        setIsEditing(!savedProfile.hasProfile)
      })
      .catch((requestError) => {
        if (requestError.message === 'Not authenticated.') navigate('/login')
        else setError(requestError.message)
      })
      .finally(() => setLoading(false))
  }, [navigate])

  function updateField(event) {
    const { name, value } = event.target
    setProfile((current) => ({ ...current, [name]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    setSaving(true)

    apiRequest('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(profile)
    }).then(() => {
      setMessage('Your profile details were saved successfully.')
      setSavedProfile(profile)
      setIsEditing(false)
    }).catch((requestError) => {
      setError(requestError.message)
    }).finally(() => setSaving(false))
  }

  if (loading) return <div className="profile-loading">Loading your nutrition profile...</div>

  return (
    <div className="profile-page">
      <Navbar />
      <main className="profile-content">
        <section className="profile-intro">
          <span className="section-badge">🌿 Your nutrition blueprint</span>
          <h1>Your profile, <span>your plan.</span></h1>
          <p>
            Help NutriMatrix understand your needs so nutrition analysis, healthier swaps, meal ideas,
            and grocery recommendations fit your life.
          </p>
          <div className="profile-user"><span>{user.name.charAt(0).toUpperCase()}</span><div><strong>{profile.name || user.name}</strong><small>{user.email}</small></div></div>
          {!isEditing && <button type="button" className="profile-edit" onClick={() => { setMessage(''); setError(''); setIsEditing(true) }}>Edit Profile</button>}
        </section>

        <form className="profile-form" onSubmit={handleSubmit}>
          {error && <div className="profile-message error">⚠️ {error}</div>}
          {message && <div className="profile-message success">✅ {message}</div>}

          <section className="profile-section">
            <div className="section-heading"><span className="step-number">01</span><div><h2>Profile information</h2><p>Keep your account details up to date.</p></div></div>
            <div className="field-grid">
              <label>Full name<input name="name" type="text" value={profile.name} onChange={updateField} disabled={!isEditing} required /></label>
              <label>Email address <span className="optional">managed by your account</span><input type="email" value={user.email} disabled /></label>
              <label>Phone number <span className="optional">optional</span><input name="phone" type="tel" value={profile.phone} onChange={updateField} placeholder="e.g. +91 98765 43210" disabled={!isEditing} /></label>
            </div>
          </section>

          <section className="profile-section">
            <div className="section-heading"><span className="step-number">02</span><div><h2>Personal details</h2><p>These details help us tailor nutrition context.</p></div></div>
            <div className="field-grid">
              <label>Age <span className="optional">optional</span><input name="age" type="number" min="13" max="120" value={profile.age} onChange={updateField} placeholder="e.g. 28" disabled={!isEditing} /></label>
              <label>Gender<select name="gender" value={profile.gender} onChange={updateField} disabled={!isEditing}><option>prefer not to say</option><option>female</option><option>male</option><option>non-binary</option></select></label>
              <label>Height <span className="optional">cm</span><input name="heightCm" type="number" min="80" max="250" value={profile.heightCm} onChange={updateField} placeholder="e.g. 170" disabled={!isEditing} /></label>
              <label>Weight <span className="optional">kg</span><input name="weightKg" type="number" min="20" max="400" step="0.1" value={profile.weightKg} onChange={updateField} placeholder="e.g. 65" disabled={!isEditing} /></label>
            </div>
          </section>

          <section className="profile-section">
            <div className="section-heading"><span className="step-number">03</span><div><h2>Nutrition preferences</h2><p>We will use these to filter analysis and healthier alternatives.</p></div></div>
            <div className="field-grid">
              <label>Diet pattern<select name="dietType" value={profile.dietType} onChange={updateField} disabled={!isEditing}><option>no preference</option><option>vegetarian</option><option>vegan</option><option>pescatarian</option><option>keto</option><option>halal</option><option>gluten-free</option></select></label>
              <label>Preferred cuisines <span className="optional">separate with commas</span><input name="cuisines" value={profile.cuisines} onChange={updateField} placeholder="e.g. Indian, Mediterranean" disabled={!isEditing} /></label>
            </div>
            <div className="field-grid single-row"><label>Food allergies <span className="optional">separate with commas</span><textarea name="allergies" value={profile.allergies} onChange={updateField} placeholder="e.g. peanuts, lactose" disabled={!isEditing} /></label><label>Food dislikes <span className="optional">optional</span><textarea name="foodDislikes" value={profile.foodDislikes} onChange={updateField} placeholder="e.g. mushrooms, very spicy food" disabled={!isEditing} /></label></div>
          </section>

          <section className="profile-section">
            <div className="section-heading"><span className="step-number">04</span><div><h2>Health & nutrition goals</h2><p>Choose the main direction for your meal recommendations.</p></div></div>
            <label>Primary goal<select name="goals" value={profile.goals} onChange={updateField} disabled={!isEditing}><option>maintain weight</option><option>weight loss</option><option>weight gain</option><option>healthy eating</option><option>high-protein diet</option><option>low-sugar diet</option></select></label>
          </section>

          <section className="profile-section">
            <div className="section-heading"><span className="step-number">05</span><div><h2>Grocery preferences</h2><p>Make recommendations match your usual shopping and budget.</p></div></div>
            <div className="field-grid">
              <label>Monthly grocery budget <span className="optional">in your local currency</span><input name="monthlyBudget" type="number" min="0" step="0.01" value={profile.monthlyBudget} onChange={updateField} placeholder="e.g. 5000" disabled={!isEditing} /></label>
              <label className="toggle-label"><span>Price-conscious shopping</span><input name="priceConscious" type="checkbox" checked={profile.priceConscious} onChange={(event) => setProfile((current) => ({ ...current, priceConscious: event.target.checked }))} disabled={!isEditing} /><span className="toggle"></span></label>
            </div>
          </section>

          <section className="profile-section">
            <div className="section-heading"><span className="step-number">06</span><div><h2>Account settings</h2><p>Choose which helpful updates NutriMatrix can send you.</p></div></div>
            <div className="settings-list">
              <label className="toggle-label"><span>Notification preferences</span><input name="notifications" type="checkbox" checked={profile.notifications} onChange={(event) => setProfile((current) => ({ ...current, notifications: event.target.checked }))} disabled={!isEditing} /><span className="toggle"></span></label>
              <label className="toggle-label"><span>Expiry reminders</span><input name="expiryReminders" type="checkbox" checked={profile.expiryReminders} onChange={(event) => setProfile((current) => ({ ...current, expiryReminders: event.target.checked }))} disabled={!isEditing} /><span className="toggle"></span></label>
              <label className="toggle-label"><span>AI recommendations</span><input name="aiRecommendations" type="checkbox" checked={profile.aiRecommendations} onChange={(event) => setProfile((current) => ({ ...current, aiRecommendations: event.target.checked }))} disabled={!isEditing} /><span className="toggle"></span></label>
            </div>
            <button type="button" className="settings-link" onClick={() => navigate('/forgot-password')}>Change password →</button>
          </section>

          <div className="profile-actions"><p>These preferences can be updated any time.</p>{isEditing && <div className="profile-action-buttons"><button className="profile-cancel" type="button" onClick={() => { setProfile(savedProfile); setMessage(''); setError(''); setIsEditing(false) }}>Cancel</button><button className="profile-save" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save my profile →'}</button></div>}</div>
        </form>
      </main>
      <Footer />
    </div>
  )
}

export default Profile
