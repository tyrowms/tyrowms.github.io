import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f0f4f8', fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif" }}>
          <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,.08)', maxWidth: 420 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>!</div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a2332', marginBottom: 8 }}>Beklenmeyen bir hata olustu</h2>
            <p style={{ fontSize: 13, color: '#5a6b7f', marginBottom: 20 }}>{this.state.error?.message || 'Uygulama beklenmedik bir hatayla karsilasti.'}</p>
            <button onClick={() => window.location.reload()} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: '#0d6e4f', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Sayfayi Yenile</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
)
