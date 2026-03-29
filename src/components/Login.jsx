import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [usePassword, setUsePassword] = useState(false)

  async function handleMagicLink(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    })
    if (error) {
      setError('Kunne ikke sende login-link. Tjek din email og prøv igen.')
    } else {
      setMagicLinkSent(true)
    }
    setLoading(false)
  }

  async function handlePassword(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Forkert email eller adgangskode')
    }
    setLoading(false)
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>👗</div>
        <h1 style={styles.title}>Tøjappen</h1>

        {magicLinkSent ? (
          <div style={styles.successBox}>
            <div style={styles.successIcon}>ðŸ“¬</div>
            <p style={styles.successText}>
              Vi har sendt et login-link til <strong>{email}</strong>.
              Tjek din indbakke og tryk på linket.
            </p>
            <button style={styles.linkButton} onClick={() => { setMagicLinkSent(false); setEmail('') }}>
              Prøv med en anden email
            </button>
          </div>
        ) : usePassword ? (
          <>
            <p style={styles.subtitle}>Log ind med adgangskode</p>
            <form onSubmit={handlePassword} style={styles.form}>
              <input
                style={styles.input}
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
              <input
                style={styles.input}
                type="password"
                placeholder="Adgangskode"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              {error && <p style={styles.error}>{error}</p>}
              <button style={styles.button} type="submit" disabled={loading}>
                {loading ? 'Logger ind...' : 'Log ind'}
              </button>
            </form>
            <button style={styles.linkButton} onClick={() => { setUsePassword(false); setError('') }}>
              â† Send mig et login-link i stedet
            </button>
          </>
        ) : (
          <>
            <p style={styles.subtitle}>Indtast din email, så sender vi dig et login-link</p>
            <form onSubmit={handleMagicLink} style={styles.form}>
              <input
                style={styles.input}
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
              {error && <p style={styles.error}>{error}</p>}
              <button style={styles.button} type="submit" disabled={loading}>
                {loading ? 'Sender...' : 'Send login-link'}
              </button>
            </form>
            <button style={styles.linkButton} onClick={() => { setUsePassword(true); setError('') }}>
              Log ind med adgangskode
            </button>
          </>
        )}
      </div>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: 20,
  },
  card: {
    background: '#fff',
    borderRadius: 20,
    padding: '40px 32px',
    width: '100%',
    maxWidth: 360,
    textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
  },
  logo: { fontSize: 56, marginBottom: 12 },
  title: { fontSize: 28, fontWeight: 700, color: '#1a1a2e', marginBottom: 6 },
  subtitle: { color: '#888', fontSize: 15, marginBottom: 32 },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  input: {
    padding: '14px 16px',
    borderRadius: 12,
    border: '1.5px solid #e5e5e5',
    fontSize: 16,
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  error: {
    color: '#e53e3e',
    fontSize: 14,
    textAlign: 'center',
    background: '#fff5f5',
    padding: '10px',
    borderRadius: 8,
  },
  button: {
    padding: '16px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 8,
  },
  linkButton: {
    background: 'none',
    border: 'none',
    color: '#888',
    fontSize: 14,
    cursor: 'pointer',
    marginTop: 16,
    textDecoration: 'underline',
    padding: 0,
  },
  successBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    padding: '8px 0',
  },
  successIcon: { fontSize: 48 },
  successText: { color: '#444', fontSize: 15, lineHeight: 1.6, margin: 0 },
}
