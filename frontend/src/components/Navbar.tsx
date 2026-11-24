import React, { useState, useEffect, useRef } from 'react';
import { User, UserRole } from '../shared/types';
import { Api } from '../shared/api';
import { DEMO_ACCOUNTS, DemoAccount } from '../shared/demoAccounts';

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
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setQuickSwitchOpen(false);
      }
    };
    if (quickSwitchOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [quickSwitchOpen]);

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
    } catch (err: any) {
      alert(`Quick switch failed: ${err.message}`);
    } finally {
      setSwitchingEmail(null);
    }
  };

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

        {/* Center Nav Links - Contextual by User Role */}
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
            Overview
          </button>

          {/* Unauthenticated / Investor / Reviewer can explore opportunities */}
          {(!currentUser || currentUser.role === 'INVESTOR' || currentUser.role === 'REVIEWER') && (
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
              {currentUser?.role === 'INVESTOR' ? 'Venture Matches & Mandate' : 'Verified Opportunities'}
            </button>
          )}

          {/* Founder specific views */}
          {currentUser?.role === 'FOUNDER' && (
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
              My Venture Story
            </button>
          )}

          {/* Reviewer / Operator specific views */}
          {currentUser?.role === 'REVIEWER' && (
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
              }}
            >
              Review Desk
            </button>
          )}

          {/* Authenticated Messaging */}
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
              Direct Chat
              {unreadCount > 0 && (
                <span
                  style={{
                    backgroundColor: '#7a5c2e',
                    color: '#fff',
                    borderRadius: '10px',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '1px 6px',
                  }}
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
                  transition: 'transform 0.15s ease',
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
