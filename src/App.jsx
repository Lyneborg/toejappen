import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Login from './components/Login'
import Catalog from './components/Catalog'
import AddItem from './components/AddItem'
import ItemDetail from './components/ItemDetail'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('catalog') // 'catalog' | 'add' | 'detail'
  const [selectedItem, setSelectedItem] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div style={styles.centered}>
        <div style={styles.spinner} />
      </div>
    )
  }

  if (!session) {
    return <Login />
  }

  if (view === 'add') {
    return (
      <AddItem
        onBack={() => setView('catalog')}
        onSaved={() => setView('catalog')}
      />
    )
  }

  if (view === 'detail' && selectedItem) {
    return (
      <ItemDetail
        item={selectedItem}
        onBack={() => { setView('catalog'); setSelectedItem(null) }}
        onDeleted={() => { setView('catalog'); setSelectedItem(null) }}
      />
    )
  }

  return (
    <Catalog
      onAdd={() => setView('add')}
      onSelect={(item) => { setSelectedItem(item); setView('detail') }}
    />
  )
}

const styles = {
  centered: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    background: '#f5f5f5',
  },
  spinner: {
    width: 40,
    height: 40,
    border: '3px solid #e0e0e0',
    borderTop: '3px solid #6366f1',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
}
