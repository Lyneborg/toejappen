import { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.container}>
          <div style={styles.box}>
            <p style={styles.icon}>�</p>
            <h2 style={styles.title}>Noget gik galt</h2>
            <p style={styles.message}>
              {this.state.error?.message || 'Der opstod en uventet fejl.'}
            </p>
            <button
              style={styles.btn}
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              Pr�v igen
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f7f7f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  box: {
    background: '#fff',
    borderRadius: 16,
    padding: '40px 32px',
    textAlign: 'center',
    maxWidth: 360,
    width: '100%',
    boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
  },
  icon: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 20, fontWeight: 700, color: '#1a1a2e', marginBottom: 8 },
  message: { fontSize: 14, color: '#555', marginBottom: 24, lineHeight: 1.5 },
  btn: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
  },
}

export default ErrorBoundary
