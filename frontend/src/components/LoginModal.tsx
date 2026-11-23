import React, { useState } from 'react';
import { User, UserRole } from '../shared/types';
import { Api } from '../shared/api';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRole?: UserRole;
  onLoginSuccess: (user: User) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  initialRole = 'INVESTOR',
  onLoginSuccess,
}) => {
  const [role, setRole] = useState<UserRole>(initialRole);
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [firmOrCompany, setFirmOrCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        const res = await Api.register({
          email,
          password,
          full_name: fullName,
          role,
          firm_or_company: firmOrCompany,
        });
        onLoginSuccess(res.user);
        onClose();
      } else {
        const res = await Api.login(email, password);
        onLoginSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoRole: UserRole) => {
    try {
      setLoading(true);
      setError(null);
      const res = await Api.switchDemo(demoRole);
      onLoginSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(12, 24, 38, 0.65)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: '#fffdf9',
          border: '1px solid #d6c9b2',
          boxShadow: '0 30px 60px -20px rgba(12, 24, 38, 0.4)',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid #d6c9b2' }}>
          <button
            type="button"
            onClick={() => {
              setRole('INVESTOR');
              setError(null);
            }}
            style={{
              padding: '16px',
              border: 'none',
              backgroundColor: role === 'INVESTOR' ? '#fffdf9' : '#f5efe5',
              color: role === 'INVESTOR' ? '#121a29' : '#4c5262',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              borderBottom: role === 'INVESTOR' ? '2px solid #7a5c2e' : 'none',
            }}
          >
            Investor Access
          </button>
          <button
            type="button"
            onClick={() => {
              setRole('FOUNDER');
              setError(null);
            }}
            style={{
              padding: '16px',
              border: 'none',
              backgroundColor: role === 'FOUNDER' ? '#fffdf9' : '#f5efe5',
              color: role === 'FOUNDER' ? '#121a29' : '#4c5262',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              borderBottom: role === 'FOUNDER' ? '2px solid #7a5c2e' : 'none',
            }}
          >
            Founder Access
          </button>
        </div>

        <div style={{ padding: '32px' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h3
              style={{
                margin: 0,
                fontFamily: "Newsreader, Georgia, 'Times New Roman', serif",
                fontSize: '26px',
                color: '#121a29',
                fontWeight: 400,
              }}
            >
              {isRegister
                ? `Join as ${role === 'INVESTOR' ? 'an Investor' : 'a Founder'}`
                : `Log in to ${role === 'INVESTOR' ? 'Investor Portal' : 'Founder Portal'}`}
            </h3>
            <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#4c5262' }}>
              {role === 'INVESTOR'
                ? 'Review verified Indian venture opportunities and diligence briefs.'
                : 'Showcase your venture story and manage diligence materials.'}
            </p>
          </div>

          {/* Quick Demo Login Box */}
          <div
            style={{
              backgroundColor: '#f5efe5',
              border: '1px solid #d6c9b2',
              padding: '12px 16px',
              marginBottom: '20px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '11px', color: '#7a5c2e', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
              Instant Demo Access
            </div>
            {role === 'INVESTOR' ? (
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('INVESTOR')}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#0c1826',
                  color: '#f5efe5',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Demo Log In (Institutional Investor - Peak India)
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('FOUNDER')}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#0c1826',
                  color: '#f5efe5',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Demo Log In (Founder - The Malabar Coast Kitchen)
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', gap: '12px' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#e3d6bf' }} />
            <span style={{ fontSize: '12px', color: '#8a8070', textTransform: 'uppercase', letterSpacing: '0.1em' }}>or password</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#e3d6bf' }} />
          </div>

          {error && (
            <div
              style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                padding: '10px 14px',
                fontSize: '13px',
                marginBottom: '16px',
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {isRegister && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#121a29', marginBottom: '6px' }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Ramesh Nair"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #8a8070',
                      background: '#fffdf9',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#121a29', marginBottom: '6px' }}>
                    {role === 'INVESTOR' ? 'Firm / Fund Name' : 'Company Name'}
                  </label>
                  <input
                    type="text"
                    value={firmOrCompany}
                    onChange={(e) => setFirmOrCompany(e.target.value)}
                    placeholder={role === 'INVESTOR' ? 'e.g. Horizon Ventures' : 'e.g. BharatPay Technologies'}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #8a8070',
                      background: '#fffdf9',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#121a29', marginBottom: '6px' }}>
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #8a8070',
                  background: '#fffdf9',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#121a29', marginBottom: '6px' }}>
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #8a8070',
                  background: '#fffdf9',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '8px',
                padding: '12px',
                backgroundColor: '#121a29',
                color: '#f5efe5',
                border: 'none',
                fontWeight: 600,
                fontSize: '14px',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px', color: '#4c5262' }}>
            {isRegister ? 'Already have an account?' : "Don't have an account yet?"}{' '}
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#7a5c2e',
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              {isRegister ? 'Sign In' : 'Register Here'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
