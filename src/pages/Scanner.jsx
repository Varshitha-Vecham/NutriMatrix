import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import ManualEntry from './ManualEntry.jsx'
import VoiceInput from './VoiceInput.jsx'
import './Scanner.css'

const methods = [
  { icon: '🧾', title: 'Receipt Scan', description: 'Upload or capture a grocery receipt to identify multiple products at once.', action: 'Scan Receipt →', path: '/receipt-scanner', tone: 'receipt' },
  { icon: '🎤', title: 'Voice Input', description: 'Speak grocery details, review what was detected, and add items to your pantry.', action: 'Use Voice →', tone: 'voice' },
  { icon: '⌨️', title: 'Manual Entry', description: 'Add a product and its details manually.', action: 'Enter Product →', tone: 'manual' }
]

function Scanner() {
  const navigate = useNavigate()
  const [activeMethod, setActiveMethod] = useState(null)
  function chooseMethod(method) { if (method.path) navigate(method.path); else setActiveMethod(method.tone) }
  return <div className="method-page"><Navbar /><main className="method-content">
    <header className="method-header"><div><span className="method-kicker">Product identification <span>•</span> 01</span><h1>Choose your <em>Scanner</em></h1><p>Choose how you want to identify your grocery product.</p></div><button className="method-back" onClick={() => navigate('/home')}>← Back to Home</button></header>
    <section className="platform-section"><div className="platform-mark">✦</div><div><span className="method-kicker">One platform, three ways</span><h2>Identify food on <em>your terms.</em></h2><p>Identify your grocery products using the method that works best for you. Once identified, NutriMatrix can provide product information, nutrition analysis and personalized recommendations.</p></div></section>
    <section className="steps-section"><div className="method-kicker">How it works</div><div className="steps-grid"><div><b>01</b><h3>Choose a Method</h3><p>Select Receipt, Voice or Manual Entry.</p></div><div><b>02</b><h3>Identify Product</h3><p>NutriMatrix identifies the grocery product.</p></div><div><b>03</b><h3>Explore Insights</h3><p>View nutrition information, healthy alternatives and other insights.</p></div></div></section>
    <section className="method-grid">{methods.map((method, index) => <article className={`method-card ${method.tone}`} key={method.title}><div className="method-icon">{method.icon}</div><div className="method-number">0{index + 1}</div><h2>{method.title}</h2><p>{method.description}</p><button onClick={() => chooseMethod(method)}>{method.action}</button></article>)}</section>
  </main>{activeMethod && <div className="method-modal-backdrop" onClick={() => setActiveMethod(null)}><section className={`method-modal ${activeMethod === 'manual' ? 'manual-modal' : 'voice-modal'}`} onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setActiveMethod(null)}>×</button>{activeMethod === 'voice' ? <VoiceInput /> : <ManualEntry />}</section></div>}</div>
}

export default Scanner
