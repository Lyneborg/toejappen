import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function ItemDetail({ item, onBack, onDeleted }) {
  const [copied, setCopied] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function handleCopy() {
    if (!item.vinted_listing) return
    await navigator.clipboard.writeText(item.vinted_listing)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    setDeleting(true)

    if (item.image_url) {
      const path = item.image_url.split('/item-images/')[1]
      if (path) {
        await supabase.storage.from('item-images').remove([path])
      }
    }

    await supabase.from('items').delete().eq('id', item.id)
    onDeleted()
  }

  const conditionColor = {
    'Næsten ny': '#2e7d32',
    'God': '#1565c0',
    'Brugt': '#e65100',
    'Meget brugt': '#b71c1c',
  }[item.condition] || '#555'

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backBtn}>← Tilbage</button>
        <h1 style={styles.headerTitle}>{item.brand}</h1>
        <button onClick={handleDelete} style={styles.deleteBtn} disabled={deleting}>
          {deleting ? '...' : confirmDelete ? '⚠️ Bekræft' : '🗑️'}
        </button>
      </div>

      {item.image_url && (
        <img src={item.image_url} alt={item.type} style={styles.image} />
      )}

      <div style={styles.content}>
        <div style={styles.infoCard}>
          <h2 style={styles.itemTitle}>{item.brand} — {item.type}</h2>
          <p style={styles.itemColour}>{item.colour}</p>

          <div style={styles.tags}>
            <span style={styles.tag}>Str. {item.size}</span>
            <span style={{ ...styles.tag, color: conditionColor, background: conditionColor + '15' }}>
              {item.condition}
            </span>
            {item.material && <span style={styles.tag}>{item.material}</span>}
          </div>

          <div style={styles.priceRow}>
            <span style={styles.price}>{item.price} kr</span>
          </div>

          {item.description && (
            <p style={styles.description}>{item.description}</p>
          )}
        </div>

        {item.vinted_listing && (
          <div style={styles.listingCard}>
            <h3 style={styles.listingTitle}>Vinted-opslag</h3>
            <p style={styles.listingText}>{item.vinted_listing}</p>
            <button onClick={handleCopy} style={styles.copyBtn}>
              {copied ? '✅ Kopieret!' : '📋 Kopiér opslag'}
            </button>
          </div>
        )}
      </div>
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
  deleteBtn: {
    background: 'none',
    border: 'none',
    fontSize: 20,
    cursor: 'pointer',
    padding: 4,
  },
  image: {
    width: '100%',
    maxHeight: 380,
    objectFit: 'cover',
    display: 'block',
  },
  content: { padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 },
  infoCard: {
    background: '#fff',
    borderRadius: 16,
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  itemTitle: { fontSize: 22, fontWeight: 700, color: '#1a1a2e', marginBottom: 4 },
  itemColour: { fontSize: 15, color: '#666', marginBottom: 12 },
  tags: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  tag: {
    background: '#f0f0f0',
    color: '#555',
    padding: '4px 12px',
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 500,
  },
  priceRow: { marginBottom: 12 },
  price: { fontSize: 28, fontWeight: 800, color: '#1a1a2e' },
  description: { fontSize: 15, color: '#555', lineHeight: 1.6 },
  listingCard: {
    background: '#fff',
    borderRadius: 16,
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  listingTitle: { fontSize: 14, fontWeight: 600, color: '#888', marginBottom: 10 },
  listingText: { fontSize: 15, lineHeight: 1.7, color: '#222', marginBottom: 16 },
  copyBtn: {
    width: '100%',
    padding: '14px',
    background: '#e8f5e9',
    color: '#2e7d32',
    border: '1px solid #c8e6c9',
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
  },
}
