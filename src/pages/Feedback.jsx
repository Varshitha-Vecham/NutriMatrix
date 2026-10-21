import { useState } from 'react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { apiRequest } from '../api.js'
import './Feedback.css'

const categories = ['Product Analysis', 'Barcode Scanner','Receipt Scanner', 'Voice Input','Digital Pantry', 'Meal Planner', 'Recipe Generator', 'Nutrition Information', 'Website Design']
const emptyForm = { rating: 0, category: [], experience: '', message: '', email: '' }

export default function Feedback() {
  const [form, setForm] = useState(emptyForm)
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const allCategoriesSelected = form.category.length === categories.length

  const update = ({ target: { name, value } }) => { setForm((current) => ({ ...current, [name]: value })); setError(''); setSuccess(false) }
  const toggleCategory = (category) => { setForm((current) => ({ ...current, category: current.category.includes(category) ? current.category.filter((item) => item !== category) : [...current.category, category] })); setError(''); setSuccess(false) }
  const toggleAllCategories = () => { setForm((current) => ({ ...current, category: current.category.length === categories.length ? [] : [...categories] })); setError(''); setSuccess(false) }

  async function submit(event) {
    event.preventDefault()
    if (!form.rating || !form.category.length || !form.message.trim()) return setError('Please provide a rating, at least one category, and feedback message.')
    setSubmitting(true); setError('')
    try {
      await apiRequest('/api/feedback', { method: 'POST', body: JSON.stringify({ ...form, message: form.message.trim(), email: form.email.trim() }) })
      setForm(emptyForm); setCategoriesOpen(false); setSuccess(true)
    } catch (requestError) { setError(requestError.message || 'We could not submit your feedback.') } finally { setSubmitting(false) }
  }

  return <div className="feedback-page"><Navbar /><main className="feedback-main"><header className="feedback-heading"><h1>We Value Your Feedback</h1><p>Help us improve NutriMatrix by sharing your experience.</p></header>{success && <p className="feedback-success">Thank you for your feedback!</p>}<form className="feedback-form" onSubmit={submit}><fieldset className="feedback-field"><legend>How would you rate your experience? *</legend><div className="feedback-stars">{[1, 2, 3, 4, 5].map((star) => <button key={star} type="button" className={star <= form.rating ? 'feedback-star selected' : 'feedback-star'} aria-label={`${star} stars`} onClick={() => setForm((current) => ({ ...current, rating: star }))}>★</button>)}</div></fieldset><div className="feedback-two-col"><div className="feedback-field"><span>Category *</span><button type="button" className="category-picker-trigger" aria-expanded={categoriesOpen} aria-controls="feedback-category-options" onClick={() => setCategoriesOpen((open) => !open)}>{form.category.length ? `${form.category.length} categor${form.category.length === 1 ? 'y' : 'ies'} selected` : 'Choose categories'}</button></div><label className="feedback-field">Experience<select name="experience" value={form.experience} onChange={update}><option value="">Optional</option>{['Very Good', 'Good', 'Average', 'Poor'].map((item) => <option key={item}>{item}</option>)}</select></label></div>{categoriesOpen && <div id="feedback-category-options" className="category-picker-options"><label className="category-picker-option category-picker-all"><input type="checkbox" checked={allCategoriesSelected} onChange={toggleAllCategories} />All of the above</label>{categories.map((item) => <label key={item} className="category-picker-option"><input type="checkbox" checked={form.category.includes(item)} disabled={allCategoriesSelected} onChange={() => toggleCategory(item)} />{item}</label>)}</div>}<label className="feedback-field">Your feedback *<textarea name="message" value={form.message} onChange={update} maxLength={5000} required /></label><label className="feedback-field">Email address (optional)<input name="email" type="email" value={form.email} onChange={update} maxLength={255} /></label>{error && <p className="feedback-error">{error}</p>}<div className="feedback-actions"><button type="submit" disabled={submitting}>{submitting ? 'Submitting…' : 'Submit Feedback'}</button><button type="button" onClick={() => { setForm(emptyForm); setCategoriesOpen(false); setError(''); setSuccess(false) }}>Clear form</button></div></form></main><Footer /></div>
}
