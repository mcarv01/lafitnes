import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { KeyRound, User, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function Login() {
  const { login, isDesktopMode, downloadDesktopLauncher } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    if (!username || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);
    // Add a tiny artificial delay for premium feels (transitions, skeleton feel)
    setTimeout(() => {
      const res = login(username, password);
      setLoading(false);
      if (!res.success) {
        setError(res.message);
      }
    }, 600);
  };

  const handleQuickLogin = (role) => {
    setUsername(role);
    setPassword('1234');
    setError('');
  };

  return (
    <div style={styles.container}>
      {!isDesktopMode && (
        <button 
          onClick={downloadDesktopLauncher} 
          style={styles.desktopDownloadBtn}
        >
          💻 Baixar Versão Desktop
        </button>
      )}
      <div className="glass-card animate-fade-in" style={styles.card}>
        {/* Logo and Title */}
        <div style={styles.logoHeader}>
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
            <img src="/logo.png" alt="Lafitnes Logo" style={{ height: '90px', objectFit: 'contain', borderRadius: '12px' }} />
          </div>
          <h1 style={styles.brandTitle}>LAFIT_NES <span className="text-neon">ERP</span></h1>
          <p style={styles.subTitle}>SISTEMA DE GESTÃO INTELIGENTE</p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={styles.errorContainer} className="animate-fade-in">
            <AlertCircle size={18} color="var(--danger)" />
            <span style={styles.errorText}>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <div className="form-group">
            <label className="form-label">Usuário</label>
            <div style={styles.inputWrapper}>
              <User size={18} style={styles.inputIcon} />
              <input
                type="text"
                className="input-field"
                placeholder="Ex: admin, gerente, vendedor"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={styles.input}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '16px' }}>
            <label className="form-label">Senha</label>
            <div style={styles.inputWrapper}>
              <Lock size={18} style={styles.inputIcon} />
              <input
                type={showPassword ? 'text' : 'password'}
                className="input-field"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Options */}
          <div style={styles.optionsRow}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={styles.checkbox}
              />
              Lembrar acesso
            </label>
            <a href="#forgot" style={styles.forgotLink} onClick={(e) => { e.preventDefault(); alert('Contate o administrador para resetar sua senha.'); }}>
              Esqueci a senha
            </a>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary btn-large"
            style={{ width: '100%', marginTop: '24px' }}
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        {/* Quick Access Helper */}
        <div style={styles.quickAccess}>
          <p style={styles.quickAccessTitle}>Acesso de Demonstração (Senha: 1234):</p>
          <div style={styles.quickAccessButtons}>
            <button onClick={() => handleQuickLogin('admin')} style={styles.quickBtn}>Admin</button>
            <button onClick={() => handleQuickLogin('gerente')} style={styles.quickBtn}>Gerente</button>
            <button onClick={() => handleQuickLogin('vendedor')} style={styles.quickBtn}>Vendedor</button>
            <button onClick={() => handleQuickLogin('caixa')} style={styles.quickBtn}>Caixa</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    minHeight: '100dvh',
    padding: '20px',
    background: 'radial-gradient(circle at 50% 50%, #111118 0%, #060608 100%)'
  },
  card: {
    width: '100%',
    maxWidth: '440px',
    padding: '40px 32px',
    borderRadius: '24px',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
    border: '1px solid rgba(255, 255, 255, 0.05)'
  },
  logoHeader: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '32px'
  },
  logoBadge: {
    width: '64px',
    height: '64px',
    borderRadius: '16px',
    background: 'rgba(255, 45, 142, 0.1)',
    border: '1px solid rgba(255, 45, 142, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px'
  },
  brandTitle: {
    fontSize: '1.8rem',
    fontWeight: '800',
    letterSpacing: '1px',
    marginBottom: '4px'
  },
  subTitle: {
    fontSize: '0.65rem',
    fontWeight: '600',
    color: 'var(--text-muted)',
    letterSpacing: '2px'
  },
  errorContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'var(--danger-dim)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    padding: '12px',
    borderRadius: '12px',
    marginBottom: '20px'
  },
  errorText: {
    fontSize: '0.8rem',
    color: 'var(--danger)',
    fontWeight: '500'
  },
  form: {
    width: '100%'
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  inputIcon: {
    position: 'absolute',
    left: '16px',
    color: 'var(--text-muted)'
  },
  input: {
    width: '100%',
    paddingLeft: '48px',
    paddingRight: '48px'
  },
  eyeButton: {
    position: 'absolute',
    right: '16px',
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'var(--transition)'
  },
  optionsRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'between',
    justifyContent: 'space-between',
    marginTop: '16px',
    fontSize: '0.8rem'
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    userSelect: 'none'
  },
  checkbox: {
    accentColor: 'var(--neon-pink)',
    width: '15px',
    height: '15px',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  forgotLink: {
    color: 'var(--neon-pink)',
    fontWeight: '500',
    fontSize: '0.8rem'
  },
  quickAccess: {
    marginTop: '32px',
    borderTop: '1px solid var(--border-color)',
    paddingTop: '20px',
    textAlign: 'center'
  },
  quickAccessTitle: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    marginBottom: '10px',
    fontWeight: '500'
  },
  quickAccessButtons: {
    display: 'flex',
    justifyContent: 'center',
    gap: '8px',
    flexWrap: 'wrap'
  },
  quickBtn: {
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-secondary)',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '0.75rem',
    cursor: 'pointer',
    transition: 'var(--transition)'
  },
  desktopDownloadBtn: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    fontSize: '0.8rem',
    gap: '8px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.03)',
    color: 'var(--text-secondary)',
    padding: '10px 20px',
    borderRadius: '12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    transition: 'var(--transition)',
    fontWeight: '500'
  }
};
// Hover effects using standard inline logic or selectors in CSS
// The quickBtn hover is handled in index.css generally but inline can be styled
styles.quickBtn[':hover'] = {
  borderColor: 'var(--neon-pink)',
  color: 'white'
};
