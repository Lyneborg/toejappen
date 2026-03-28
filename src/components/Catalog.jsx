import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Catalog({ onAdd, onSelect }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadItems()
  }, [])

  async function loadItems() {
    setLoading(true)
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error) setItems(data || [])
    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>👗 Mit tøj</h1>
        <button onClick={handleLogout} style={styles.logoutBtn}>Log ud</button>
      </div>

      <div style={styles.content}>
        {loading ? (
          <div style={styles.centered}>
            <p style={styles.loadingText}>Henter tøj...</p>
          </div>
        ) : items.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>👗</div>
            <h2 style={styles.emptyTitle}>Ingen tøjstykker endnu</h2>
            <p style={styles.emptyText}>Tryk på + for at tilføje dit første stykke tøj</p>
          </div>
        ) : (
          <div style={styles.grid}>
            {items.map(item => (
              <ItemCard key={item.id} item={item} onClick={() => onSelect(item)} />
            ))}
          </div>
        )}
      </div>

      <button onClick={onAdd} style={styles.fab}>+</button>
    </div>
  )
}

function ItemCard({ item, onClick }) {
  return (
    <div style={styles.card} onClick={onClick}>
      {item.image_url ? (
        <img src={item.image_url} alt={item.type} style={styles.cardImage} />
      ) : (
        <div style={styles.cardPlaceholder}>📷</div>
      )}
      <div style={styles.cardInfo}>
        <p style={styles.cardBrand}>{item.brand}</p>
        <p style={styles.cardType}>{item.type}</p>
        <div style={styles.cardMeta}>
          <span style={styles.cardSize}>{item.size}</span>
          <span style={styles.cardPrice}>{item.price} kr</span>
        </div>
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
  headerTitle: { fontSize: 22, fontWeight: 700, color: '#1a1a2e' },
  logoutBtn: {
    background: 'none',
    border: 'none',
    color: '#888',
    fontSize: 14,
    cursor: 'pointer',
  },
  content: { flex: 1, padding: '16px' },
  centered: { display: 'flex', justifyContent: 'center', padding: 40 },
  loadingText: { color: '#888' },
  empty: {
    textAlign: 'center',
    padding: '60px 20px',
  },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: 600, color: '#333', marginBottom: 8 },
  emptyText: { color: '#888', fontSize: 15 },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
  },
  card: {
    background: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    cursor: 'pointer',
    transition: 'transform 0.15s',
  },
  cardImage: {
    width: '100%',
    aspectRatio: '3/4',
    objectFit: 'cover',
    display: 'block',
  },
  cardPlaceholder: {
    width: '100%',
    aspectRatio: '3/4',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f0f0f0',
    fontSize: 40,
  },
  cardInfo: { padding: '10px 12px 12px' },
  cardBrand: { fontSize: 13, fontWeight: 600, color: '#6366f1', marginBottom: 2 },
  cardType: { fontSize: 15, fontWeight: 500, color: '#222', marginBottom: 6 },
  cardMeta: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cardSize: {
    background: '#f0f0f0',
    borderRadius: 6,
    padding: '2px 8px',
    fontSize: 12,
    color: '#555',
  },
  cardPrice: { fontSize: 15, fontWeight: 700, color: '#1a1a2e' },
  fab: {
    position: 'fixed',
    bottom: 28,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    fontSize: 32,
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(102,126,234,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
  },
}
