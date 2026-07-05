import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Login from './views/Login';
import PDV from './views/PDV';
import Admin from './views/Admin';

// React Error Boundary to catch and debug runtime crashes
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("FITSTORE ERP ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px',
          background: '#08080a',
          color: '#ffffff',
          minHeight: '100vh',
          fontFamily: 'sans-serif',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center'
        }}>
          <h1 style={{ color: '#FF2D8E', marginBottom: '16px', fontSize: '2rem' }}>⚠️ Ops! Ocorreu um erro no sistema</h1>
          <p style={{ color: '#9FA1B0', marginBottom: '24px', maxWidth: '600px', fontSize: '0.95rem' }}>
            Ocorreu uma falha na inicialização do FITSTORE ERP. Isso geralmente é causado por dados antigos ou inconsistentes salvos no navegador durante os testes.
          </p>
          <pre style={{
            background: '#111115',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.06)',
            color: '#EF4444',
            textAlign: 'left',
            maxWidth: '800px',
            width: '100%',
            overflowX: 'auto',
            marginBottom: '24px',
            fontFamily: 'monospace',
            fontSize: '0.85rem',
            whiteSpace: 'pre-wrap'
          }}>
            {this.state.error && this.state.error.toString()}
            {"\n\n"}
            {this.state.error && this.state.error.stack}
          </pre>
          <button 
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            className="btn btn-primary btn-large"
            style={{ fontWeight: '600' }}
          >
            Limpar Histórico e Reiniciar Sistema
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function MainAppContent() {
  const { user } = useApp();
  const [currentView, setCurrentView] = useState('pdv'); // 'pdv' or 'admin'

  // Automatically redirect based on role when user logs in
  useEffect(() => {
    if (user) {
      if (user.role === 'admin' || user.role === 'manager') {
        setCurrentView('admin');
      } else {
        setCurrentView('pdv');
      }
    }
  }, [user]);

  if (!user) {
    return <Login />;
  }

  if (currentView === 'admin' && (user.role === 'admin' || user.role === 'manager')) {
    return (
      <Admin 
        onNavigateToPDV={() => setCurrentView('pdv')} 
      />
    );
  }

  return (
    <PDV 
      onNavigateToAdmin={() => setCurrentView('admin')} 
    />
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <MainAppContent />
      </AppProvider>
    </ErrorBoundary>
  );
}
