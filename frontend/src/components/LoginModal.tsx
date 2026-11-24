import React, { useState } from 'react';
import { User, UserRole } from '../shared/types';
import { Api } from '../shared/api';
import { DEMO_ACCOUNTS } from '../shared/demoAccounts';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRole?: UserRole;
  initialIsRegister?: boolean;
  onLoginSuccess: (user: User) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  initialRole = 'INVESTOR',
  initialIsRegister = false,
  onLoginSuccess,
}) => {
  const [isRegister, setIsRegister] = useState(initialIsRegister);
  const [role, setRole] = useState<UserRole>(initialRole);
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

    if (isRegister) {
      if (password.length < 8) {
        setError('Password must be at least 8 characters.');
        return;
      }
      if (!fullName.trim()) {
        setError('Please provide your full name.');
        return;
      }
    }

    setLoading(true);

    try {
      if (isRegister) {
        const res = await Api.register({
          email: email.trim(),
          password,
          full_name: fullName.trim(),
          role,
          firm_or_company: firmOrCompany.trim() || undefined,
        });
        onLoginSuccess(res.user);
        onClose();
      } else {
        const res = await Api.login(email.trim(), password);
        onLoginSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (targetEmail: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await Api.login(targetEmail, 'password123');
      onLoginSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Quick login failed');
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
        {/* Modal Header Tabs: Sign In vs Create Account */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid #d6c9b2' }}>
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setError(null);
            }}
            style={{
              padding: '16px',
              border: 'none',
              backgroundColor: !isRegister ? '#fffdf9' : '#f5efe5',
              color: !isRegister ? '#121a29' : '#4c5262',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              borderBottom: !isRegister ? '2px solid #7a5c2e' : 'none',
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              setError(null);
            }}
            style={{
              padding: '16px',
              border: 'none',
              backgroundColor: isRegister ? '#fffdf9' : '#f5efe5',
              color: isRegister ? '#121a29' : '#4c5262',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              borderBottom: isRegister ? '2px solid #7a5c2e' : 'none',
            }}
          >
            Create Account
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
              {isRegister ? 'Join Nivesha Ventures' : 'Welcome to Nivesha Ventures'}
            </h3>
            <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#4c5262' }}>
              {isRegister
                ? 'Create a verified profile to participate in capital facilitation.'
                : 'Sign in to access your verified matches, stories, and diligence briefs.'}
            </p>
          </div>

          {error && (
            <div
              style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                padding: '10px 14px',
                fontSize: '13px',
                marginBottom: '18px',
              }}
            >
              {error}
            </div>
          )}

          {/* Quick 1-Click Demo Accounts Switcher on top of Sign In */}
          {!isRegister && (
            <div
              style={{
                marginBottom: '20px',
                padding: '12px',
                backgroundColor: '#faf5ec',
                border: '1px solid #e2d4bd',
                borderRadius: '4px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '10px',
                }}
              >
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#7a5c2e',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span>⚡</span> Quick Login (1-Click Demo)
                </div>
                <span style={{ fontSize: '11px', color: '#8a8070' }}>Click to sign in instantly</span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '6px',
                  maxHeight: '180px',
                  overflowY: 'auto',
                  paddingRight: '2px',
                }}
              >
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => handleQuickLogin(acc.email)}
                    disabled={loading}
                    style={{
                      padding: '7px 8px',
                      backgroundColor: '#fffdf9',
                      border: '1px solid #d6c9b2',
                      textAlign: 'left',
                      cursor: loading ? 'wait' : 'pointer',
                      borderRadius: '4px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f1e6d4';
                      e.currentTarget.style.borderColor = '#7a5c2e';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#fffdf9';
                      e.currentTarget.style.borderColor = '#d6c9b2';
                    }}
                    title={`${acc.name} (${acc.role}) - ${acc.subtitle}`}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11.5px' }}>
                      <span>{acc.icon}</span>
                      <span
                        style={{
                          fontWeight: 600,
                          color: '#121a29',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          fontSize: '11px',
                        }}
                      >
                        {acc.badge}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: '10px',
                        color: '#7a5c2e',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {acc.name.split(' ')[0]}
                    </div>
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '14px 0 4px' }}>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#d6c9b2' }} />
                <span style={{ fontSize: '11px', color: '#8a8070', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  or enter credentials manually
                </span>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#d6c9b2' }} />
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {isRegister && (
              <>
                {/* Persona selector for registration */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#7a5c2e', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                    Select Your Role
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setRole('INVESTOR')}
                      style={{
                        padding: '10px',
                        border: role === 'INVESTOR' ? '2px solid #0c1826' : '1px solid #d6c9b2',
                        backgroundColor: role === 'INVESTOR' ? '#f5efe5' : '#fff',
                        fontWeight: role === 'INVESTOR' ? 600 : 400,
                        color: '#121a29',
                        fontSize: '13px',
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      Investor
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('FOUNDER')}
                      style={{
                        padding: '10px',
                        border: role === 'FOUNDER' ? '2px solid #0c1826' : '1px solid #d6c9b2',
                        backgroundColor: role === 'FOUNDER' ? '#f5efe5' : '#fff',
                        fontWeight: role === 'FOUNDER' ? 600 : 400,
                        color: '#121a29',
                        fontSize: '13px',
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      Founder
                    </button>
                  </div>
                </div>

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
                    {role === 'INVESTOR' ? 'Firm / Fund Name (or Individual)' : 'Company / Venture Name'}
                  </label>
                  <input
                    type="text"
                    value={firmOrCompany}
                    onChange={(e) => setFirmOrCompany(e.target.value)}
                    placeholder={role === 'INVESTOR' ? 'e.g. Peak Capital / Angel Investor' : 'e.g. Malabar Coast Kitchen'}
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
                Password {isRegister && <span style={{ fontSize: '11px', color: '#7a5c2e' }}>(min. 8 characters)</span>}
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
                width: '100%',
                padding: '12px',
                backgroundColor: '#0c1826',
                color: '#f5efe5',
                border: 'none',
                fontSize: '14px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                marginTop: '8px',
              }}
            >
              {loading
                ? (isRegister ? 'Creating Account...' : 'Authenticating...')
                : (isRegister ? 'Create Account' : 'Sign In')}
            </button>
          </form>

          <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '12.5px', color: '#4c5262' }}>
            {isRegister ? (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(false);
                    setError(null);
                  }}
                  style={{ background: 'none', border: 'none', color: '#7a5c2e', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                >
                  Sign In
                </button>
              </span>
            ) : (
              <span>
                New to Nivesha Ventures?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(true);
                    setError(null);
                  }}
                  style={{ background: 'none', border: 'none', color: '#7a5c2e', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                >
                  Create an account
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
