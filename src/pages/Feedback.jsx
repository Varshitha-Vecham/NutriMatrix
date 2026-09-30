import { useState } from 'react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { apiRequest } from '../api.js'
import './Feedback.css'

const categories = ['Product Analysis', 'Barcode Scanner', 'Digital Pantry', 'Meal Planner', 'Recipe Recommendations', 'Nutrition Information', 'Website Design', 'Other']
const experiences = ['Very Good', 'Good', 'Average', 'Poor']
const emptyForm = { rating: 0, category: '', experience: '', message: '', email: '' }

function Feedback() {
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  function update(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setError('')
    setSuccess(false)
  }

  function resetForm() {
    setForm(emptyForm)
    setError('')
    setSuccess(false)
  }

  async function submit(event) {
    event.preventDefault()
    setError('')
    setSuccess(false)
    if (!form.rating) return setError('Please choose a star rating before submitting.')
    if (!form.category) return setError('Please select the area your feedback is about.')
    if (!form.message.trim()) return setError('Please tell us a little about your experience.')

    setSubmitting(true)
    try {
      await apiRequest('/api/feedback', { method: 'POST', body: JSON.stringify({ ...form, message: form.message.trim(), email: form.email.trim() }) })
      setForm(emptyForm)
      setSuccess(true)
    } catch (requestError) {
      setError(requestError.message || 'We could not submit your feedback. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return <div className="feedback-page"><Navbar /><main className="feedback-main">
    <header className="feedback-heading"><span className="feedback-kicker">A better NutriMatrix starts with you</span><h1>We Value Your <em>Feedback</em></h1><p>Help us improve NutriMatrix by sharing your experience.</p></header>
    {success && <div className="feedback-success" role="status"><span className="feedback-success-icon">✓</span><div><strong>Thank you for your feedback! 💚</strong><p>Your feedback helps us make NutriMatrix better.</p></div></div>}
    <form className="feedback-form" onSubmit={submit} noValidate>
      <section className="feedback-field feedback-rating"><div className="feedback-label">How would you rate your experience? <span aria-hidden="true">*</span></div><div className="feedback-stars" role="group" aria-label="Star rating">{[1, 2, 3, 4, 5].map((star) => <button key={star} type="button" className={star <= form.rating ? 'feedback-star selected' : 'feedback-star'} aria-label={`${star} star${star === 1 ? '' : 's'}`} aria-pressed={form.rating === star} onClick={() => { setForm((current) => ({ ...current, rating: star })); setError(''); setSuccess(false) }}>★</button>)}</div><small>{form.rating ? `${form.rating} out of 5` : 'Select a star rating'}</small></section>
      <div className="feedback-two-col">
        <label className="feedback-field"><span className="feedback-label">Feedback category <span aria-hidden="true">*</span></span><select name="category" value={form.category} onChange={update} required><option value="">Choose a category</option>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
        <label className="feedback-field"><span className="feedback-label">How was your experience?</span><select name="experience" value={form.experience} onChange={update}><option value="">Choose an option (optional)</option>{experiences.map((experience) => <option key={experience}>{experience}</option>)}</select></label>
      </div>
      <label className="feedback-field"><span className="feedback-label">Your feedback <span aria-hidden="true">*</span></span><textarea name="message" value={form.message} onChange={update} maxLength={5000} rows={6} placeholder="Tell us what you liked or what we can improve..." required /><small className="feedback-character-count">{form.message.length}/5000</small></label>
      <label className="feedback-field"><span className="feedback-label">Email address <span className="feedback-optional">Optional</span></span><input name="email" type="email" value={form.email} onChange={update} maxLength={255} placeholder="you@example.com" /></label>
      {error && <p className="feedback-error" role="alert">{error}</p>}
      <div className="feedback-actions"><button className="feedback-submit" type="submit" disabled={submitting}>{submitting ? 'Submitting…' : 'Submit Feedback'} <span aria-hidden="true">→</span></button><button className="feedback-reset" type="button" onClick={resetForm} disabled={submitting}>Clear form</button></div>
      <p className="feedback-privacy">Your feedback is saved securely and can only be reviewed by the NutriMatrix team.</p>
    </form>
  </main><Footer /></div>
}

export default Feedback
