import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.wrap}>
          <div style={styles.card}>
            <span style={styles.icon}>⚠️</span>
            <h2 style={styles.title}>Something went wrong</h2>
            <p style={styles.msg}>
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <button
              style={styles.btn}
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const styles = {
  wrap: {
    minHeight: '100vh', display: 'flex', alignItems: 'center',
    justifyContent: 'center', background: '#f4f6fb', padding: '20px',
  },
  card: {
    background: '#fff', borderRadius: '16px', padding: '40px 32px',
    maxWidth: '420px', width: '100%', textAlign: 'center',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
  },
  icon: { fontSize: '48px' },
  title: { fontSize: '20px', fontWeight: '700', color: '#1a1a2e', margin: '16px 0 8px' },
  msg: { fontSize: '14px', color: '#757575', lineHeight: '1.6', margin: '0 0 24px' },
  btn: {
    padding: '12px 28px', background: 'linear-gradient(135deg, #0d1b4b, #1565c0)',
    color: '#fff', border: 'none', borderRadius: '10px',
    fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit',
  },
};
