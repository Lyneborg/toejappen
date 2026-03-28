import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { analyseClothingImage, generateVintedListing } from '../lib/anthropic'

export default function AddItem({ onBack, onSaved }) {
  const [step, setStep] = useState('foto')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [aiData, setAiData] = useState(null)
  const [form, setForm] = useState({ size: '', price: '' })
  const [vintedListing, setVintedListing] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const fileRef = useRef()

  function handleImageSelect(e) {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setImagePreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  async function handleAnalyse() {
    if (!imageFile) return
    setLoading(true)
    setError('')
    try {
      const reader = new FileReader()
      reader.onload = async (ev) => {
        const base64 = ev.target.result.split(',')[1]
        const mimeType = imageFile.type
        const data = await analyseClothingImage(base64, mimeType)
        setAiData(data)
        setStep('detaljer')
        setLoading(false)
      }
      reader.readAsDataURL(imageFile)
    } catch (err) {
      setError('AI-analyse fejlede: ' + err.message)
      setLoading(false)
    }
  }

  async function handleGenerateVinted() {
    if (!form.size || !form.price) {
      setError('Udfyld størrelse og pris')
      return
    }
    setLoading(true)
    setError('')
    try {
      const fullItem = { ...aiData, size: form.size, price: form.price }
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

      const ext = imageFile.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('item-images')
        .upload(path, imageFile)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('item-images')
        .getPublicUrl(path)

      const { error: dbError } = await supabase.from('items').insert({
        user_id: user.id,
        image_url: publicUrl,
        brand: aiData.brand,
        type: aiData.type,
        colour: aiData.colour,
        condition: aiData.condition,
        size: form.size,
        price: parseInt(form.price),
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
        <button onClick={onBack} style={styles.backBtn}>← Tilbage</button>
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
              accept="image/*"
              capture="environment"
              onChange={handleImageSelect}
              style={{ display: 'none' }}
            />

            {imagePreview ? (
              <div>
                <img src={imagePreview} alt="Billede" style={styles.preview} />
                <button onClick={() => fileRef.current.click()} style={styles.secondaryBtn}>
                  📷 Tag nyt billede
                </button>
                {error && <p style={styles.error}>{error}</p>}
                <button
                  onClick={handleAnalyse}
                  style={styles.primaryBtn}
                  disabled={loading}
                >
                  {loading ? '⏳ Analyserer...' : '✨ Analysér med AI'}
                </button>
              </div>
            ) : (
              <div style={styles.uploadArea} onClick={() => fileRef.current.click()}>
                <div style={styles.uploadIcon}>📷</div>
                <p style={styles.uploadText}>Tryk for at tage billede</p>
                <p style={styles.uploadHint}>eller vælg fra galleri</p>
              </div>
            )}
          </div>
        )}

        {step === 'detaljer' && aiData && (
          <div style={styles.section}>
            {imagePreview && (
              <img src={imagePreview} alt="Billede" style={styles.previewSmall} />
            )}

            <div style={styles.aiBox}>
              <h3 style={styles.aiTitle}>AI har gættet:</h3>
              <div style={styles.aiGrid}>
                <AiField label="Mærke" value={aiData.brand} />
                <AiField label="Type" value={aiData.type} />
                <AiField label="Farve" value={aiData.colour} />
                <AiField label="Stand" value={aiData.condition} />
                {aiData.material && <AiField label="Materiale" value={aiData.material} />}
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Størrelse *</label>
              <input
                style={styles.input}
                type="text"
                placeholder="f.eks. S, M, L, 36, 38..."
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
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                inputMode="numeric"
              />
            </div>

            {error && <p style={styles.error}>{error}</p>}

            <button
              onClick={handleGenerateVinted}
              style={styles.primaryBtn}
              disabled={loading}
            >
              {loading ? '⏳ Genererer opslag...' : '✍️ Lav Vinted-opslag'}
            </button>
          </div>
        )}

        {step === 'vinted' && (
          <div style={styles.section}>
            {imagePreview && (
              <img src={imagePreview} alt="Billede" style={styles.previewSmall} />
            )}

            <div style={styles.listingBox}>
              <h3 style={styles.listingTitle}>Dit Vinted-opslag:</h3>
              <p style={styles.listingText}>{vintedListing}</p>
            </div>

            <button onClick={handleCopy} style={styles.copyBtn}>
              {copied ? '✅ Kopieret!' : '📋 Kopiér opslag'}
            </button>

            {error && <p style={styles.error}>{error}</p>}

            <button
              onClick={handleSave}
              style={styles.primaryBtn}
              disabled={loading}
            >
              {loading ? '⏳ Gemmer...' : '💾 Gem i katalog'}
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
  container: {
    minHeight: '100vh',
    background: '#f7f7f9',
    display: 'flex',
    flexDirection: 'column',
    maxWidth: 600,
    margin: '0 auto',
  },
  header: {
    background: '#fff',
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid #eee',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  backBtn: {
    background: 'none',
    border: 'none',
    fontSize: 16,
    color: '#6366f1',
    cursor: 'pointer',
    padding: '4px 8px',
    fontWeight: 500,
  },
  headerTitle: { fontSize: 18, fontWeight: 700, color: '#1a1a2e' },
  content: { flex: 1, padding: '20px 16px' },
  section: { display: 'flex', flexDirection: 'column', gap: 16 },
  uploadArea: {
    border: '2px dashed #d0d0d0',
    borderRadius: 20,
    padding: '60px 20px',
    textAlign: 'center',
    cursor: 'pointer',
    background: '#fff',
  },
  uploadIcon: { fontSize: 56, marginBottom: 12 },
  uploadText: { fontSize: 18, fontWeight: 600, color: '#333', marginBottom: 4 },
  uploadHint: { fontSize: 14, color: '#888' },
  preview: {
    width: '100%',
    maxHeight: 340,
    objectFit: 'cover',
    borderRadius: 16,
    display: 'block',
  },
  previewSmall: {
    width: '100%',
    maxHeight: 200,
    objectFit: 'cover',
    borderRadius: 16,
    display: 'block',
  },
  aiBox: {
    background: '#f0f0ff',
    borderRadius: 16,
    padding: '16px',
    border: '1px solid #e0e0ff',
  },
  aiTitle: { fontSize: 14, fontWeight: 600, color: '#6366f1', marginBottom: 10 },
  aiGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 },
  formGroup: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 14, fontWeight: 600, color: '#444' },
  input: {
    padding: '14px 16px',
    borderRadius: 12,
    border: '1.5px solid #e5e5e5',
    fontSize: 16,
    background: '#fff',
    outline: 'none',
  },
  primaryBtn: {
    padding: '16px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: 14,
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    opacity: 1,
  },
  secondaryBtn: {
    padding: '12px',
    background: '#f0f0f0',
    color: '#555',
    border: 'none',
    borderRadius: 12,
    fontSize: 15,
    cursor: 'pointer',
  },
  copyBtn: {
    padding: '14px',
    background: '#e8f5e9',
    color: '#2e7d32',
    border: '1px solid #c8e6c9',
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
  },
  listingBox: {
    background: '#fff',
    borderRadius: 16,
    padding: '20px',
    border: '1px solid #e5e5e5',
  },
  listingTitle: { fontSize: 14, fontWeight: 600, color: '#888', marginBottom: 10 },
  listingText: { fontSize: 16, lineHeight: 1.6, color: '#222' },
  error: {
    color: '#e53e3e',
    fontSize: 14,
    background: '#fff5f5',
    padding: '10px 14px',
    borderRadius: 10,
  },
}
