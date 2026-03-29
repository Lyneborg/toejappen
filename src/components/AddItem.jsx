import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { analyseClothingImage, generateVintedListing } from '../lib/anthropic'

// Tjekker magic bytes  afviser alt der ikke er JPEG, PNG eller WebP
async function validateImageType(file) {
  const buf = await file.slice(0, 12).arrayBuffer()
  const b = new Uint8Array(buf)
  const isJPEG = b[0] === 0xFF && b[1] === 0xD8
  const isPNG  = b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47
  const isWebP = b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
  return isJPEG || isPNG || isWebP
}

// Skalerer og komprimerer til maks 1920px + 2MB JPEG  hurtigere AI og billigere upload
function compressImage(file) {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const MAX = 1920
      let { width, height } = img
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round(height * MAX / width); width = MAX }
        else { width = Math.round(width * MAX / height); height = MAX }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)
      canvas.toBlob(resolve, 'image/jpeg', 0.85)
    }
    img.src = url
  })
}

export default function AddItem({ onBack, onSaved }) {
  const [step, setStep] = useState('foto')
  const [imageFile, setImageFile] = useState(null)      // komprimeret Blob
  const [imagePreview, setImagePreview] = useState(null)
  const [aiData, setAiData] = useState(null)
  const [form, setForm] = useState({ size: '', price: '' })
  const [vintedListing, setVintedListing] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const fileRef = useRef()

  async function handleImageSelect(e) {
    const file = e.target.files[0]
    if (!file) return
    setError('')

    const valid = await validateImageType(file)
    if (!valid) {
      setError('Kun JPEG, PNG og WebP billeder er underst�ttet')
      return
    }

    // Vis preview med det samme
    const reader = new FileReader()
    reader.onload = (ev) => setImagePreview(ev.target.result)
    reader.readAsDataURL(file)

    // Komprimer til brug ved AI-analyse og upload
    const compressed = await compressImage(file)
    setImageFile(compressed)
  }

  async function handleAnalyse() {
    if (!imageFile) return
    setLoading(true)
    setError('')
    try {
      const reader = new FileReader()
      reader.onload = async (ev) => {
        try {
          const base64 = ev.target.result.split(',')[1]
          const data = await analyseClothingImage(base64, 'image/jpeg')
          setAiData(data)
          setStep('detaljer')
        } catch (err) {
          setError('AI-analyse fejlede: ' + err.message)
        }
        setLoading(false)
      }
      reader.readAsDataURL(imageFile)
    } catch (err) {
      setError('AI-analyse fejlede: ' + err.message)
      setLoading(false)
    }
  }

  async function handleGenerateVinted() {
    const priceNum = parseInt(form.price)
    if (!form.size.trim() || form.size.trim().length > 20) {
      setError('Udfyld st�rrelse (maks 20 tegn)')
      return
    }
    if (isNaN(priceNum) || priceNum < 1 || priceNum > 10000) {
      setError('Pris skal v�re mellem 1 og 10.000 kr')
      return
    }
    setLoading(true)
    setError('')
    try {
      const fullItem = { ...aiData, size: form.size.trim(), price: priceNum }
      const listing = await generateVintedListing(fullItem)
      setVintedListing(listing)
      setStep('vinted')
    } catch (err) {
      setError('Kunne ikke generere opslag: ' + err.message)
    }
    setLoading(false)
  }

  async function handleSave() {
    setLoading(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()

      // Altid .jpg  filnavnet er irrelevant for sikkerheden
      const path = `${user.id}/${Date.now()}.jpg`
      const { error: uploadError } = await supabase.storage
        .from('item-images')
        .upload(path, imageFile, { contentType: 'image/jpeg' })
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('item-images')
        .getPublicUrl(path)

      const priceNum = parseInt(form.price)
      const { error: dbError } = await supabase.from('items').insert({
        user_id: user.id,
        image_url: publicUrl,
        brand: aiData.brand,
        type: aiData.type,
        colour: aiData.colour,
        condition: aiData.condition,
        size: form.size.trim(),
        price: priceNum,
        description: aiData.description,
        vinted_listing: vintedListing,
      })
      if (dbError) throw dbError

      onSaved()
    } catch (err) {
      setError('Kunne ikke gemme: ' + err.message)
      setLoading(false)
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(vintedListing)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backBtn}>� Tilbage</button>
        <h1 style={styles.headerTitle}>
          {step === 'foto' && 'Tag et billede'}
          {step === 'analyse' && 'Analyserer...'}
          {step === 'detaljer' && 'Detaljer'}
          {step === 'vinted' && 'Vinted-opslag'}
        </h1>
        <div style={{ width: 60 }} />
      </div>

      <div style={styles.content}>
        {step === 'foto' && (
          <div style={styles.section}>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              onChange={handleImageSelect}
              style={{ display: 'none' }}
            />
            {imagePreview ? (
              <div>
                <img src={imagePreview} alt="Billede" style={styles.preview} />
                <button onClick={() => fileRef.current.click()} style={styles.secondaryBtn}>
                  =� Tag nyt billede
                </button>
                {error && <p style={styles.error}>{error}</p>}
                <button onClick={handleAnalyse} style={styles.primaryBtn} disabled={loading}>
                  {loading ? '� Analyserer...' : '( Analys�r med AI'}
                </button>
              </div>
            ) : (
              <div style={styles.uploadArea} onClick={() => fileRef.current.click()}>
                <div style={styles.uploadIcon}>=�</div>
                <p style={styles.uploadText}>Tryk for at tage billede</p>
                <p style={styles.uploadHint}>eller v�lg fra galleri</p>
              </div>
            )}
            {error && !imagePreview && <p style={styles.error}>{error}</p>}
          </div>
        )}

        {step === 'detaljer' && aiData && (
          <div style={styles.section}>
            {imagePreview && <img src={imagePreview} alt="Billede" style={styles.previewSmall} />}
            <div style={styles.aiBox}>
              <h3 style={styles.aiTitle}>AI har g�ttet:</h3>
              <div style={styles.aiGrid}>
                <AiField label="M�rke" value={aiData.brand} />
                <AiField label="Type" value={aiData.type} />
                <AiField label="Farve" value={aiData.colour} />
                <AiField label="Stand" value={aiData.condition} />
                {aiData.material && <AiField label="Materiale" value={aiData.material} />}
              </div>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>St�rrelse *</label>
              <input
                style={styles.input}
                type="text"
                placeholder="f.eks. S, M, L, 36, 38..."
                maxLength={20}
                value={form.size}
                onChange={e => setForm(f => ({ ...f, size: e.target.value }))}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Pris (kr) *</label>
              <input
                style={styles.input}
                type="number"
                placeholder="f.eks. 150"
                min={1}
                max={10000}
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                inputMode="numeric"
              />
            </div>
            {error && <p style={styles.error}>{error}</p>}
            <button onClick={handleGenerateVinted} style={styles.primaryBtn} disabled={loading}>
              {loading ? '� Genererer opslag...' : ' Lav Vinted-opslag'}
            </button>
          </div>
        )}

        {step === 'vinted' && (
          <div style={styles.section}>
            {imagePreview && <img src={imagePreview} alt="Billede" style={styles.previewSmall} />}
            <div style={styles.listingBox}>
              <h3 style={styles.listingTitle}>Dit Vinted-opslag:</h3>
              <p style={styles.listingText}>{vintedListing}</p>
            </div>
            <button onClick={handleCopy} style={styles.copyBtn}>
              {copied ? ' Kopieret!' : '=� Kopi�r opslag'}
            </button>
            {error && <p style={styles.error}>{error}</p>}
            <button onClick={handleSave} style={styles.primaryBtn} disabled={loading}>
              {loading ? '� Gemmer...' : '=� Gem i katalog'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function AiField({ label, value }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <span style={{ fontSize: 12, color: '#888', display: 'block' }}>{label}</span>
      <span style={{ fontSize: 15, fontWeight: 500, color: '#222' }}>{value}</span>
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', background: '#f7f7f9', display: 'flex', flexDirection: 'column', maxWidth: 600, margin: '0 auto' },
  header: { background: '#fff', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #eee', position: 'sticky', top: 0, zIndex: 10 },
  backBtn: { background: 'none', border: 'none', fontSize: 16, color: '#6366f1', cursor: 'pointer', padding: '4px 8px', fontWeight: 500 },
  headerTitle: { fontSize: 18, fontWeight: 700, color: '#1a1a2e' },
  content: { flex: 1, padding: '20px 16px' },
  section: { display: 'flex', flexDirection: 'column', gap: 16 },
  uploadArea: { border: '2px dashed #d0d0d0', borderRadius: 20, padding: '60px 20px', textAlign: 'center', cursor: 'pointer', background: '#fff' },
  uploadIcon: { fontSize: 56, marginBottom: 12 },
  uploadText: { fontSize: 18, fontWeight: 600, color: '#333', marginBottom: 4 },
  uploadHint: { fontSize: 14, color: '#888' },
  preview: { width: '100%', maxHeight: 340, objectFit: 'cover', borderRadius: 16, display: 'block' },
  previewSmall: { width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 16, display: 'block' },
  aiBox: { background: '#f0f0ff', borderRadius: 16, padding: '16px', border: '1px solid #e0e0ff' },
  aiTitle: { fontSize: 14, fontWeight: 600, color: '#6366f1', marginBottom: 10 },
  aiGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 },
  formGroup: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 14, fontWeight: 600, color: '#444' },
  input: { padding: '14px 16px', borderRadius: 12, border: '1.5px solid #e5e5e5', fontSize: 16, background: '#fff', outline: 'none' },
  primaryBtn: { padding: '16px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 600, cursor: 'pointer' },
  secondaryBtn: { padding: '12px', background: '#f0f0f0', color: '#555', border: 'none', borderRadius: 12, fontSize: 15, cursor: 'pointer' },
  copyBtn: { padding: '14px', background: '#e8f5e9', color: '#2e7d32', border: '1px solid #c8e6c9', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer' },
  listingBox: { background: '#fff', borderRadius: 16, padding: '20px', border: '1px solid #e5e5e5' },
  listingTitle: { fontSize: 14, fontWeight: 600, color: '#888', marginBottom: 10 },
  listingText: { fontSize: 16, lineHeight: 1.6, color: '#222' },
  error: { color: '#e53e3e', fontSize: 14, background: '#fff5f5', padding: '10px 14px', borderRadius: 10 },
}
