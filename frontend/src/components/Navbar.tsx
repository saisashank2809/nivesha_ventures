import React, { useState, useEffect, useRef } from 'react';
import { User, UserRole } from '../shared/types';
import { Api } from '../shared/api';
import { DEMO_ACCOUNTS, DemoAccount } from '../shared/demoAccounts';
import './Navbar.css';

interface NavbarProps {
  currentUser: User | null;
  activeTab: string;
  onNavigate: (tab: string) => void;
  onOpenLogin: (role?: UserRole, isRegister?: boolean) => void;
  onUserChanged: (user: User | null) => void;
  unreadCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeTab,
  onNavigate,
  onOpenLogin,
  onUserChanged,
  unreadCount = 0,
}) => {
  const [quickSwitchOpen, setQuickSwitchOpen] = useState(false);
  const [switchingEmail, setSwitchingEmail] = useState<string | null>(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileQuickSwitchOpen, setMobileQuickSwitchOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const quickSwitchBtnRef = useRef<HTMLButtonElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const accountBtnRef = useRef<HTMLButtonElement>(null);
  const mobileMenuTriggerRef = useRef<HTMLButtonElement>(null);
  const mobileDrawerRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setQuickSwitchOpen(false);
      }
      if (accountMenuRef.current && !accountMenuRef.current.contains(target)) {
        setAccountMenuOpen(false);
      }
    };
    if (quickSwitchOpen || accountMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [quickSwitchOpen, accountMenuOpen]);

  // Support Escape key for all dropdowns and mobile menu with focus return
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (accountMenuOpen) {
          setAccountMenuOpen(false);
          accountBtnRef.current?.focus();
        } else if (quickSwitchOpen) {
          setQuickSwitchOpen(false);
          quickSwitchBtnRef.current?.focus();
        } else if (mobileMenuOpen) {
          setMobileMenuOpen(false);
          mobileMenuTriggerRef.current?.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [accountMenuOpen, quickSwitchOpen, mobileMenuOpen]);

  const handleLogout = () => {
    Api.logout();
    onUserChanged(null);
    onNavigate('LANDING');
  };

  const handleQuickSwitch = async (acc: DemoAccount) => {
    try {
      setSwitchingEmail(acc.email);
      const res = await Api.login(acc.email, 'password123');
      onUserChanged(res.user);
      onNavigate(acc.tab);
      setQuickSwitchOpen(false);
      setMobileMenuOpen(false);
    } catch (err: any) {
      alert(`Quick switch failed: ${err.message}`);
    } finally {
      setSwitchingEmail(null);
    }
  };

  const isInvestor = currentUser?.role === 'INVESTOR';

  // --------------------------------------------------------------------------
  // INVESTOR SIGNED-IN HEADER
  // --------------------------------------------------------------------------
  if (isInvestor) {
    return (
      <nav className="nv-navbar" role="navigation" aria-label="Main Navigation">
        <div className="nv-navbar-investor-container">
          {/* Brand Logo & Wordmark (Left) */}
          <div
            onClick={() => onNavigate('LANDING')}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flexShrink: 0 }}
            title="Nivesha Ventures Home"
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                backgroundColor: '#0c1826',
                color: '#f5efe5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '16px',
                fontFamily: "Newsreader, Georgia, 'Times New Roman', serif",
                borderRadius: '2px',
                flexShrink: 0,
              }}
            >
              N
            </div>
            <div>
              <div
                style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color: '#121a29',
                  letterSpacing: '-0.01em',
                  fontFamily: "Newsreader, Georgia, 'Times New Roman', serif",
                  lineHeight: 1.15,
                  whiteSpace: 'nowrap',
                }}
              >
                Nivesha Ventures
              </div>
              <div className="nv-navbar-tagline">
                Capital Facilitation & Due Diligence
              </div>
            </div>
          </div>

          {/* Desktop Navigation Links (Center) */}
          <div className="nv-investor-desktop" style={{ gap: '6px' }}>
            <button
              type="button"
              onClick={() => onNavigate('LANDING')}
              className={`nv-nav-link nv-nav-focus ${activeTab === 'LANDING' ? 'active' : ''}`}
            >
              Overview
            </button>

            <button
              type="button"
              onClick={() => onNavigate('INVESTOR_DISCOVERY')}
              className={`nv-nav-link nv-nav-focus ${activeTab === 'INVESTOR_DISCOVERY' || activeTab === 'DIRECTORY' ? 'active' : ''}`}
            >
              Venture Matches & Mandate
            </button>

            <button
              type="button"
              onClick={() => onNavigate('MESSAGES')}
              className={`nv-nav-link nv-nav-focus ${activeTab === 'MESSAGES' ? 'active' : ''}`}
            >
              <span>Direct Chat</span>
              {unreadCount > 0 && (
                <span
                  style={{
                    backgroundColor: '#7a5c2e',
                    color: '#fff',
                    borderRadius: '10px',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '1px 6px',
                    marginLeft: '6px',
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* Desktop Right Controls: Quick Demo Switch + Grouped Account Menu */}
          <div className="nv-investor-desktop" style={{ gap: '12px', flexShrink: 0 }}>
            {/* ⚡ Quick Demo Switch */}
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                ref={quickSwitchBtnRef}
                type="button"
                onClick={() => {
                  setQuickSwitchOpen(!quickSwitchOpen);
                  if (accountMenuOpen) setAccountMenuOpen(false);
                }}
                aria-haspopup="true"
                aria-expanded={quickSwitchOpen}
                aria-label="Quick Demo Persona Switcher"
                className="nv-nav-focus"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 11px',
                  backgroundColor: '#f5efe5',
                  border: '1px solid #c5b59b',
                  color: '#7a5c2e',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  borderRadius: '4px',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
                title="1-Click Demo Persona Switcher (Developer Monitoring)"
              >
                <span>⚡</span>
                <span>Quick Demo Switch</span>
                <span
                  style={{
                    fontSize: '9px',
                    display: 'inline-block',
                    transform: quickSwitchOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.15s ease',
                  }}
                >
                  ▼
                </span>
              </button>

              {quickSwitchOpen && (
                <div
                  role="menu"
                  aria-label="Demo accounts switcher"
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '8px',
                    width: '320px',
                    backgroundColor: '#fffdf9',
                    border: '1px solid #d6c9b2',
                    boxShadow: '0 12px 30px rgba(12, 24, 38, 0.18)',
                    borderRadius: '4px',
                    zIndex: 200,
                    maxHeight: '440px',
                    overflowY: 'auto',
                  }}
                >
                  <div style={{ padding: '10px 14px', borderBottom: '1px solid #eedec4', backgroundColor: '#faf4eb' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#121a29' }}>Switch Demo Account</div>
                    <div style={{ fontSize: '11px', color: '#685d4d' }}>Instant login to demonstrate any persona without re-typing credentials</div>
                  </div>
                  <div style={{ padding: '6px 0' }}>
                    {DEMO_ACCOUNTS.map((acc) => {
                      const isCurrent = currentUser?.email === acc.email;
                      const isSwitching = switchingEmail === acc.email;
                      return (
                        <button
                          key={acc.email}
                          type="button"
                          role="menuitem"
                          onClick={() => handleQuickSwitch(acc)}
                          disabled={isSwitching}
                          className="nv-nav-focus"
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: '9px 14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            border: 'none',
                            background: isCurrent ? '#f5efe5' : 'transparent',
                            cursor: isSwitching ? 'wait' : 'pointer',
                            transition: 'background 0.1s ease',
                          }}
                          onMouseEnter={(e) => {
                            if (!isCurrent) e.currentTarget.style.backgroundColor = '#faf6f0';
                          }}
                          onMouseLeave={(e) => {
                            if (!isCurrent) e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <span style={{ fontSize: '16px', lineHeight: 1 }}>{acc.icon}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                              <span
                                style={{
                                  fontSize: '12.5px',
                                  fontWeight: isCurrent ? 700 : 600,
                                  color: '#121a29',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {acc.name}
                              </span>
                              <span
                                style={{
                                  fontSize: '10px',
                                  padding: '1px 5px',
                                  borderRadius: '3px',
                                  backgroundColor:
                                    acc.role === 'INVESTOR'
                                      ? '#e0f2fe'
                                      : acc.role === 'REVIEWER'
                                      ? '#fef3c7'
                                      : '#f3e8ff',
                                  color:
                                    acc.role === 'INVESTOR'
                                      ? '#0369a1'
                                      : acc.role === 'REVIEWER'
                                      ? '#b45309'
                                      : '#6b21a8',
                                  fontWeight: 600,
                                }}
                              >
                                {acc.badge}
                              </span>
                            </div>
                            <div style={{ fontSize: '11px', color: '#7a5c2e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {acc.subtitle}
                            </div>
                          </div>
                          {isCurrent && (
                            <span style={{ fontSize: '12px', color: '#15803d', fontWeight: 700 }}>✓</span>
                          )}
                          {isSwitching && (
                            <span style={{ fontSize: '11px', color: '#7a5c2e' }}>...</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Grouped Investor Account Button with Dropdown */}
            <div ref={accountMenuRef} style={{ position: 'relative' }}>
              <button
                ref={accountBtnRef}
                type="button"
                onClick={() => {
                  setAccountMenuOpen(!accountMenuOpen);
                  if (quickSwitchOpen) setQuickSwitchOpen(false);
                }}
                aria-haspopup="true"
                aria-expanded={accountMenuOpen}
                aria-label={`Account menu for ${currentUser.full_name}`}
                className="nv-nav-focus"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 12px',
                  backgroundColor: accountMenuOpen ? '#f5efe5' : '#fffdf9',
                  border: '1px solid #d6c9b2',
                  borderRadius: '4px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#121a29',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  if (!accountMenuOpen) e.currentTarget.style.backgroundColor = '#faf6f0';
                }}
                onMouseLeave={(e) => {
                  if (!accountMenuOpen) e.currentTarget.style.backgroundColor = '#fffdf9';
                }}
              >
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: '#15803d',
                    display: 'inline-block',
                    flexShrink: 0,
                  }}
                />
                <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {currentUser.full_name}
                </span>
                <span
                  style={{
                    fontSize: '9px',
                    color: '#7a5c2e',
                    display: 'inline-block',
                    transform: accountMenuOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.15s ease',
                  }}
                >
                  ▼
                </span>
              </button>

              {/* Account Dropdown */}
              {accountMenuOpen && (
                <div
                  role="menu"
                  aria-label="Investor Account Profile"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '260px',
                    backgroundColor: '#fffdf9',
                    border: '1px solid #d6c9b2',
                    boxShadow: '0 12px 30px rgba(12, 24, 38, 0.16)',
                    borderRadius: '4px',
                    zIndex: 200,
                    overflow: 'hidden',
                  }}
                >
                  {/* Account Identity Details */}
                  <div style={{ padding: '12px 14px', backgroundColor: '#faf4eb', borderBottom: '1px solid #eedec4' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#121a29' }}>
                        {currentUser.full_name}
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          backgroundColor: '#e0f2fe',
                          color: '#0369a1',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        Investor
                      </span>
                    </div>
                    {currentUser.firm_or_company && (
                      <div style={{ fontSize: '12px', color: '#536074', fontWeight: 500, lineHeight: 1.3 }}>
                        {currentUser.firm_or_company}
                      </div>
                    )}
                    <div style={{ fontSize: '11px', color: '#7a5c2e', marginTop: '4px', wordBreak: 'break-all' }}>
                      {currentUser.email}
                    </div>
                  </div>

                  {/* Sign Out Action */}
                  <div style={{ padding: '6px' }}>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setAccountMenuOpen(false);
                        handleLogout();
                      }}
                      className="nv-nav-focus"
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '9px 12px',
                        background: 'none',
                        border: 'none',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#b91c1c',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'background 0.12s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fef2f2')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <span>🚪</span>
                      <span>Sign out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Labeled Menu Trigger (Visible <= 1024px) */}
          <div className="nv-investor-mobile-trigger">
            <button
              ref={mobileMenuTriggerRef}
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Navigation menu"
              aria-expanded={mobileMenuOpen}
              className="nv-nav-focus"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                backgroundColor: mobileMenuOpen ? '#0c1826' : '#f5efe5',
                color: mobileMenuOpen ? '#ffffff' : '#121a29',
                border: '1px solid #c5b59b',
                borderRadius: '4px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                flexShrink: 0,
              }}
            >
              <span>Menu</span>
              <span style={{ fontSize: '13px' }}>{mobileMenuOpen ? '✕' : '☰'}</span>
            </button>
          </div>
        </div>

        {/* Mobile Responsive Drawer / Overlay */}
        {mobileMenuOpen && (
          <div
            style={{
              position: 'fixed',
              top: '64px',
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              maxWidth: '100vw',
              backgroundColor: 'rgba(12, 24, 38, 0.55)',
              backdropFilter: 'blur(3px)',
              zIndex: 99,
              display: 'flex',
              flexDirection: 'column',
              boxSizing: 'border-box',
            }}
            onClick={() => {
              setMobileMenuOpen(false);
              mobileMenuTriggerRef.current?.focus();
            }}
          >
            <div
              ref={mobileDrawerRef}
              style={{
                backgroundColor: '#fffdf9',
                borderBottom: '2px solid #7a5c2e',
                boxShadow: '0 16px 36px rgba(12, 24, 38, 0.25)',
                padding: '20px',
                maxHeight: 'calc(100vh - 64px)',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                width: '100%',
                maxWidth: '100vw',
                boxSizing: 'border-box',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Account Identity Card */}
              <div style={{ padding: '12px 14px', backgroundColor: '#faf4eb', border: '1px solid #eedec4', borderRadius: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#15803d' }} />
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#121a29' }}>{currentUser.full_name}</span>
                  </div>
                  <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '3px', backgroundColor: '#e0f2fe', color: '#0369a1', fontWeight: 700 }}>
                    Investor
                  </span>
                </div>
                {currentUser.firm_or_company && (
                  <div style={{ fontSize: '12px', color: '#536074' }}>{currentUser.firm_or_company}</div>
                )}
                <div style={{ fontSize: '11px', color: '#7a5c2e', marginTop: '2px' }}>{currentUser.email}</div>
              </div>

              {/* Navigation Links */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#7a5c2e', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Navigation
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('LANDING');
                    setMobileMenuOpen(false);
                  }}
                  className="nv-nav-focus"
                  style={{
                    padding: '10px 14px',
                    textAlign: 'left',
                    borderRadius: '4px',
                    backgroundColor: activeTab === 'LANDING' ? '#f5efe5' : 'transparent',
                    color: activeTab === 'LANDING' ? '#0c1826' : '#4c5262',
                    fontWeight: activeTab === 'LANDING' ? 700 : 500,
                    fontSize: '14px',
                    borderLeft: activeTab === 'LANDING' ? '3px solid #7a5c2e' : '3px solid transparent',
                    borderTop: 'none',
                    borderRight: 'none',
                    borderBottom: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Overview
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('INVESTOR_DISCOVERY');
                    setMobileMenuOpen(false);
                  }}
                  className="nv-nav-focus"
                  style={{
                    padding: '10px 14px',
                    textAlign: 'left',
                    borderRadius: '4px',
                    backgroundColor: (activeTab === 'INVESTOR_DISCOVERY' || activeTab === 'DIRECTORY') ? '#f5efe5' : 'transparent',
                    color: (activeTab === 'INVESTOR_DISCOVERY' || activeTab === 'DIRECTORY') ? '#0c1826' : '#4c5262',
                    fontWeight: (activeTab === 'INVESTOR_DISCOVERY' || activeTab === 'DIRECTORY') ? 700 : 500,
                    fontSize: '14px',
                    borderLeft: (activeTab === 'INVESTOR_DISCOVERY' || activeTab === 'DIRECTORY') ? '3px solid #7a5c2e' : '3px solid transparent',
                    borderTop: 'none',
                    borderRight: 'none',
                    borderBottom: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Venture Matches & Mandate
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('MESSAGES');
                    setMobileMenuOpen(false);
                  }}
                  className="nv-nav-focus"
                  style={{
                    padding: '10px 14px',
                    textAlign: 'left',
                    borderRadius: '4px',
                    backgroundColor: activeTab === 'MESSAGES' ? '#f5efe5' : 'transparent',
                    color: activeTab === 'MESSAGES' ? '#0c1826' : '#4c5262',
                    fontWeight: activeTab === 'MESSAGES' ? 700 : 500,
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderLeft: activeTab === 'MESSAGES' ? '3px solid #7a5c2e' : '3px solid transparent',
                    borderTop: 'none',
                    borderRight: 'none',
                    borderBottom: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <span>Direct Chat</span>
                  {unreadCount > 0 && (
                    <span style={{ backgroundColor: '#7a5c2e', color: '#fff', borderRadius: '10px', fontSize: '10px', fontWeight: 700, padding: '1px 6px' }}>
                      {unreadCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Developer Demo Switcher */}
              <div style={{ borderTop: '1px solid #eedec4', paddingTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setMobileQuickSwitchOpen(!mobileQuickSwitchOpen)}
                  className="nv-nav-focus"
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 12px',
                    backgroundColor: '#f5efe5',
                    border: '1px solid #c5b59b',
                    borderRadius: '4px',
                    color: '#7a5c2e',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <span>⚡ Quick Demo Switch ({DEMO_ACCOUNTS.length} Personas)</span>
                  <span style={{ fontSize: '10px', transform: mobileQuickSwitchOpen ? 'rotate(180deg)' : 'none' }}>▼</span>
                </button>

                {mobileQuickSwitchOpen && (
                  <div style={{ marginTop: '8px', maxHeight: '200px', overflowY: 'auto', border: '1px solid #eedec4', borderRadius: '4px' }}>
                    {DEMO_ACCOUNTS.map((acc) => {
                      const isCurrent = currentUser?.email === acc.email;
                      return (
                        <button
                          key={acc.email}
                          type="button"
                          onClick={() => {
                            handleQuickSwitch(acc);
                            setMobileMenuOpen(false);
                          }}
                          className="nv-nav-focus"
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: '8px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            border: 'none',
                            backgroundColor: isCurrent ? '#f5efe5' : '#fffdf9',
                            borderBottom: '1px solid #faf4eb',
                            cursor: 'pointer',
                          }}
                        >
                          <span>{acc.icon}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '12px', fontWeight: isCurrent ? 700 : 600, color: '#121a29' }}>{acc.name}</div>
                            <div style={{ fontSize: '10.5px', color: '#7a5c2e' }}>{acc.badge} • {acc.firm}</div>
                          </div>
                          {isCurrent && <span style={{ color: '#15803d', fontWeight: 700 }}>✓</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Sign out button */}
              <div style={{ borderTop: '1px solid #eedec4', paddingTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="nv-nav-focus"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#b91c1c',
                    fontWeight: 600,
                    fontSize: '13.5px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                  }}
                >
                  <span>🚪</span>
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
    );
  }

  // --------------------------------------------------------------------------
  // SHARED NAVBAR FOR OTHER VIEWS (PUBLIC / FOUNDER / REVIEWER)
  // Preserves existing layout and container structure exactly as before
  // --------------------------------------------------------------------------
  return (
    <nav
      style={{
        backgroundColor: '#fffdf9',
        borderBottom: '1px solid #d6c9b2',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: '1240px',
          margin: '0 auto',
          padding: '12px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        {/* Brand Logo */}
        <div
          onClick={() => onNavigate('LANDING')}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              backgroundColor: '#0c1826',
              color: '#f5efe5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '16px',
              fontFamily: "Newsreader, Georgia, 'Times New Roman', serif",
            }}
          >
            N
          </div>
          <div>
            <div
              style={{
                fontSize: '18px',
                fontWeight: 600,
                color: '#121a29',
                letterSpacing: '-0.01em',
                fontFamily: "Newsreader, Georgia, 'Times New Roman', serif",
              }}
            >
              Nivesha Ventures
            </div>
            <div style={{ fontSize: '10px', color: '#7a5c2e', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Capital Facilitation & Due Diligence
            </div>
          </div>
        </div>

        {/* Center Nav Links - Clear Distinction between Public Home and Private Dashboards */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => onNavigate('LANDING')}
            style={{
              padding: '6px 12px',
              border: 'none',
              background: 'none',
              fontSize: '13.5px',
              fontWeight: activeTab === 'LANDING' ? 600 : 500,
              color: activeTab === 'LANDING' ? '#0c1826' : '#4c5262',
              cursor: 'pointer',
              borderBottom: activeTab === 'LANDING' ? '2px solid #7a5c2e' : '2px solid transparent',
            }}
          >
            Home
          </button>

          {/* Unauthenticated visitors */}
          {!currentUser && (
            <>
              <button
                onClick={() => onNavigate('INVESTOR_DISCOVERY')}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  background: 'none',
                  fontSize: '13.5px',
                  fontWeight: activeTab === 'INVESTOR_DISCOVERY' ? 600 : 500,
                  color: activeTab === 'INVESTOR_DISCOVERY' ? '#0c1826' : '#4c5262',
                  cursor: 'pointer',
                  borderBottom: activeTab === 'INVESTOR_DISCOVERY' ? '2px solid #7a5c2e' : '2px solid transparent',
                }}
              >
                Verified Opportunities
              </button>
              <button
                onClick={() => onOpenLogin('FOUNDER', true)}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  background: 'none',
                  fontSize: '13.5px',
                  fontWeight: 500,
                  color: '#4c5262',
                  cursor: 'pointer',
                }}
              >
                For Founders
              </button>
            </>
          )}

          {/* Reviewer can explore opportunities */}
          {currentUser?.role === 'REVIEWER' && (
            <button
              onClick={() => onNavigate('INVESTOR_DISCOVERY')}
              style={{
                padding: '6px 12px',
                border: 'none',
                background: 'none',
                fontSize: '13.5px',
                fontWeight: activeTab === 'INVESTOR_DISCOVERY' ? 600 : 500,
                color: activeTab === 'INVESTOR_DISCOVERY' ? '#0c1826' : '#4c5262',
                cursor: 'pointer',
                borderBottom: activeTab === 'INVESTOR_DISCOVERY' ? '2px solid #7a5c2e' : '2px solid transparent',
              }}
            >
              Verified Opportunities
            </button>
          )}

          {/* Founder specific views */}
          {currentUser?.role === 'FOUNDER' && (
            <>
              <button
                onClick={() => onNavigate('FOUNDER_DASHBOARD')}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  background: 'none',
                  fontSize: '13.5px',
                  fontWeight: activeTab === 'FOUNDER_DASHBOARD' ? 600 : 500,
                  color: activeTab === 'FOUNDER_DASHBOARD' ? '#0c1826' : '#4c5262',
                  cursor: 'pointer',
                  borderBottom: activeTab === 'FOUNDER_DASHBOARD' ? '2px solid #7a5c2e' : '2px solid transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span style={{ fontSize: '12px' }}>🏢</span>
                <span>Founder Dashboard</span>
              </button>
              <button
                onClick={() => onNavigate('FOUNDER_JOURNEY')}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  background: 'none',
                  fontSize: '13.5px',
                  fontWeight: activeTab === 'FOUNDER_JOURNEY' ? 600 : 500,
                  color: activeTab === 'FOUNDER_JOURNEY' ? '#0c1826' : '#4c5262',
                  cursor: 'pointer',
                  borderBottom: activeTab === 'FOUNDER_JOURNEY' ? '2px solid #7a5c2e' : '2px solid transparent',
                }}
              >
                Story Builder
              </button>
            </>
          )}

          {/* Reviewer / Operator specific views */}
          {currentUser?.role === 'REVIEWER' && (
            <>
              <button
                onClick={() => onNavigate('PLATFORM_REVIEW')}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  background: 'none',
                  fontSize: '13.5px',
                  fontWeight: activeTab === 'PLATFORM_REVIEW' ? 600 : 500,
                  color: activeTab === 'PLATFORM_REVIEW' ? '#0c1826' : '#4c5262',
                  cursor: 'pointer',
                  borderBottom: activeTab === 'PLATFORM_REVIEW' ? '2px solid #7a5c2e' : '2px solid transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span style={{ fontSize: '12px' }}>⚖️</span>
                <span>Review Desk</span>
              </button>
              <button
                onClick={() => onNavigate('INVESTOR_DISCOVERY')}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  background: 'none',
                  fontSize: '13.5px',
                  fontWeight: activeTab === 'INVESTOR_DISCOVERY' ? 600 : 500,
                  color: activeTab === 'INVESTOR_DISCOVERY' ? '#0c1826' : '#4c5262',
                  cursor: 'pointer',
                  borderBottom: activeTab === 'INVESTOR_DISCOVERY' ? '2px solid #7a5c2e' : '2px solid transparent',
                }}
              >
                All Ventures
              </button>
            </>
          )}

          {/* Authenticated Messaging / Direct DM */}
          {currentUser && (
            <button
              onClick={() => onNavigate('MESSAGES')}
              style={{
                padding: '6px 12px',
                border: 'none',
                background: 'none',
                fontSize: '13.5px',
                fontWeight: activeTab === 'MESSAGES' ? 600 : 500,
                color: activeTab === 'MESSAGES' ? '#0c1826' : '#4c5262',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                borderBottom: activeTab === 'MESSAGES' ? '2px solid #7a5c2e' : '2px solid transparent',
              }}
            >
              <span>💬</span>
              <span>Direct DM</span>
              {unreadCount > 0 && (
                <span
                  style={{
                    backgroundColor: '#15803d',
                    color: '#fff',
                    borderRadius: '10px',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '1px 7px',
                    boxShadow: '0 0 6px rgba(21, 128, 61, 0.5)',
                  }}
                  title={`${unreadCount} unread message(s)`}
                >
                  {unreadCount}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Right: Quick Switcher + Authenticated User Profile / Real Sign In */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* ⚡ Quick Switch Dropdown for Demo */}
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setQuickSwitchOpen(!quickSwitchOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                backgroundColor: '#f5efe5',
                border: '1px solid #c5b59b',
                color: '#7a5c2e',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
                borderRadius: '4px',
                transition: 'all 0.15s ease',
              }}
              title="1-Click Demo Persona Switcher"
            >
              <span>⚡</span>
              <span>Quick Demo Switch</span>
              <span
                style={{
                  fontSize: '9px',
                  display: 'inline-block',
                  transform: quickSwitchOpen ? 'rotate(180deg)' : 'none',
                }}
              >
                ▼
              </span>
            </button>

            {quickSwitchOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  width: '320px',
                  backgroundColor: '#fffdf9',
                  border: '1px solid #d6c9b2',
                  boxShadow: '0 12px 30px rgba(12, 24, 38, 0.18)',
                  borderRadius: '4px',
                  zIndex: 200,
                  maxHeight: '440px',
                  overflowY: 'auto',
                }}
              >
                <div style={{ padding: '10px 14px', borderBottom: '1px solid #eedec4', backgroundColor: '#faf4eb' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#121a29' }}>Switch Demo Account</div>
                  <div style={{ fontSize: '11px', color: '#685d4d' }}>Instant login to demonstrate any persona without re-typing credentials</div>
                </div>
                <div style={{ padding: '6px 0' }}>
                  {DEMO_ACCOUNTS.map((acc) => {
                    const isCurrent = currentUser?.email === acc.email;
                    const isSwitching = switchingEmail === acc.email;
                    return (
                      <button
                        key={acc.email}
                        type="button"
                        onClick={() => handleQuickSwitch(acc)}
                        disabled={isSwitching}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '9px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          border: 'none',
                          background: isCurrent ? '#f5efe5' : 'transparent',
                          cursor: isSwitching ? 'wait' : 'pointer',
                          transition: 'background 0.1s ease',
                        }}
                        onMouseEnter={(e) => {
                          if (!isCurrent) e.currentTarget.style.backgroundColor = '#faf6f0';
                        }}
                        onMouseLeave={(e) => {
                          if (!isCurrent) e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <span style={{ fontSize: '16px', lineHeight: 1 }}>{acc.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                            <span
                              style={{
                                fontSize: '12.5px',
                                fontWeight: isCurrent ? 700 : 600,
                                color: '#121a29',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {acc.name}
                            </span>
                            <span
                              style={{
                                fontSize: '10px',
                                padding: '1px 5px',
                                borderRadius: '3px',
                                backgroundColor:
                                  acc.role === 'INVESTOR'
                                    ? '#e0f2fe'
                                    : acc.role === 'REVIEWER'
                                    ? '#fef3c7'
                                    : '#f3e8ff',
                                color:
                                  acc.role === 'INVESTOR'
                                    ? '#0369a1'
                                    : acc.role === 'REVIEWER'
                                    ? '#b45309'
                                    : '#6b21a8',
                                fontWeight: 600,
                              }}
                            >
                              {acc.badge}
                            </span>
                          </div>
                          <div style={{ fontSize: '11px', color: '#7a5c2e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {acc.subtitle}
                          </div>
                        </div>
                        {isCurrent && (
                          <span style={{ fontSize: '12px', color: '#15803d', fontWeight: 700 }}>✓</span>
                        )}
                        {isSwitching && (
                          <span style={{ fontSize: '11px', color: '#7a5c2e' }}>...</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#121a29' }}>
                  {currentUser.full_name}
                </div>
                <div style={{ fontSize: '11px', color: '#7a5c2e', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: '#15803d',
                    }}
                  />
                  {currentUser.role.charAt(0) + currentUser.role.slice(1).toLowerCase()}
                  {currentUser.firm_or_company ? ` • ${currentUser.firm_or_company}` : ''}
                </div>
              </div>

              <button
                onClick={handleLogout}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#fffdf9',
                  border: '1px solid #d6c9b2',
                  fontSize: '12px',
                  color: '#4c5262',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                Sign out
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => onOpenLogin('INVESTOR', false)}
                style={{
                  padding: '7px 16px',
                  backgroundColor: '#fffdf9',
                  border: '1px solid #8a8070',
                  color: '#121a29',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Sign In
              </button>
              <button
                onClick={() => onOpenLogin('FOUNDER', true)}
                style={{
                  padding: '7px 16px',
                  backgroundColor: '#0c1826',
                  color: '#f5efe5',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Join Platform
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
