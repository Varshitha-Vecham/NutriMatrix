import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import './Scanner.css'

function ScannerPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [scanning, setScanning] = useState(false)
  const [found, setFound] = useState(false)
  const [fileName, setFileName] = useState('')

  function handleUpload(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setScanning(false)
    setFound(true)
  }

  function toggleScanner() {
    setScanning((currentScanning) => {
      if (currentScanning) return false
      setFound(false)
      return true
    })
  }

  return <div className="barcode-page"><Navbar /><main className="barcode-content"><button className="method-back" onClick={() => navigate('/scanner')}>← Back to Scanner</button><span className="method-kicker">Barcode identification</span><h1>Barcode <em>Scanner</em></h1><p>Place a product barcode inside the frame to identify it.</p><div className="barcode-preview"><div className="barcode-frame" /><small>{found ? 'Product identified' : scanning ? 'Scanning...' : 'Camera preview'}</small></div><div className="barcode-actions"><button className={`barcode-action ${scanning ? 'stop-scanner' : ''}`} onClick={toggleScanner}>{scanning ? '■ Stop Scanner' : '◉ Start Scanner'}</button><button className="barcode-action barcode-upload" onClick={() => fileInputRef.current?.click()}>↑ Upload Barcode Image</button><input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleUpload} /></div>{fileName && <p className="barcode-file">Uploaded: {fileName}</p>}{found && <div className="barcode-result"><strong>Barcode image received</strong><span>Product identification is ready for backend/API connection.</span><button onClick={() => navigate('/home#nutrition')}>View Nutrition Analysis →</button></div>}</main></div>
}

export default ScannerPage